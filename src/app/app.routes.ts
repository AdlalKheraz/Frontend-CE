import { Routes } from '@angular/router';
import { LoginComponent } from './auth/Login/Login.component';
import { HomeComponent } from './Home/Home.component';
import { AuthGuard } from '@core/auth/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  // Rediriger toutes les autres routes vers la page de login
  { path: '**', redirectTo: 'login' }
];
