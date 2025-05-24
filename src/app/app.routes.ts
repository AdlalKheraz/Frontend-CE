import { Routes } from '@angular/router';
import { LoginComponent } from './auth/Login/Login.component';
import { HomeComponent } from './Home/Home.component';
import { AuthGuard } from '@core/auth/guards/auth.guard';
import { DashboardComponent } from './admin/Dashboard/Dashboard.component';
import { NewEventComponent } from './admin/NewEvent/NewEvent.component';
import { SignUpComponent } from './auth/SignUp/SignUp.component';
import { EventsComponent } from './admin/Events/Events.component';
import { CommentsComponent } from './admin/Comments/Comments.component';
import { ProfileComponent } from './Home/Profile/Profile.component';
import { UsersComponent } from './admin/Users/Users.component';
import { AdminGuard } from '@core/auth/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent},
  { path: 'login', component: LoginComponent },
  { path: 'register', component: SignUpComponent },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard] // Assurez-vous que l'utilisateur est connecté
  },
  {
    path: 'admin',
    canActivate:[AdminGuard],
    children: [
      {path:'dashboard', component: DashboardComponent},
      {path: 'events', component: EventsComponent},
      {path: 'users', component: UsersComponent},
      {path: 'comments', component: CommentsComponent},
      {path: 'new-event', component: NewEventComponent},
    ]
  },
  // Rediriger toutes les autres routes vers la page de login
  { path: '**', redirectTo: 'login' }
];
