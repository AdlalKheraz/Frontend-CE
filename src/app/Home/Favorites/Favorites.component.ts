import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '@core/services/favorites.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './Favorites.component.html',
  styleUrls: ['./Favorites.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesComponent implements OnInit {
  favorites: any[] = [];
  isLoading = true;
  selectedFavorites: string[] = [];
  selectMode = false;
  
  constructor(private favoritesService: FavoritesService) {}
  
  ngOnInit() {
    // Simuler le chargement des favoris
    setTimeout(() => {
      this.favorites = [
        { id: 'evt1', name: 'Construction des Pyramides', date: '-2560', civilization: 'Égyptienne', type: 'culturel', description: 'La Grande Pyramide de Gizeh a été construite comme tombeau pour le pharaon Khéops.' },
        { id: 'evt2', name: 'Fondation de Rome', date: '-753', civilization: 'Romaine', type: 'politique', description: 'Selon la légende, Rome a été fondée par Romulus après avoir tué son frère Remus.' },
        { id: 'evt3', name: 'Bataille de Marathon', date: '-490', civilization: 'Grecque', type: 'militaire', description: 'Les Athéniens ont vaincu les Perses, empêchant leur invasion de la Grèce.' },
        { id: 'evt4', name: 'Construction du Colisée', date: '80', civilization: 'Romaine', type: 'culturel', description: 'Le Colisée était le plus grand amphithéâtre jamais construit dans l\'Empire romain.' },
        { id: 'evt5', name: 'Invention du papier', date: '105', civilization: 'Chinoise', type: 'technologique', description: 'Cai Lun a officiellement annoncé l\'invention du papier, une révolution pour la diffusion du savoir.' }
      ];
      this.isLoading = false;
    }, 800);
  }
  
  toggleSelectMode() {
    this.selectMode = !this.selectMode;
    if (!this.selectMode) {
      this.selectedFavorites = [];
    }
  }
  
  toggleSelect(id: string) {
    if (this.selectMode) {
      const index = this.selectedFavorites.indexOf(id);
      if (index > -1) {
        this.selectedFavorites.splice(index, 1);
      } else {
        this.selectedFavorites.push(id);
      }
    }
  }
  
  isSelected(id: string): boolean {
    return this.selectedFavorites.includes(id);
  }
  
  selectAll() {
    if (this.selectedFavorites.length === this.favorites.length) {
      this.selectedFavorites = [];
    } else {
      this.selectedFavorites = this.favorites.map(fav => fav.id);
    }
  }
  
  deleteSelected() {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${this.selectedFavorites.length} favoris ?`)) {
      this.isLoading = true;
      
      // Simuler la suppression
      setTimeout(() => {
        this.favorites = this.favorites.filter(fav => !this.selectedFavorites.includes(fav.id));
        this.selectedFavorites = [];
        this.selectMode = false;
        this.isLoading = false;
      }, 800);
    }
  }
  
  removeFavorite(id: string) {
    if (confirm('Êtes-vous sûr de vouloir retirer ce favori ?')) {
      this.isLoading = true;
      
      // Simuler la suppression
      setTimeout(() => {
        this.favorites = this.favorites.filter(fav => fav.id !== id);
        this.isLoading = false;
      }, 500);
    }
  }
  
  getCivilizationCount(): Map<string, number> {
    const counts = new Map<string, number>();
    this.favorites.forEach(fav => {
      const count = counts.get(fav.civilization) || 0;
      counts.set(fav.civilization, count + 1);
    });
    return counts;
  }
}