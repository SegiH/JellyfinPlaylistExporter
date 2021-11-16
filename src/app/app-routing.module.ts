import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'jpe',
    loadChildren: () => import('./jellyfinplaylistexporter/jellyfinplaylistexporter.module').then( m => m.JellyfinPlaylistExporterPageModule)
  },
  {
    path: '',
    redirectTo: 'jpe',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
