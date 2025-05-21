import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '@core/models/api.model';

@Component({
  selector: 'app-profile',
  imports: [CommonModule,DatePipe,FormsModule],
  templateUrl: './Profile.component.html',
  styleUrl: './Profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  user: User | null = null;
  isEditing = false;
  editableUser: Partial<User> = {};
  favorites: any[] = [];
  isLoading = true;
  activeTab: 'info' | 'favorites' | 'preferences' = 'info';
  
  // Ces civilisations devraient idéalement venir d'un service
  civilizations = ['Égyptienne', 'Grecque', 'Romaine', 'Maya', 'Chinoise', 'Perse', 'Mésopotamienne'];
  
  constructor() { }

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
      this.favorites = [
        { id: 'evt1', name: 'Construction des Pyramides', date: '-2560', civilization: 'Égyptienne', type: 'culturel' },
        { id: 'evt2', name: 'Fondation de Rome', date: '-753', civilization: 'Romaine', type: 'politique' },
        { id: 'evt3', name: 'Bataille de Marathon', date: '-490', civilization: 'Grecque', type: 'militaire' }
      ];
      
      this.isLoading = false;
    }, 800);
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
      this.isEditing = false;
      this.editableUser = {};
    }
  }
  
  changeTab(tab: 'info' | 'favorites' | 'preferences') {
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
  }
  
  isCivilizationPreferred(civ: string): boolean {
    return this.user?.preferences?.preferredCivilizations?.includes(civ) || false;
  }
}
