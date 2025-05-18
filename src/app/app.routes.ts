import { Routes } from '@angular/router';
import { LoginComponent } from './auth/Login/Login.component';

export const routes: Routes = [
    {
        path: '',
        component: LoginComponent
    },
    {
        path: 'home',
        loadComponent: () => import('./Home/Home.component').then(m => m.HomeComponent)
    }
];
