# JellyfinPlaylistExporter

This application is a rewrite of my C# based Windows desktop app [Emby and Jellyfin Playlist Exporter](https://github.com/SegiH/Emby-and-Jellyfin-Playlist-Exporter) that can be run as a web app, a Windows app or run as a web app on Android.

It is very lightweight coming at 278k total size when built.

## Web app
You can install build the Jellyfin Playlist Exporter web app using the instructions below or use the [GitHub hosted link](https://segih.github.io/JellyfinPlaylistExporter/):

## Run on Android device
You can also run this app on your Android device by running a local web server that you can get from the Google Play Store. I tested this app using the Android app AWebServer but any web server app from the Play Store should work. You need to build the web app using the build instructions below and copy the 2 files in /dist (bundle.js and index.html) to your web server root path. You will probably need to edit index.html and make sure that the path to bundle.js appears as "/bundle.js", not "/dist/bundle.js". This appears twice in index.html!

### Usage

1. Generate an API key in Jellyfin/Emby: (Dashboard->Api Keys)
1. Visit this site and enter the URL and API key for Jellyfin/Emby
1. Click on Load User Accounts. This is needed because you have to provide the user ID when getting the playlists
1. Select a user name from the user accounts dropdown and click on Load Playlists
1. Select at least 1 playlist.
1. Click on Export to save the playlist(s). You will be presented with a zip file to download which contains your playlists.

# Build Instructions

1. cd to source
1. npm install
1. npm run build
1. Copy contents of dist to your web server

# Build Windows app
1. Run build-electron.bat
1. You can then find the Windows app in release-builds\JellyfinPlaylistExporter-win32-x64

# Screenshots 

![Screenshot1](https://github.com/SegiH/JellyfinPlaylistExporter/blob/main/screenshots/PlaylistSelection.PNG)
