import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { JellyfinPlaylistExporterPage } from './jellyfinplaylistexporter.page';
import { JellyfinPlaylistExporterPageRoutingModule } from './jellyfinplaylistexporter-routing.module';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
     CommonModule,
     FormsModule,
     HttpClientModule,
     IonicModule,
     JellyfinPlaylistExporterPageRoutingModule
  ],
  declarations: [JellyfinPlaylistExporterPage]
})
export class JellyfinPlaylistExporterPageModule {}
