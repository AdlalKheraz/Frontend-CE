import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Favorite {
  id: string;
  title: string;
  description: string;
  year: string;
  civilization: string;
  image?: string;
  eventId: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080'; // URL de base de l'API
  
  private favoritesSubject = new BehaviorSubject<Favorite[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();

  constructor() {
    this.loadFavorites();
  }

  private loadFavorites(): void {
    // TODO: Implémenter l'appel API pour charger les favoris
    // Pour l'instant, on utilise des données de test
    const mockFavorites: Favorite[] = [
      {
        id: '1',
        eventId: '1',
        title: 'La Joconde',
        description: 'Portrait de Monna Lisa par Léonard de Vinci, l\'une des œuvres les plus célèbres au monde.',
        year: '1503-1506',
        civilization: 'Renaissance',
        image: 'assets/images/joconde.jpg'
      },
      {
        id: '2',
        eventId: '2',
        title: 'Construction du Colisée',
        description: 'Amphithéâtre flavien construit sous l\'Empire romain, symbole de la grandeur de Rome.',
        year: '70-80',
        civilization: 'Empire Romain',
        image: 'assets/images/colosseum.jpg'
      }
    ];
    
    this.favoritesSubject.next(mockFavorites);
  }

  getFavorites(): Observable<Favorite[]> {
    return this.favorites$;
  }

  addFavorite(eventId: string): Observable<Favorite> {
    // TODO: Implémenter l'appel API pour ajouter un favori
    return this.http.post<Favorite>(`${this.apiUrl}/favorites`, { eventId });
  }

  removeFavorite(favoriteId: string): Observable<void> {
    // TODO: Implémenter l'appel API pour supprimer un favori
    const currentFavorites = this.favoritesSubject.value;
    const updatedFavorites = currentFavorites.filter(fav => fav.id !== favoriteId);
    this.favoritesSubject.next(updatedFavorites);
    
    return this.http.delete<void>(`${this.apiUrl}/favorites/${favoriteId}`);
  }

  isFavorite(eventId: string): boolean {
    const favorites = this.favoritesSubject.value;
    return favorites.some(fav => fav.eventId === eventId);
  }
} 