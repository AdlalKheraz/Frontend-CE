import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, NgZone, OnDestroy, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { LoadingState } from '../../core/models/api.model';
import { Civilization } from '../../core/services/civilization.service'; // Ajout de l'import
import { EventService, HistoricalEvent } from '../../core/services/event.service';

// Modèle d'événement historique
export interface TimelineEvent {
  medias: any;
  id: number;
  year: number; 
  title: string;
  description: string;
  image?: string;
  civilization: string;
  active?: boolean;
}

// Définir l'interface ComponentEvent au début du fichier
interface ComponentEvent {
  id: number; // Changer de string à number pour être compatible avec TimelineEvent
  title: string;
  description: string;
  year: number;
  image: string;
  medias: any[];
  civilization: string;
  active: boolean;
}

@Component({
  selector: 'app-time-line-scrolle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './TimeLineScrolle.component.html',
  styleUrl: './TimeLineScrolle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeLineScrolleComponent implements OnInit, OnDestroy {
  events: ComponentEvent[] = [];
  @Input() set selectedCivilization(value: string) {
    console.log('🎯 Changement de civilisation:', value, '(ancienne:', this._selectedCivilization, ')');
    if (value !== this._selectedCivilization) {
      this._selectedCivilization = value;
      console.log('🎯 Appel de filterEvents()');
      this.filterEvents();
    }
  }
  get selectedCivilization(): string {
    return this._selectedCivilization;
  }

  @Input() set searchParams(value: any) {
    if (value) {
      console.log('TimeLineScrolle a reçu les paramètres de recherche:', value);
      this.filterEventsWithSearch(value);
    }
  }
  
  @Input() detailsVisible: boolean = false;

  @Output() eventSelected = new EventEmitter<number>();

  @ViewChild('timelineContainer') timelineContainer!: ElementRef;
  @ViewChild('timelineTrack') timelineTrack!: ElementRef;
  
  private _selectedCivilization: string = 'Toutes';
  private subscriptions = new Subscription();
  private scrolling = false;
  private scrollTimeout: any;
  private wheelSubscription!: Subscription;
  
  activeEventIndex = 0;
  currentYear: number = 0;
  timelineOffset: number = 0;
  
  // Source de données pour tous les événements avec images placeholders
  allEvents: TimelineEvent[] = [];
  
  // Événements filtrés à afficher
  filteredEvents: TimelineEvent[] = [];
  
  // État de chargement
  loading = true;
  error: string | null = null;
  
  // Événements enrichis
  enrichedEvents: HistoricalEvent[] = [];
  
  selectedMedia: any = null;
  
  @Input() civilizations: Civilization[] = []; // Ajouter cet input
  
  constructor(
    private renderer: Renderer2, 
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private eventService: EventService
  ) {}
  
  ngOnInit() {
    // Charger les événements depuis le service
    this.loadEvents();
    
    // Ajouter un écouteur d'événement pour le scroll sur tout le document
    this.ngZone.runOutsideAngular(() => {
      this.wheelSubscription = fromEvent<WheelEvent>(document, 'wheel')
        .pipe(throttleTime(200))  // Limiter la fréquence des événements de scroll
        .subscribe(event => {
          this.ngZone.run(() => {
            this.handleGlobalScroll(event);
          });
        });
    });
    
    // Ajouter un écouteur pour le redimensionnement de la fenêtre
    this.ngZone.runOutsideAngular(() => {
      const resizeSubscription = fromEvent(window, 'resize')
        .pipe(throttleTime(100))
        .subscribe(() => {
          this.ngZone.run(() => {
            this.updateTimelineOffset();
            this.cdr.detectChanges();
          });
        });
      this.subscriptions.add(resizeSubscription);
    });
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.wheelSubscription) {
      this.wheelSubscription.unsubscribe();
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  // Chargement des événements depuis le service
  loadEvents() {
    console.log('📥 Chargement des événements depuis le service');
    this.loading = true;
    this.error = null;
    
    const subscription = this.eventService.events$.subscribe({
      next: (state) => {
        console.log('🚀 ~ TimeLineScrolleComponent ~ loadEvents ~ state:', state)
        if (state.loading === LoadingState.LOADED) {
          // Vérifier si des données existent
          if (state.data && state.data.length > 0) {
            console.log('🚀 ~ TimeLineScrolleComponent ~ loadEvents ~ state.data:', state.data)
            // Transformer les données du service en format TimelineEvent
            this.allEvents = this.mapHistoricalEventsToTimelineEvents(state.data);
            console.log('🚀 ~ TimeLineScrolleComponent ~ loadEvents ~ allEvents:', this.allEvents)
            
            // ✅ Appliquer immédiatement le filtrage avec la civilisation sélectionnée
            this.filterEvents();
          } else {
            // Aucun événement retourné
            this.allEvents = [];
            this.filteredEvents = [];
          }
          
          this.currentYear = this.filteredEvents[0]?.year || 0;
          this.loading = false;
          this.cdr.detectChanges();
        } else if (state.loading === LoadingState.ERROR) {
          this.error = state.error || 'Erreur lors du chargement des événements';
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des événements';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
    
    this.subscriptions.add(subscription);
    
    // Déclencher le chargement initial des événements enrichis
    console.log('📥 Déclenchement du chargement initial des événements enrichis');
    this.eventService.loadAllEnrichedEvents().subscribe();
  }
  
  // Mapper les événements historiques au format TimelineEvent
  private mapHistoricalEventsToTimelineEvents(events: HistoricalEvent[]): TimelineEvent[] {
    return events.map((event, index) => {
      const year = new Date(event.date).getFullYear();
      
      // Trouver le nom de la civilisation à partir de l'ID
      const civilization = this.civilizations.find(civ => civ.id === event.civilizationId);
      
      return {
        id: index + 1,
        year: year,
        title: event.title,
        description: event.description,
        // ✅ FIX: Utiliser le nom de la civilisation trouvée, sinon 'Inconnue'
        civilization: civilization?.name || 'Inconnue',
        image: event.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Map_of_the_Roman_Empire_under_Trajan_%28AD_117%29.png/640px-Map_of_the_Roman_Empire_under_Trajan_%28AD_117%29.png',
        medias: event.medias || [],
        active: index === 0
      };
    });
  }
  
  // Gestionnaire de scroll global pour tout le document
  private handleGlobalScroll(event: WheelEvent) {
    // Si déjà en cours de défilement, ne rien faire
    if (this.scrolling) return;
    
    // Définir le flag de défilement
    this.scrolling = true;
    
    // Déterminer la direction du défilement
    const direction = event.deltaY > 0 ? 1 : -1;
    
    console.log('Global Scroll direction:', direction);
    
    // Calculer le nouvel index
    const newIndex = this.activeEventIndex + direction;
    console.log('New index:', newIndex, 'Max:', this.filteredEvents.length - 1);
    
    // S'assurer que l'index reste dans les limites
    if (newIndex >= 0 && newIndex < this.filteredEvents.length) {
      this.setActiveEvent(newIndex);
      // Empêcher le défilement de la page
      event.preventDefault();
    } 
    
    // Réinitialiser le flag de défilement après un délai
    this.scrollTimeout = setTimeout(() => {
      this.scrolling = false;
    }, 400);
  }
  
  // Maintenu pour rétrocompatibilité avec le clic sur les années
  @HostListener('wheel', ['$event'])
  onScroll(event: WheelEvent) {
    // Toujours prévenir le comportement par défaut du scroll
    event.preventDefault();
    
    // Utiliser le gestionnaire global
    this.handleGlobalScroll(event);
  }
  
  setActiveEvent(index: number) {
    // Désactiver tous les événements
    this.filteredEvents.forEach(event => event.active = false);
    
    // Activer l'événement sélectionné
    if (this.filteredEvents[index]) {
      this.filteredEvents[index].active = true;
      this.activeEventIndex = index;
      this.currentYear = this.filteredEvents[index].year;
      
      // Calculer l'offset pour centrer l'événement actif
      this.updateTimelineOffset();
      
      // Émettre l'événement sélectionné
      this.eventSelected.emit(this.filteredEvents[index].id);
      
      // Forcer la détection des changements
      this.cdr.detectChanges();
    }
  }
  
  // Méthode pour calculer l'offset de la timeline
  private updateTimelineOffset() {
    if (!this.timelineTrack || !this.timelineContainer) return;
    
    // Utiliser la hauteur réelle du viewport (window) pour un centrage dynamique
    const viewportHeight = window.innerHeight;
    const centerPosition = viewportHeight / 2;
    
    // Obtenir la position du conteneur timeline par rapport au viewport
    const containerRect = this.timelineContainer.nativeElement.getBoundingClientRect();
    const containerTop = containerRect.top;
    
    // Calculer le centre relatif au conteneur timeline
    const relativeCenterPosition = centerPosition - containerTop;
    
    // Hauteur approximative d'un item avec le nouveau style (padding + margin + contenu)
    const itemHeight = 46; // 15px padding top + 15px padding bottom + 8px margin top + 8px margin bottom
    
    // Position de l'événement actif dans la liste (centre du dot)
    const activeItemPosition = this.activeEventIndex * itemHeight + (itemHeight / 2);
    
    // Calculer l'offset pour que le centre du dot de l'événement actif soit exactement au centre du viewport
    // TOUJOURS centrer l'événement actif, sans limites
    this.timelineOffset = relativeCenterPosition - activeItemPosition;
  }
  
  filterEvents() {
    console.log('🔍 Filtrage des événements - Civilisation sélectionnée:', this._selectedCivilization);
    console.log('🔍 Tous les événements disponibles:', this.allEvents.map(e => ({ title: e.title, civilization: e.civilization })));
    
    if (this._selectedCivilization === 'Toutes') {
      this.filteredEvents = [...this.allEvents];
    } else {
      this.filteredEvents = this.allEvents.filter(event => 
        event.civilization === this._selectedCivilization
      );
    }
    
    console.log('🔍 Événements après filtrage:', this.filteredEvents.map(e => ({ title: e.title, civilization: e.civilization })));
    
    // Trier par année
    this.filteredEvents.sort((a, b) => a.year - b.year);
    
    // Réinitialiser l'événement actif
    this.filteredEvents.forEach(event => event.active = false);
    if (this.filteredEvents.length > 0) {
      this.filteredEvents[0].active = true;
      this.activeEventIndex = 0;
      this.currentYear = this.filteredEvents[0].year;
      
      // Recalculer l'offset de la timeline
      setTimeout(() => {
        this.updateTimelineOffset();
        this.cdr.detectChanges();
      }, 0);
    }
    
    console.log('🔍 Événements filtrés finaux:', this.filteredEvents);
  }
  
  onYearClick(index: number) {
    this.setActiveEvent(index);
  }

  // Méthode pour filtrer les événements en fonction des paramètres de recherche
  private filterEventsWithSearch(searchParams: any): void {
    console.log('Filtrage des événements avec les paramètres:', searchParams);
    
    // Vérifier si les résultats de recherche existent dans les paramètres
    if (searchParams && searchParams.content) {
      // Les données sont au format paginé
      const searchResults = searchParams.content || [];
      
      // Transformer les résultats de recherche en format TimelineEvent
      this.allEvents = searchResults.map((event: any, index: number) => {
        // Extraire l'année de la date (format attendu: YYYY-MM-DD)
        const year = new Date(event.date).getFullYear();
        
        return {
          id: event.id || index + 1,
          year: year,
          title: event.title || 'Sans titre',
          description: event.description || 'Aucune description disponible',
          civilization: event.civilizationId || 'Inconnue',
          image: event.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Map_of_the_Roman_Empire_under_Trajan_%28AD_117%29.png/640px-Map_of_the_Roman_Empire_under_Trajan_%28AD_117%29.png',
          media: event.media || [], // ✅ Ajouter la propriété media manquante
          active: index === 0 // Premier événement actif par défaut
        };
      });
      
      if (this.allEvents.length === 0) {
        console.log('Aucun résultat trouvé pour les critères de recherche');
      }
      
      // Mettre à jour les événements filtered
      this.filterEvents();
    } else {
      console.log('Format de résultats de recherche non valide ou vide');
    }
  }

  // Exposer l'événement actif pour le composant parent
  getActiveEvent(): TimelineEvent | null {
    if (this.filteredEvents.length === 0 || this.activeEventIndex >= this.filteredEvents.length) {
      return null;
    }
    return this.filteredEvents[this.activeEventIndex];
  }
  
  updateActiveEvent() {
    // Implémentation de la méthode updateActiveEvent
    if (this.filteredEvents.length > 0) {
      // Réinitialiser tous les événements à inactif
      this.filteredEvents.forEach(event => event.active = false);
      
      // Activer le premier événement par défaut
      this.activeEventIndex = 0;
      this.filteredEvents[0].active = true;
      this.currentYear = this.filteredEvents[0].year;
      
      // Émettre l'ID de l'événement actif
      const eventId = this.filteredEvents[0].id;
      this.eventSelected.emit(typeof eventId === 'string' ? parseInt(eventId) : eventId);
    }
  }
  
  // Méthode pour extraire l'image principale de l'événement
  private getEventImage(event: HistoricalEvent): string {
    // Si l'événement a des médias, prendre le premier
    if (event.medias && event.medias.length > 0) {
      return event.medias[0].url || '/assets/default-event.jpg';
    }
    return '/assets/default-event.jpg';
  }
  
  // Méthode pour extraire tous les médias de l'événement
  private getEventMedia(event: HistoricalEvent): any[] {
    return event.medias || [];
  }
  
  // Méthode pour ouvrir le modal des médias
  openMediaModal(media: any, index: number): void {
    this.selectedMedia = media;
    this.cdr.markForCheck();
  }
  
  // Méthode pour fermer le modal des médias
  closeMediaModal(): void {
    this.selectedMedia = null;
    this.cdr.markForCheck();
  }
}