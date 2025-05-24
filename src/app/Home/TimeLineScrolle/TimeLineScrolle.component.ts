import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, NgZone, OnDestroy, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { LoadingState } from '../../core/models/api.model';
import { EventService, HistoricalEvent } from '../../core/services/event.service';

// Modèle d'événement historique
export interface TimelineEvent {
media: any;
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
  media: any[];
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
    if (value !== this._selectedCivilization) {
      this._selectedCivilization = value;
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
  
  private _selectedCivilization: string = 'Toutes';
  private subscriptions = new Subscription();
  private scrolling = false;
  private scrollTimeout: any;
  private wheelSubscription!: Subscription;
  
  activeEventIndex = 0;
  currentYear: number = 0;
  
  // Source de données pour tous les événements avec images placeholders
  allEvents: TimelineEvent[] = [
    {
      id: 1,
      year: 1914,
      title: "La Joconde",
      description: "La Joconde est le portrait d'une jeune femme, sur fond d'un paysage montagneux aux horizons lointains et brumeux. Elle est disposée de trois quarts et représentée jusqu'à la taille, bras et mains compris, regardant le spectateur, ce qui est relativement nouveau à l'époque et rompt avec les portraits jusque-là répandus, qui coupent le buste à hauteur des épaules ou de la poitrine et sont entièrement de profil",
      civilization: "Renaissance",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/540px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
      active: true,
      media: undefined
    },
    {
      id: 2,
      year: 1918,
      title: "Fin de la Première Guerre mondiale",
      description: "Le 11 novembre 1918 marque la fin de la Première Guerre mondiale avec la signature de l'armistice entre l'Allemagne et les Alliés dans un wagon-restaurant aménagé dans la clairière de Rethondes, en forêt de Compiègne.",
      civilization: "Américaine",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Armistice_Day%2C_1918_%28BOND-15%29.jpeg/640px-Armistice_Day%2C_1918_%28BOND-15%29.jpeg",
      active: false,
      media: undefined
    },
    {
      id: 3,
      year: 1939,
      title: "Début de la Seconde Guerre mondiale",
      description: "Le 1er septembre 1939, l'Allemagne nazie envahit la Pologne, déclenchant la Seconde Guerre mondiale. Deux jours plus tard, la France et le Royaume-Uni déclarent la guerre à l'Allemagne.",
      civilization: "Américaine",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Bundesarchiv_Bild_183-H27337%2C_Moskau%2C_Stalin_und_Ribbentrop_im_Kreml.jpg/640px-Bundesarchiv_Bild_183-H27337%2C_Moskau%2C_Stalin_und_Ribbentrop_im_Kreml.jpg",
      active: false,
      media: undefined
    },
    {
      id: 4,
      year: 1945,
      title: "Fin de la Seconde Guerre mondiale",
      description: "La Seconde Guerre mondiale prend fin en Europe le 8 mai 1945 avec la capitulation de l'Allemagne nazie, puis dans le Pacifique le 2 septembre 1945 avec la reddition du Japon.",
      civilization: "Américaine",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Surrender_of_Japan_-_USS_Missouri.jpg/640px-Surrender_of_Japan_-_USS_Missouri.jpg",
      active: false,
      media: undefined
    },
    {
      id: 5,
      year: 1962,
      title: "Crise des missiles de Cuba",
      description: "La crise des missiles de Cuba est un affrontement entre les États-Unis et l'Union soviétique, survenu du 16 au 28 octobre 1962, considéré comme le moment où la guerre froide a été la plus proche de basculer en guerre nucléaire.",
      civilization: "Américaine",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Cuban-missile-crisis-map.png/640px-Cuban-missile-crisis-map.png",
      active: false,
      media: undefined
    },
    {
      id: 6,
      year: -2500,
      title: "Construction des grandes pyramides",
      description: "La grande pyramide de Gizeh est construite comme tombeau du pharaon Khéops. C'est la plus ancienne et la plus grande des pyramides de Gizeh.",
      civilization: "Égyptienne",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Kheops-Pyramid.jpg/640px-Kheops-Pyramid.jpg",
      active: false,
      media: undefined
    },
    {
      id: 7,
      year: -480,
      title: "Bataille des Thermopyles",
      description: "Un petit contingent de Grecs dirigé par le roi Léonidas de Sparte tente de retenir l'avancée de l'immense armée perse de Xerxès Ier.",
      civilization: "Grecque",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Leonidas.jpg/640px-Leonidas.jpg",
      active: false,
      media: undefined
    },
    {
      id: 8,
      year: 117,
      title: "Apogée de l'Empire romain",
      description: "Sous le règne de l'empereur Trajan, l'Empire romain atteint sa plus grande extension territoriale, couvrant une grande partie de l'Europe, de l'Afrique du Nord et du Moyen-Orient.",
      civilization: "Romaine",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Map_of_the_Roman_Empire_under_Trajan_%28AD_117%29.png/640px-Map_of_the_Roman_Empire_under_Trajan_%28AD_117%29.png",
      active: false,
      media: undefined
    }
  ];
  
  // Événements filtrés à afficher
  filteredEvents: TimelineEvent[] = [];
  
  // État de chargement
  loading = true;
  error: string | null = null;
  
  // Événements enrichis
  enrichedEvents: HistoricalEvent[] = [];
  
  selectedMedia: any = null;
  
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
    this.loading = true;
    this.error = null;
    
    const subscription = this.eventService.events$.subscribe({
      next: (state) => {
        if (state.loading === LoadingState.LOADED) {
          // Vérifier si des données existent
          if (state.data && state.data.length > 0) {
            // Transformer les données du service en format TimelineEvent
            this.allEvents = this.mapHistoricalEventsToTimelineEvents(state.data);
          } else {
            // Aucun événement retourné
            this.allEvents = [];
          }
          
          this.filterEvents();
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
    
    // Déclencher le chargement des événements
    this.eventService.loadAllEvents().subscribe();
  }
  
  // Mapper les événements historiques au format TimelineEvent
  private mapHistoricalEventsToTimelineEvents(events: HistoricalEvent[]): TimelineEvent[] {
    return events.map((event, index) => {
      // Extraire l'année de la date (format attendu: YYYY-MM-DD)
      const year = new Date(event.date).getFullYear();
      
      return {
        id: index + 1, // Générer un ID si nécessaire
        year: year,
        title: event.title,
        description: event.description,
        civilization: event.civilizationId, // Utiliser l'ID comme nom pour l'instant
        image: event.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Map_of_the_Roman_Empire_under_Trajan_%28AD_117%29.png/640px-Map_of_the_Roman_Empire_under_Trajan_%28AD_117%29.png', // Image par défaut
        media: event.media || [], // ✅ Ajouter la propriété media manquante
        active: index === 0 // Premier événement actif par défaut
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
    console.log('Setting active event:', index);
    
    // Désactiver l'événement actuel
    if (this.filteredEvents[this.activeEventIndex]) {
      this.filteredEvents[this.activeEventIndex].active = false;
    }
    
    // Mettre à jour l'index actif
    this.activeEventIndex = index;
    
    // Activer le nouvel événement
    if (this.filteredEvents[this.activeEventIndex]) {
      this.filteredEvents[this.activeEventIndex].active = true;
      this.currentYear = this.filteredEvents[this.activeEventIndex].year;
      
      // Émettre l'ID de l'événement
      const eventId = this.filteredEvents[this.activeEventIndex].id;
      console.log(`Émission de l'ID d'événement: ${eventId}`);
      this.eventSelected.emit(eventId);
    }
    
    this.cdr.detectChanges();
  }
  
  filterEvents() {
    if (this.allEvents.length === 0) {
      this.filteredEvents = [];
      this.error = 'Aucun événement à afficher';
      this.cdr.detectChanges();
      return;
    }
    
    if (this._selectedCivilization === 'Toutes') {
      this.filteredEvents = [...this.allEvents];
    } else {
      this.filteredEvents = this.allEvents.filter(
        event => event.civilization === this._selectedCivilization
      );
    }
    
    // Si après filtrage, il ne reste aucun événement
    if (this.filteredEvents.length === 0) {
      this.error = `Aucun événement trouvé pour la civilisation "${this._selectedCivilization}"`;
      this.cdr.detectChanges();
      return;
    }
    
    // Réinitialiser l'erreur s'il y a des événements
    this.error = null;
    
    // Réinitialiser l'événement actif
    this.activeEventIndex = 0;
    this.filteredEvents.forEach((event, index) => {
      event.active = index === 0;
    });
    
    if (this.filteredEvents.length > 0) {
      this.currentYear = this.filteredEvents[0].year;
    }
    
    this.cdr.detectChanges();
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
      
      // Mettre à jour les événements filtrés
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
  
  // Nouvelle méthode pour définir les événements enrichis
  setEnrichedEvents(events: HistoricalEvent[]): void {
    this.enrichedEvents = events;
    // Convertir les événements enrichis au format attendu par la timeline
    this.events = events.map(event => ({
      id: parseInt(event.id!) || 0, // Convertir string en number
      title: event.title,
      description: event.description,
      year: new Date(event.date).getFullYear(),
      image: this.getEventImage(event),
      media: this.getEventMedia(event), // ✅ Ajouter la propriété media manquante
      civilization: event.civilizationId,
      active: false
    }));
    
    this.filteredEvents = [...this.events];
    this.updateActiveEvent();
    this.cdr.markForCheck();
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
    if (event.media && event.media.length > 0) {
      return event.media[0].url || '/assets/default-event.jpg';
    }
    return '/assets/default-event.jpg';
  }
  
  // Méthode pour extraire tous les médias de l'événement
  private getEventMedia(event: HistoricalEvent): any[] {
    return event.media || [];
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