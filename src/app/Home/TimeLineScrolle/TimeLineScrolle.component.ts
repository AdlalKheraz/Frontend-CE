import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input, NgZone, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

// Modèle d'événement historique
export interface TimelineEvent {
  id: number;
  year: number; 
  title: string;
  description: string;
  image?: string;
  civilization: string;
  active?: boolean;
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
      active: true
    },
    {
      id: 2,
      year: 1918,
      title: "Fin de la Première Guerre mondiale",
      description: "Le 11 novembre 1918 marque la fin de la Première Guerre mondiale avec la signature de l'armistice entre l'Allemagne et les Alliés dans un wagon-restaurant aménagé dans la clairière de Rethondes, en forêt de Compiègne.",
      civilization: "Américaine",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Armistice_Day%2C_1918_%28BOND-15%29.jpeg/640px-Armistice_Day%2C_1918_%28BOND-15%29.jpeg",
      active: false
    },
    {
      id: 3,
      year: 1939, 
      title: "Début de la Seconde Guerre mondiale",
      description: "Le 1er septembre 1939, l'Allemagne nazie envahit la Pologne, déclenchant la Seconde Guerre mondiale. Deux jours plus tard, la France et le Royaume-Uni déclarent la guerre à l'Allemagne.",
      civilization: "Américaine",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Bundesarchiv_Bild_183-H27337%2C_Moskau%2C_Stalin_und_Ribbentrop_im_Kreml.jpg/640px-Bundesarchiv_Bild_183-H27337%2C_Moskau%2C_Stalin_und_Ribbentrop_im_Kreml.jpg",
      active: false
    },
    {
      id: 4,
      year: 1945,
      title: "Fin de la Seconde Guerre mondiale",
      description: "La Seconde Guerre mondiale prend fin en Europe le 8 mai 1945 avec la capitulation de l'Allemagne nazie, puis dans le Pacifique le 2 septembre 1945 avec la reddition du Japon.",
      civilization: "Américaine",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Surrender_of_Japan_-_USS_Missouri.jpg/640px-Surrender_of_Japan_-_USS_Missouri.jpg",
      active: false
    },
    {
      id: 5,
      year: 1962,
      title: "Crise des missiles de Cuba",
      description: "La crise des missiles de Cuba est un affrontement entre les États-Unis et l'Union soviétique, survenu du 16 au 28 octobre 1962, considéré comme le moment où la guerre froide a été la plus proche de basculer en guerre nucléaire.",
      civilization: "Américaine",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Cuban-missile-crisis-map.png/640px-Cuban-missile-crisis-map.png",
      active: false
    },
    {
      id: 6,
      year: -2500,
      title: "Construction des grandes pyramides",
      description: "La grande pyramide de Gizeh est construite comme tombeau du pharaon Khéops. C'est la plus ancienne et la plus grande des pyramides de Gizeh.",
      civilization: "Égyptienne",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Kheops-Pyramid.jpg/640px-Kheops-Pyramid.jpg",
      active: false
    },
    {
      id: 7,
      year: -480,
      title: "Bataille des Thermopyles",
      description: "Un petit contingent de Grecs dirigé par le roi Léonidas de Sparte tente de retenir l'avancée de l'immense armée perse de Xerxès Ier.",
      civilization: "Grecque",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Leonidas.jpg/640px-Leonidas.jpg",
      active: false
    },
    {
      id: 8,
      year: 117,
      title: "Apogée de l'Empire romain",
      description: "Sous le règne de l'empereur Trajan, l'Empire romain atteint sa plus grande extension territoriale, couvrant une grande partie de l'Europe, de l'Afrique du Nord et du Moyen-Orient.",
      civilization: "Romaine",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Map_of_the_Roman_Empire_under_Trajan_%28AD_117%29.png/640px-Map_of_the_Roman_Empire_under_Trajan_%28AD_117%29.png",
      active: false
    }
  ];
  
  // Événements filtrés à afficher
  filteredEvents: TimelineEvent[] = [];
  
  constructor(
    private renderer: Renderer2, 
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}
  
  ngOnInit() {
    this.filterEvents();
    this.currentYear = this.filteredEvents[0]?.year || 0;
    
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
    }
    
    this.cdr.detectChanges();
  }
  
  filterEvents() {
    if (this._selectedCivilization === 'Toutes') {
      this.filteredEvents = [...this.allEvents];
    } else {
      this.filteredEvents = this.allEvents.filter(
        event => event.civilization === this._selectedCivilization
      );
    }
    
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
    
    // Cette méthode peut être implémentée pour filtrer les événements en fonction
    // des critères de recherche (nom, années, type, civilisation)
    
    // Exemple d'implémentation (à adapter selon votre structure de données):
    // 1. Filtrer par nom d'événement
    // 2. Filtrer par période (année de début/fin)
    // 3. Filtrer par civilisation
    // 4. Filtrer par type d'événement
    
    // Puis appliquer ces filtres à votre timeline
    
    this.filterEvents(); // Appeler la méthode existante si besoin
  }
}