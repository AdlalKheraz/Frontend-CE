import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LoadingState } from '../../core/models/api.model';
import { EventService, HistoricalEvent } from '../../core/services/event.service';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar.component';
import { MediaService, Media } from '../../core/services/media.service';
import { CivilizationService, Civilization } from '../../core/services/civilization.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminSidebarComponent],
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

  // Propriétés pour le popup de détails
  showDetailsPopup = false;
  selectedEvent: HistoricalEvent | null = null;
  selectedEventMedia: Media[] = [];
  selectedEventCivilization: Civilization | null = null;
  loadingDetails = false;

  constructor(
    private router: Router,
    private eventService: EventService,
    private mediaService: MediaService,
    private civilizationService: CivilizationService,
    private sanitizer: DomSanitizer,
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

  // Afficher les détails d'un événement dans un popup
  showEventDetails(id: string): void {
    this.loadingDetails = true;
    this.showDetailsPopup = true;
    this.selectedEvent = null;
    this.selectedEventMedia = [];
    this.selectedEventCivilization = null;
    this.cdr.markForCheck();

    // Charger l'événement enrichi avec ses médias
    this.eventService.loadEnrichedEventById(id).subscribe({
      next: (event) => {
        this.selectedEvent = event;
        
        // Charger les médias de l'événement
        if (event.id) {
          this.mediaService.loadMediaByEvent(event.id).subscribe({
            next: (media) => {
              this.selectedEventMedia = media;
              this.cdr.markForCheck();
            },
            error: (error) => {
              console.error('Erreur lors du chargement des médias:', error);
            }
          });
        }

        // Charger les détails de la civilisation
        if (event.civilizationId) {
          this.civilizationService.loadCivilizationById(event.civilizationId).subscribe({
            next: (civilization) => {
              this.selectedEventCivilization = civilization;
              this.cdr.markForCheck();
            },
            error: (error) => {
              console.error('Erreur lors du chargement de la civilisation:', error);
            }
          });
        }

        this.loadingDetails = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'événement:', error);
        this.loadingDetails = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Fermer le popup de détails
  closeDetailsPopup(): void {
    this.showDetailsPopup = false;
    this.selectedEvent = null;
    this.selectedEventMedia = [];
    this.selectedEventCivilization = null;
    this.cdr.markForCheck();
  }

  // Méthodes utilitaires pour les médias
  getMediaUrl(media: Media): string {
    if (!media.url) return '';
    
    // Si l'URL est externe (HTTP/HTTPS), la retourner telle quelle
    if (media.url.startsWith('http://') || media.url.startsWith('https://')) {
      return media.url;
    }
    
    // Si c'est un fichier uploadé, utiliser le service pour construire l'URL
    return this.mediaService.getMediaFileUrl(media.url);
  }

  isYouTubeUrl(url: string): boolean {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  getSafeYoutubeUrl(url: string): SafeResourceUrl {
    let embedUrl = url;
    
    // Convertir les URLs YouTube en format embed
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  // Gérer les erreurs d'images
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/placeholder-image.png';
    imgElement.alt = 'Image non disponible';
    imgElement.classList.add('opacity-50');
  }
}
