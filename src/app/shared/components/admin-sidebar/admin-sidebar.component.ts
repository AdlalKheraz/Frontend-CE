import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { User } from '@app/core/auth/auth.service';
import { AuthService } from '@core/auth/auth.service';
import { generateAvatar } from '@core/avatar/avatar.lib';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss'
})
export class AdminSidebarComponent implements OnInit {
  @Input() activePage: 'dashboard' | 'events' | 'users' | 'comments' | 'settings'|'civilizations' = 'dashboard';
  
  private router = inject(Router);
  private authService = inject(AuthService);
  
  currentUser: User | null = null;
  avatar=generateAvatar(this.currentUser?.firstName || 'default');

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.authService.authState$.subscribe(state => {
      this.currentUser = state.user;
      this.avatar=generateAvatar(state.user?.firstName || 'default');

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