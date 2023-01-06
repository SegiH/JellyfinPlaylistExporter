# JellyfinPlaylistExporter

This application is a rewrite of my Windows desktop app [Emby and Jellyfin Playlist Exporter](https://github.com/SegiH/Emby-and-Jellyfin-Playlist-Exporter) that can be run online instead of as a Desktop app.

This app is 100% client based and does not require a server to run. The only server side requests that are made are to get the user accounts, playlists and playlist contents.

## Use Online
You can install Emby and Jellyfin Playlist Exporter or use my online link [here](https://segih.github.io/JellyfinPlaylistExporter/):

### Usage

1. Generate an API key in Jellyfin/Emby: (Dashboard->Api Keys)
1. Visit this site and enter the URL and API key for Jellyfin/Emby
1. Click on Load User Accounts. This is needed because you have to provide the user ID when getting the playlists
1. Select a user name from the user accounts dropdown and click on Load Playlists
1. Select at least 1 playlist. You can select more than 1 at a time by holding Ctrl after clicking on the first playlist.
1. Click on Export to save the playlist(s). You will be presented with a zip file to download which contains your playlists.

# Screenshots 

![Screenshot1](https://github.com/SegiH/JellyfinPlaylistExporter/blob/main/screenshots/PlaylistSelection.PNG)
