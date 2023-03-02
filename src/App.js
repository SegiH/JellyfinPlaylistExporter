import React from "react";
import { useEffect, useState } from "react";

const axios = require("axios");
const FileSaver = require("file-saver");
const JSZip = require('jszip');

import './App.css';

const App = () => {
     const [APIKey,setAPIKey] = useState('');
     const [checkedState, setCheckedState] = useState([]);
     const [currentUserID,setCurrentUserID] = useState('');
     const [demoMode] = useState(false);
     const [playlists,setPlaylists] = useState([]);
     const [playlistsLoadingStarted,setPlaylistsLoadingStarted] = useState(false);
     const [playlistsLoadingComplete,setPlaylistsLoadingComplete] = useState(false);
     const [playlistsTracksLoadingStarted,setPlaylistsTracksLoadingStarted] = useState(false);
     const [selectAllNone,setSelectAllNone] = useState(false);
     const [URL,setURL] = useState('');
     const [userAccounts,setUserAccounts] = useState([]);
     const [userAccountsLoaded,setUserAccountsLoaded] = useState(false);

     const zip = new JSZip();

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

          // Get all playlist items for the selected playlists
          await Promise.all(
               selectedPlaylists.map(async (currentPlaylist) => {
                    const playlistAPI=`${URL}Playlists/${currentPlaylist.Id}/Items?Fields=Path&userId=${currentUserID}&api_key=${APIKey}`;

                    const result = 
                         await axios.get(playlistAPI).then(playlistItemsData => {
                              return playlistItemsData.data.Items;
                         },
                         error => {
                              alert(`An error occurred getting the playlist items with the error ${error.message}`);
                         })

                    let fileData=`#EXTM3U${newlineDelimeter}#Playlist name: ${currentPlaylist.Name}${newlineDelimeter}`;

                    result.forEach(playlistTrack => {
                         const duration=Math.round(parseFloat(playlistTrack['RunTimeTicks'])*0.0000001);
          
                         fileData+=`#EXTALB:${playlistTrack['Album']}${newlineDelimeter}#EXTART:${playlistTrack['Artists'][0]}${newlineDelimeter}#EXTINF:${duration},${playlistTrack['Name']}${newlineDelimeter}${playlistTrack['Path']}${newlineDelimeter}`
                    });

                    // Create blob and add to zip
                    const blob = new Blob([fileData], { type: 'text/plain' });
                    zip.file(`${currentPlaylist.Name}.m3u8`, blob);
               })
          );

          // Serve the zip file using async
          zip.generateAsync({ type: 'blob' }).then((content) => {
               const name="playlists.zip";

               if (content)
                    FileSaver.saveAs(content, name);
          });

          setPlaylistsTracksLoadingStarted(false);
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

          await axios.get(`${URL}Users/${currentUserID}/Items?format=json&Recursive=true&IncludeItemTypes=Playlist&api_key=${APIKey}`)
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

          await axios.get(`${currentURL}Users?format=json&api_key=${APIKey}`)
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
                                             <button className="button" onClick={exportPlaylistsClickHandler}>Export</button>
                                        }
                                   </span>
                              </div>
                         </div>
                    </>
               }
          </>
     );
}

export default App;