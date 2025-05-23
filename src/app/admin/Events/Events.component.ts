import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { EventService, HistoricalEvent } from '../../core/services/event.service';
import { LoadingState } from '../../core/models/api.model';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './Events.component.html',
  styleUrl: './Events.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsComponent implements OnInit {
  events: HistoricalEvent[] = [];
  loading = false;
  error: string | null = null;
  
  // Propriétés de pagination
  currentPage = 1;
  itemsPerPage = 5;

  constructor(
    private router: Router,
    private eventService: EventService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  // Getter pour les événements paginés
  get paginatedEvents(): HistoricalEvent[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.events.slice(startIndex, endIndex);
  }

  // Getter pour le nombre total de pages
  get totalPages(): number {
    return Math.ceil(this.events.length / this.itemsPerPage);
  }

  // Getter pour le tableau des numéros de page
  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Getter pour les informations d'affichage
  get displayInfo() {
    if (this.events.length === 0) {
      return { start: 0, end: 0, total: 0 };
    }
    
    const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endItem = Math.min(this.currentPage * this.itemsPerPage, this.events.length);
    return {
      start: startItem,
      end: endItem,
      total: this.events.length
    };
  }

  // Méthodes de pagination
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.markForCheck();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cdr.markForCheck();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.cdr.markForCheck();
    }
  }

  // Charger tous les événements
  loadEvents(): void {
    this.eventService.events$.subscribe(state => {
      this.loading = state.loading === LoadingState.LOADING;
      this.events = state.data || [];
      this.error = state.error || null;
      
      // Réinitialiser à la première page lors du chargement
      this.currentPage = 1;
      this.cdr.markForCheck();
    });

    this.eventService.loadAllEvents().subscribe({
      next: () => {
        console.log('Événements chargés avec succès');
      },
      error: (error) => {
        console.error('Erreur lors du chargement des événements:', error);
      }
    });
  }

  // Navigation vers le Dashboard
  navigateToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  // Navigation vers les paramètres
  navigateToSettings(): void {
    this.router.navigate(['/admin/settings']);
  }

  // Déconnexion
  signOut(): void {
    this.router.navigate(['/auth/login']);
  }

  // Créer un nouvel événement
  createNewEvent(): void {
    this.router.navigate(['/admin/new-event']);
  }

  // Modifier un événement
  modifyEvent(id: string): void {
    this.router.navigate(['/admin/edit-event', id]);
  }

  // Supprimer un événement
  deleteEvent(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      this.eventService.deleteEvent(id).subscribe({
        next: () => {
          console.log('Événement supprimé avec succès');
          // La liste se mettra à jour automatiquement via l'observable
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
        }
      });
    }
  }

  // Afficher les détails d'un événement
  showEventDetails(id: string): void {
    this.router.navigate(['/admin/event-details', id]);
  }
}
