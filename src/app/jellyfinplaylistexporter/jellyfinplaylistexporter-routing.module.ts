import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JellyfinPlaylistExporterPage } from './jellyfinplaylistexporter.page';

const routes: Routes = [
  {
    path: '',
    component: JellyfinPlaylistExporterPage,
  }
];

@NgModule({
     imports: [RouterModule.forChild(routes)],
     exports: [RouterModule]
})
export class JellyfinPlaylistExporterPageRoutingModule {}
