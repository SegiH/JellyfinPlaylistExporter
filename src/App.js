import React from "react";
import { useEffect, useState } from "react";

const axios = require("axios");
const FileSaver = require("file-saver");
const JSZip = require('jszip');

import './App.css';

// Newer Jellyfin versions reject the api_key query parameter, so send the key as a header instead
const authHeaders = (apiKey) => ({ Authorization: `MediaBrowser Token="${apiKey.trim()}"` });

// Make a string safe to use as a file or folder name on Windows, macOS, Linux and FAT/exFAT sticks
const sanitize = (value) => String(value ?? '')
     .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
     .replace(/\s+/g, ' ')
     .trim()
     .replace(/[. ]+$/, '');

const getExtension = (path) => {
     const match = /\.([A-Za-z0-9]{1,5})$/.exec(path || '');

     return match ? match[1].toLowerCase() : 'bin';
}

const App = () => {
     const [APIKey,setAPIKey] = useState('');
     const [checkedState, setCheckedState] = useState([]);
     const [currentUserID,setCurrentUserID] = useState('');
     const [demoMode] = useState(false);
     const [includeMedia,setIncludeMedia] = useState(true);
     const [playlists,setPlaylists] = useState([]);
     const [playlistsLoadingStarted,setPlaylistsLoadingStarted] = useState(false);
     const [playlistsLoadingComplete,setPlaylistsLoadingComplete] = useState(false);
     const [playlistsTracksLoadingStarted,setPlaylistsTracksLoadingStarted] = useState(false);
     const [progress,setProgress] = useState('');
     const [selectAllNone,setSelectAllNone] = useState(false);
     const [URL,setURL] = useState('');
     const [userAccounts,setUserAccounts] = useState([]);
     const [userAccountsLoaded,setUserAccountsLoaded] = useState(false);

     const exportPlaylistsClickHandler = async () => {
          const newlineDelimeter=`\r\n`;

          if (demoMode) {
               alert("You cannot export when using demo mode");
               return;
          }

          if (playlistsTracksLoadingStarted) {
               alert("Please wait until the current export is complete");
               return;
          }

          const selectedPlaylistIds=Object.keys(checkedState).filter(playlistId => checkedState[playlistId] === true);

          if (selectedPlaylistIds.length === 0) {
               alert("Please select at least 1 playlist");
               return;
          }

          const selectedPlaylists = selectedPlaylistIds.map((selectedPlaylist) => playlists.filter(currentPlaylist => currentPlaylist['Id'] === selectedPlaylist)).map(currentPlaylist => currentPlaylist[0]);

          setPlaylistsTracksLoadingStarted(true);

          // A new archive per export, so repeated exports don't pile up in the same ZIP
          const zip = new JSZip();
          const failures = [];

          try {
               // Playlists and tracks are processed one after another to keep memory use and server load low
               for (const currentPlaylist of selectedPlaylists) {
                    let items;

                    try {
                         setProgress(`Loading playlist "${currentPlaylist.Name}"...`);

                         const playlistItemsData = await axios.get(`${URL}Playlists/${currentPlaylist.Id}/Items?Fields=Path&userId=${currentUserID}`, { headers: authHeaders(APIKey) });

                         items = playlistItemsData.data.Items;
                    } catch (error) {
                         alert(`An error occurred getting the playlist items with the error ${error.message}`);
                         continue;
                    }

                    const playlistFolder = sanitize(currentPlaylist.Name) || currentPlaylist.Id;
                    const padding = Math.max(3, String(items.length).length);

                    let fileData=`#EXTM3U${newlineDelimeter}#Playlist name: ${currentPlaylist.Name}${newlineDelimeter}`;

                    for (let index = 0; index < items.length; index++) {
                         const playlistTrack = items[index];
                         const artist = (playlistTrack['Artists'] && playlistTrack['Artists'][0]) || '';
                         const duration = Math.round(parseFloat(playlistTrack['RunTimeTicks']) * 0.0000001);

                         let entryPath = playlistTrack['Path'];

                         if (includeMedia) {
                              // Numbered file names keep the playlist order on players that sort by name
                              const trackName = [artist, playlistTrack['Name']].filter(Boolean).map(sanitize).join(' - ');
                              const fileName = `${String(index + 1).padStart(padding, '0')} - ${trackName}.${getExtension(playlistTrack['Path'])}`;

                              setProgress(`"${currentPlaylist.Name}": downloading track ${index + 1} of ${items.length} - ${playlistTrack['Name']}`);

                              try {
                                   const response = await axios.get(`${URL}Items/${playlistTrack['Id']}/Download`, { responseType: 'blob', headers: authHeaders(APIKey) });

                                   zip.file(`${playlistFolder}/${fileName}`, response.data, { binary: true });
                              } catch (error) {
                                   // Skip the track in the playlist as well and report it at the end
                                   failures.push(`${currentPlaylist.Name}: ${playlistTrack['Name']} (${error.message})`);
                                   continue;
                              }

                              // Relative path, so the playlist keeps working from the folder it is extracted to
                              entryPath = `${playlistFolder}/${fileName}`;
                         }

                         fileData+=`#EXTALB:${playlistTrack['Album'] ?? ''}${newlineDelimeter}#EXTART:${artist}${newlineDelimeter}#EXTINF:${Number.isFinite(duration) ? duration : -1},${playlistTrack['Name']}${newlineDelimeter}${entryPath}${newlineDelimeter}`;
                    }

                    // Create blob and add to zip
                    const blob = new Blob([fileData], { type: 'text/plain' });
                    zip.file(`${playlistFolder}.m3u8`, blob);
               }

               if (Object.keys(zip.files).length === 0) {
                    alert("Nothing was exported");
                    return;
               }

               // Audio and video are already compressed, so store the files without compressing them again
               const content = await zip.generateAsync({ type: 'blob', compression: 'STORE', streamFiles: true }, (metadata) => {
                    setProgress(`Creating ZIP file... ${Math.round(metadata.percent)}%`);
               });

               if (content)
                    FileSaver.saveAs(content, "playlists.zip");

               if (failures.length > 0)
                    alert(`${failures.length} track(s) could not be downloaded and were skipped:\n\n${failures.join('\n')}`);
          } catch (error) {
               alert(`An error occurred during the export: ${error.message}`);
          } finally {
               setProgress('');
               setPlaylistsTracksLoadingStarted(false);
          }
     }

     const isChecked = (playlistId) => {
          return selectAllNone === true ? true : checkedState[playlistId];
     }

     const loadPlaylistsClickHandler = async () => {
          if (currentUserID === '') {
               alert("Please select the current user");
               return;
          }

          if (playlistsLoadingStarted)
               return;

          setPlaylistsLoadingStarted(true);

          await axios.get(`${URL}Users/${currentUserID}/Items?format=json&Recursive=true&IncludeItemTypes=Playlist`, { headers: authHeaders(APIKey) })
          .then(playlistsResponse=> {
               const playlists = playlistsResponse.data.Items.sort((a,b)=>{
                    return a.Name.localeCompare(b.Name);
               });

               setPlaylists(playlists);

               setPlaylistsLoadingComplete(true);
          })
          .catch(err=> {
               alert(`An error occurred getting the playlists with the error ${err}`);
          });
     }

     const loadUserAccountsClickHandler = async () => {
          if (URL === '' || APIKey === '') {
               alert("Please enter the URL API Key");
               return;
          }

          let currentURL=URL;

          if (!currentURL.trim().endsWith('/')) {
               currentURL+= '/';
               setURL(currentURL);
          }

          await axios.get(`${currentURL}Users?format=json`, { headers: authHeaders(APIKey) })
          .then(res=> {
               setUserAccounts(res.data);
               setUserAccountsLoaded(true);
          })
          .catch(err=> {
               alert(`An error occurred getting the user accounts with the error ${err}`);
          })
     }

     const setSelected = (playlistId,isChecked) => {
          checkedState[playlistId]=isChecked;

          setCheckedState(checkedState);
     }

     const selectAllNoneChanged = (event) => {
          setSelectAllNone(event.target.checked);

          playlists.map((playlist) => {
               setSelected(playlist["Id"],event.target.checked);
          });
     }

     // Demo mode
     useEffect(() => {
          if (demoMode) {
               setURL(`https://media.domain.com`);
               setAPIKey(`YOURAPIKEY`);
               setCurrentUserID('abceasyas123abcde123456789');
               setUserAccounts(JSON.parse(`[{"Name":"Some User","Id":"abceasyas123abcde123456789"},{"Name":"Some Other User","Id":"fedcbasyas123abcde123456789"}]`));
               setUserAccountsLoaded(true);

               const demoPlaylists=[
                    {'Name': 'Classic Rock', 'ID': 1},
                    {'Name': 'Alternative', 'ID': 2},
                    {'Name': 'Jazz', 'ID': 3},
                    {'Name': 'Rush', 'ID': 4}
               ];

               setPlaylists(demoPlaylists);
               setPlaylistsLoadingComplete(true);
               setSelectAllNone(false);
          }
     },[demoMode]);

     return (
          <>
               <div className="title">
                    <div className="titleLabel">Jellyfin Playlist Explorer</div>
               </div>

               <div className="grid">
                    <div className="gridRow">
                         <span>
                              <div className="label">Jellyfin URL:</div>
                         </span>

                         <span>
                              <input className="input" type="input" value={URL} onChange={(event) => setURL(event.target.value)}></input>
                         </span>
                    </div>
               </div>

               <div className="grid">
                    <div className="gridRow">
                         <span>
                              <div className="label">API Key:</div>
                         </span>

                         <span>
                              <input className="input" type="input" value={APIKey} onChange={(event) => setAPIKey(event.target.value)}></input>
                         </span>

                         <span>
                              <button className="button" onClick={loadUserAccountsClickHandler}>Load User Accounts</button>
                         </span>
                    </div>
               </div>

               {userAccountsLoaded &&
                    <div className="grid">
                         <div className="gridRow">
                              <span>
                                   <div className="label">User Accounts:</div>
                              </span>

                              <span>
                                   <div>
                                        <select className="input" value={currentUserID} onChange={(event) => setCurrentUserID(event.target.value)}>
                                             <option value={''}>Please select</option>

                                             {userAccounts.map((userAccount,index) => {
                                                  return (
                                                       <option key={index} value={userAccount["Id"]}>
                                                            {userAccount["Name"]}
                                                       </option>
                                                  )
                                             })}
                                        </select>
                                   </div>
                              </span>

                              <span>
                                   <button className="button" onClick={loadPlaylistsClickHandler}>Load Playlists</button>
                              </span>
                         </div>
                    </div>
               }

               {playlistsLoadingComplete &&
                    <>
                         <div className="grid">
                              <div className="gridRow">
                                   <span>
                                        <div className="label">Select All/None:</div>
                                   </span>

                                   <span>
                                        <input type="checkbox" value={selectAllNone} onChange={(event) => selectAllNoneChanged(event)} />
                                   </span>
                              </div>
                         </div>

                         <div className="grid">
                              <div className="gridRow">
                                   <span className="border playlists">
                                        {playlists.length > 0 && playlists.map((playlist,index) => {
                                             return (
                                                  <React.Fragment key={index}>
                                                       <input type="checkbox" id={`custom-checkbox-${playlist["Id"]}`} name={playlist["Id"]} value={playlist["Id"]} checked={isChecked([playlist["Id"]])} onChange={(event) => setSelected(playlist["Id"],event.target.checked)} />
                                                       <label htmlFor={`custom-checkbox-${playlist["Id"]}`}>{playlist["Name"]}</label>
                                                       <br />
                                                  </React.Fragment>
                                             )
                                        })}
                                   </span>

                                   <span>
                                        {(playlistsLoadingStarted === false || (playlistsLoadingStarted  === true && !playlistsLoadingComplete === false)) &&
                                             <>
                                                  <button className="button" onClick={exportPlaylistsClickHandler} disabled={playlistsTracksLoadingStarted}>Export</button>
                                                  <br />
                                                  <label htmlFor="include-media">
                                                       <input type="checkbox" id="include-media" checked={includeMedia} onChange={(event) => setIncludeMedia(event.target.checked)} />
                                                       Include media files
                                                  </label>
                                             </>
                                        }
                                   </span>
                              </div>
                         </div>

                         {progress !== '' &&
                              <div className="grid">
                                   <div className="gridRow">
                                        <span>
                                             <div className="label">{progress}</div>
                                        </span>
                                   </div>
                              </div>
                         }
                    </>
               }
          </>
     );
}

export default App;
