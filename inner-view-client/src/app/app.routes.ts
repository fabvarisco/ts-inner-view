import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'inner-view-page/:id',
    loadComponent: () => import('./inner-view-page/inner-view-page.page').then( m => m.InnerViewPagePage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage)
  },
  {
    path: 'embed/:id',
    loadComponent: () => import('./embed/embed.page').then(m => m.EmbedPage)
  },
  {
    path: '**',
    redirectTo: 'home'
  },
];
