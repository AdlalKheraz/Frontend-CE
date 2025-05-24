import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { User } from '@app/core/auth/auth.service';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss']
})
export class AdminSidebarComponent implements OnInit {
  @Input() activePage: 'dashboard' | 'events' | 'users' | 'comments' | 'settings' = 'dashboard';
  
  private router = inject(Router);
  private authService = inject(AuthService);
  
  currentUser: User | null = null;

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.authService.authState$.subscribe(state => {
      this.currentUser = state.user;
    });
  }

  navigateTo(route: string): void {
    this.router.navigateByUrl(route);
  }

  signOut(): void {
    this.authService.signOut();
    this.router.navigate(['/login']);
  }
} 