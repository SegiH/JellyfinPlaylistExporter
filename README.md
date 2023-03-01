# JellyfinPlaylistExporter

This application is a rewrite of my Windows desktop app [Emby and Jellyfin Playlist Exporter](https://github.com/SegiH/Emby-and-Jellyfin-Playlist-Exporter) that can be run online instead of as a Desktop app.

This app is 100% client based and does not require a server to run. The only connections that are made are to your own media server to get the user accounts, playlists and playlist contents.

It is very lightweight coming at 273k total size when built.

## Use Online
You can install Jellyfin Playlist Exporter or use my online link [here](https://segih.github.io/JellyfinPlaylistExporter/):

## Run on your own Android device
You can also run this app on your Android device by running a local web server. I tested this app using the Android app AWebServer but any web server app from the Play Store should work. You need to build the app and copy the 2 files in /dist (bundle.js and index.html) to your web server. You will probably need to edit index.html and make sure that the path to bundle.js appears as "/bundle.js", not "/dist/bundle.js". This appears twice in index.html!

### Usage

1. Generate an API key in Jellyfin/Emby: (Dashboard->Api Keys)
1. Visit this site and enter the URL and API key for Jellyfin/Emby
1. Click on Load User Accounts. This is needed because you have to provide the user ID when getting the playlists
1. Select a user name from the user accounts dropdown and click on Load Playlists
1. Select at least 1 playlist.
1. Click on Export to save the playlist(s). You will be presented with a zip file to download which contains your playlists.

# Screenshots 

![Screenshot1](https://github.com/SegiH/JellyfinPlaylistExporter/blob/main/screenshots/PlaylistSelection.PNG)
