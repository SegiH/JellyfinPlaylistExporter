import { Component, OnInit } from '@angular/core';
import { throwError } from 'rxjs/';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ToastController } from '@ionic/angular';

import * as JSZip from 'jszip';
import * as FileSaver from 'file-saver';
@Component({
     selector: 'app-home',
     templateUrl: 'jellyfinplaylistexporter.page.html',
     styleUrls: ['jellyfinplaylistexporter.page.scss'],
})
export class JellyfinPlaylistExporterPage implements OnInit {
     APIKey: string = "";
     currentUserID: string = '';
     demoMode = false;
     playlists: any[] = [];
     playlistsLoaded = false;
     selectAllNone = false;
     URL: string = "";
     userAccounts: string[];     
     userAccountsLoaded = false;
     
     constructor(private http: HttpClient, public toastController: ToastController) {}

     ngOnInit() {
          this.loadPlaylists.bind(this);

          if (this.demoMode) {
               this.URL = `https://media.domain.com`;
               this.APIKey = `YOURAPIKEY`;               
               this.currentUserID = 'abceasyas123cd';
               this.userAccounts=JSON.parse(`[{"Name":"Some User","Id":"abceasyas123abcde123456789"},{"Name":"Some Other User","Id":"fedcbasyas123abcde123456789"}]`);
               this.playlistsLoaded = true;
               this.userAccountsLoaded = true;

               this.playlists=[];
           
               this.playlists.push({'Name': 'Classic Rock', 'ID': 1, 'PlaylistTracks': []});
               this.playlists.push({'Name': 'Alternative', 'ID': 2, 'PlaylistTracks': []});
               this.playlists.push({'Name': 'Jazz', 'ID': 3, 'PlaylistTracks': []});
               this.playlists.push({'Name': 'Rush', 'ID': 4, 'PlaylistTracks': []});
          }
     }

     exportPlaylists() { 
          const newlineDelimeter=`\r\n`;
          const name = 'playlists.zip';
          const zip = new JSZip();
          var result = [];

          this.playlists.forEach ((playlist) => {
               if (playlist['Checked'] != null &&  playlist['Checked'] == true)
                    result.push(playlist['Name']);
          })
      
          if (result.length === 0) {
               this.showToast("Please select at least 1 playlist");
               return;
          }

          // Loop through each playlist
          result.forEach(currentPlaylist => {
               // Currently selected playlist object
               const currentPlaylistItem=this.playlists.filter(playlistItem => playlistItem['Name']==currentPlaylist);
           
               let fileData=`#EXTM3U${newlineDelimeter}#Playlist name: ${currentPlaylistItem[0].Name}${newlineDelimeter}`
                          
               currentPlaylistItem[0]['PlaylistTracks'].forEach(playlistTrack => {
                    const duration=Math.round(parseFloat(playlistTrack['RunTimeTicks'])*0.0000001);

                    fileData+=`#EXTALB:${playlistTrack['Album']}${newlineDelimeter}#EXTART:${playlistTrack['Artists'][0]}${newlineDelimeter}#EXTINF:${duration},${playlistTrack['Name']}${newlineDelimeter}${playlistTrack['Path']}${newlineDelimeter}`
               });
           
               // Create blob and add to zip
               const blob = new Blob([fileData], { type: 'text/plain' });
               zip.file(`${currentPlaylistItem[0].Name}.m3u8`, blob);               
           
               //saveAs(blob, `${currentPlaylistItem[0].Name}.txt`); 
          });

          // Serve the zip file using async
          zip.generateAsync({ type: 'blob' }).then((content) => {  
               if (content)
                    FileSaver.saveAs(content, name);
          });
     }

     loadPlaylists() {
          if (this.currentUserID === null || this.currentUserID === "") {
               this.showToast("Please select the user account");
               return;
          }
          const APIURL=`${this.URL}Users/${this.currentUserID}/Items`;

          let params = new HttpParams();
          params = params.append('format','json');
          params = params.append('Recursive','true');
          params = params.append('IncludeItemTypes','Playlist');
          params = params.append('api_key',this.APIKey);

          this.http.get<any>(APIURL,{params: params}).subscribe((playlists: any[]) => {
               this.playlists=[];
       
               // Loop through each playlist
               playlists['Items'].forEach(playlistItem => {
                    // Get playlist items
                    const playlistAPI=`${this.URL}Playlists/${playlistItem.Id}/Items?Fields=Path&userId=${this.currentUserID}&api_key=${this.APIKey}`;
            
                    this.http.get<any>(playlistAPI).subscribe((playlistItemsData: any[]) => {
                         // Add playlist name, ID and playlist tracks
                         this.playlists.push({'Name': playlistItem['Name'], 'ID': playlistItem['Id'], 'PlaylistTracks': playlistItemsData['Items']});

                         this.playlists = this.playlists.sort((a,b)=>{
                              return a.Name.localeCompare(b.Name);
                         });
                    },
                    error => {
                         throwError("An error occurred getting the playlist items");
                         this.showToast(`An error occurred getting the playlist items with the error ${error.message}`);
                    });
               });

               this.playlistsLoaded=true;
          },
          error => {
               throwError("An error occurred getting the playlists");
               this.showToast(`An error occurred getting the playlists with the error ${error.message}`);
          });
     }

     loadUserAccounts() {
          if (this.URL === null || this.URL === "") {
              this.showToast("Please enter the URL of your instance of Jellyfin/Emby instance");
              return;
          }

          if (this.APIKey === null || this.APIKey === "") {
               this.showToast("Please enter the API Key from your instance of Jellyfin/Emby instance");
               return;
          }

          if (this.URL.slice(-1) != '/')
               this.URL+='/';

          const APIURL=`${this.URL}Users?format=json&api_key=${this.APIKey}`

          this.http.get<any>(APIURL).subscribe((userAccounts: any[]) => {  
               this.userAccounts=userAccounts;

               this.userAccountsLoaded=true;
          },
          error => {
               throwError("An error occurred getting the user accounts");

               let message="";

               if (error.message.includes("401 Unauthorized" ) || error.statusText == "Unknown Error") 
                    message="Unable to get user accounts. Please check the Jellyfin URL and API key";
               else
                    message=error.message;

               this.showToast(`${message}`);
          });
     }

     selectAllNoneChanged() {
          this.playlists.forEach ((playlist) => {
               playlist['Checked'] = this.selectAllNone;
          })
     }

     async showToast(message: string) {
          const toast = await this.toastController.create({
               message: message,
               duration: 3000
          });
          toast.present();
     }

     // Used to prevent the entire DOM tree from being re-rendered every time that there is a change
     trackByFn(index, item) {
          return index; // or item.id
     }
}
