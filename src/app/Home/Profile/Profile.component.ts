import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { generateAvatar } from '@core/avatar/avatar.lib';

interface User {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  avatar?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './Profile.component.html',
  styleUrls: ['./Profile.component.scss']
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  user: User | null = null;
  avatar = generateAvatar(this.user?.firstName || 'default');
  editableUser: User = {};
  isLoading = true;
  isEditing = false;
  showDeleteConfirmation = false;

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.authService.fetchCurrentUserFromToken().subscribe({
      next: (user) => {
        if (user) {
          this.user = user;
          this.avatar = generateAvatar(user?.firstName || 'default');
          this.editableUser = { ...user };
        } else {
          this.router.navigate(['/login']);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du profil:', error);
        this.isLoading = false;
        this.router.navigate(['/login']);
      }
    });
  }

  startEditing(): void {
    this.isEditing = true;
    this.editableUser = { ...this.user };
  }

  updateUserFromAuthService(): void {
    if (!this.user?.id) {
      console.error('ID utilisateur manquant');
      return;
    }

    const updateData = {
      firstName: this.editableUser.firstName,
      lastName: this.editableUser.lastName,
      email: this.editableUser.email
    };

    this.authService.updateUser(this.user.id, updateData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.avatar = generateAvatar(updatedUser?.firstName || 'default');
        this.editableUser = { ...updatedUser };
        this.isEditing = false;
        console.log('Profil mis à jour avec succès via AuthService');
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour via AuthService:', error);
      }
    });
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.editableUser = { ...this.user };
  }

  deleteAccount(): void {
    if (!this.user?.id) {
      console.error('ID utilisateur manquant');
      return;
    }
    this.authService.deleteMeUser().subscribe({
      next: () => {
        console.log('Compte supprimé avec succès');
        this.authService.signOut();
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Erreur lors de la suppression du compte:', error);
      }
    });
  }

  logout(): void {
    this.authService.signOut();
    this.router.navigate(['/']);
  }
}
