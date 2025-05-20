import { Routes } from '@angular/router';
import { LoginComponent } from './auth/Login/Login.component';
import { HomeComponent } from './Home/Home.component';
import { AuthGuard } from '@core/auth/guards/auth.guard';
import { DashboardComponent } from './admin/Dashboard/Dashboard.component';
import { NewEventComponent } from './admin/NewEvent/NewEvent.component';
import { SignUpComponent } from './auth/SignUp/SignUp.component';
import { EventsComponent } from './admin/Events/Events.component';
import { CommentsComponent } from './admin/Comments/Comments.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: SignUpComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  {
    path: 'admin',
    children: [
      {path:'dashboard', component: DashboardComponent},
      {path: 'events', component: EventsComponent},
      {path: 'comments', component: CommentsComponent},
      {path: 'new-event', component: NewEventComponent},
    ]
  },
  // Rediriger toutes les autres routes vers la page de login
  { path: '**', redirectTo: 'login' }
];
