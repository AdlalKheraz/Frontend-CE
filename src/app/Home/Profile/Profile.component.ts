import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { Favorite, FavoritesService } from '@core/services/favorites.service';
import { UpdateUserRequest, UserService } from '@core/services/user.service';
import { Subscription } from 'rxjs';

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
export class ProfileComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private favoritesService = inject(FavoritesService);
  private userService = inject(UserService);

  user: User | null = null;
  editableUser: User = {};
  isLoading = true;
  isEditing = false;
  activeTab = 'account';
  userMenuOpen = false;
  showDeleteConfirmation = false;

  favorites: Favorite[] = [];
  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadFavorites();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.authService.fetchCurrentUserFromToken().subscribe({
      next: (user) => {
        if (user) {
          this.user = user;
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

  loadFavorites(): void {
    const favoritesSubscription = this.favoritesService.getFavorites().subscribe({
      next: (favorites) => {
        this.favorites = favorites;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des favoris:', error);
      }
    });
    
    this.subscriptions.add(favoritesSubscription);
  }

  changeTab(tab: string): void {
    this.activeTab = tab;
    this.userMenuOpen = false;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  startEditing(): void {
    this.isEditing = true;
    this.editableUser = { ...this.user };
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.editableUser = { ...this.user };
  }

  saveProfile(): void {
    if (!this.user?.id) {
      console.error('ID utilisateur manquant');
      return;
    }

    const updateData: UpdateUserRequest = {
      firstName: this.editableUser.firstName,
      lastName: this.editableUser.lastName,
      email: this.editableUser.email
    };

    this.userService.updateUserProfile(this.user.id, updateData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.editableUser = { ...updatedUser };
        this.isEditing = false;
        console.log('Profil mis à jour avec succès');
      },
      error: (error) => {
        console.error('Erreur lors de la sauvegarde du profil:', error);
        // Ici, vous pourriez afficher un message d'erreur à l'utilisateur
      }
    });
  }

  deleteAccount(): void {
    if (!this.user?.id) {
      console.error('ID utilisateur manquant');
      return;
    }

    this.userService.deleteUser(this.user.id).subscribe({
      next: () => {
        console.log('Compte supprimé avec succès');
        this.authService.signOut();
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Erreur lors de la suppression du compte:', error);
        // Ici, vous pourriez afficher un message d'erreur à l'utilisateur
      }
    });
  }

  viewEvent(eventId: string): void {
    // TODO: Naviguer vers la vue détaillée de l'événement
    console.log('Voir l\'événement:', eventId);
    this.router.navigate(['/home'], { fragment: eventId });
  }

  removeFavorite(favoriteId: string): void {
    this.favoritesService.removeFavorite(favoriteId).subscribe({
      next: () => {
        console.log('Favori supprimé avec succès');
        // La liste sera automatiquement mise à jour via l'observable
      },
      error: (error) => {
        console.error('Erreur lors de la suppression du favori:', error);
        // En cas d'erreur, on peut afficher un message à l'utilisateur
      }
    });
  }

  logout(): void {
    this.authService.signOut();
    this.router.navigate(['/']);
  }
}
