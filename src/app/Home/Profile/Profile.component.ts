import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { User } from '@core/models/api.model';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink],
  templateUrl: './Profile.component.html',
  styleUrl: './Profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  isEditing = false;
  editableUser: Partial<User> = {};
  favorites: any[] = [];
  isLoading = true;
  activeTab: 'info' | 'favorites' | 'preferences' | 'security' = 'info';
  showDeleteConfirmation = false;
  deleteConfirmText = '';
  
  // Ces civilisations devraient idéalement venir d'un service
  civilizations = ['Égyptienne', 'Grecque', 'Romaine', 'Maya', 'Chinoise', 'Perse', 'Mésopotamienne'];
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    // Simuler le chargement des données utilisateur
    setTimeout(() => {
      this.user = {
        id: '1',
        username: 'chronoexplorer',
        email: 'utilisateur@exemple.fr',
        avatar: 'assets/images/default-avatar.png',
        fullName: 'Jean Dupont',
        bio: 'Passionné d\'histoire et de civilisations anciennes. J\'adore explorer les événements historiques à travers le temps.',
        dateJoined: new Date('2023-01-15'),
        favorites: ['evt1', 'evt2', 'evt3'],
        preferences: {
          theme: 'auto',
          emailNotifications: true,
          preferredCivilizations: ['Égyptienne', 'Romaine']
        }
      };
      
      // Simuler récupération des favoris
      this.loadFavorites();
      
      this.isLoading = false;
    }, 800);
  }

  loadFavorites() {
    // Simuler la récupération des favoris
    this.favorites = [
      { id: 'evt1', name: 'Construction des Pyramides', date: '-2560', civilization: 'Égyptienne', type: 'culturel' },
      { id: 'evt2', name: 'Fondation de Rome', date: '-753', civilization: 'Romaine', type: 'politique' },
      { id: 'evt3', name: 'Bataille de Marathon', date: '-490', civilization: 'Grecque', type: 'militaire' }
    ];
  }

  startEditing() {
    if (this.user) {
      this.editableUser = { ...this.user };
      this.isEditing = true;
    }
  }

  cancelEditing() {
    this.isEditing = false;
    this.editableUser = {};
  }

  saveProfile() {
    if (this.user && this.editableUser) {
      this.user = { ...this.user, ...this.editableUser };
      // Ici, vous ajouteriez l'appel à votre service pour sauvegarder les modifications
      this.isLoading = true;
      
      setTimeout(() => {
        this.isLoading = false;
        this.isEditing = false;
        this.editableUser = {};
        // Afficher un message de succès
      }, 800);
    }
  }
  
  changeTab(tab: 'info' | 'favorites' | 'preferences' | 'security') {
    this.activeTab = tab;
  }
  
  removeFavorite(id: string) {
    // Supprimer le favori de la liste
    this.favorites = this.favorites.filter(fav => fav.id !== id);
    
    // Mettre à jour la liste des favoris de l'utilisateur
    if (this.user && this.user.favorites) {
      this.user.favorites = this.user.favorites.filter(favId => favId !== id);
      // Ici, vous feriez un appel API pour mettre à jour les favoris
    }
  }
  
  toggleCivilizationPreference(civ: string) {
    if (!this.user?.preferences) return;
    
    let prefCivs = this.user.preferences.preferredCivilizations || [];
    
    if (prefCivs.includes(civ)) {
      prefCivs = prefCivs.filter(c => c !== civ);
    } else {
      prefCivs = [...prefCivs, civ];
    }
    
    this.user.preferences.preferredCivilizations = prefCivs;
    // Ici, vous feriez un appel API pour mettre à jour les préférences
    
    this.savePreferences();
  }
  
  savePreferences() {
    // Simuler la sauvegarde des préférences
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      // Afficher un message de succès
    }, 800);
  }
  
  isCivilizationPreferred(civ: string): boolean {
    return this.user?.preferences?.preferredCivilizations?.includes(civ) || false;
  }
  
  logout() {
    // Déconnexion de l'utilisateur
    this.isLoading = true;
    
    setTimeout(() => {
      this.authService.signOut();
      this.router.navigate(['/login']);
    }, 500);
  }
  
  showDeleteAccount() {
    this.showDeleteConfirmation = true;
  }
  
  cancelDeleteAccount() {
    this.showDeleteConfirmation = false;
    this.deleteConfirmText = '';
  }
  
  confirmDeleteAccount() {
    if (this.deleteConfirmText === this.user?.username) {
      // Supprimer le compte
      this.isLoading = true;
      
      setTimeout(() => {
        this.authService.signOut();
        this.router.navigate(['/login']);
        // Afficher un message de confirmation
      }, 1000);
    }
  }
  
  goToFavoritesPage() {
    this.router.navigate(['/favorites']);
  }
}
