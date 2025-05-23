import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EventService, HistoricalEvent } from '../../core/services/event.service';
import { LoadingState } from '../../core/models/api.model';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './Events.component.html',
  styleUrl: './Events.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsComponent implements OnInit {
  events: HistoricalEvent[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private router: Router,
    private eventService: EventService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  // Charger tous les événements
  loadEvents(): void {
    this.eventService.events$.subscribe(state => {
      this.loading = state.loading === LoadingState.LOADING;
      this.events = state.data || [];
      this.error = state.error || null;
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
      // TODO: Implémenter la méthode deleteEvent dans le service
      // Pour l'instant, on supprime localement
      this.events = this.events.filter(event => event.id !== id);
      this.cdr.markForCheck();
      
      // Dans un cas réel, vous devriez appeler le service :
      this.eventService.deleteEvent(id).subscribe({
        next: () => {
          this.loadEvents(); // Recharger la liste
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
