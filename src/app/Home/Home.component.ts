import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { Subscription } from 'rxjs';
// import { AuthStoreService } from '@core/auth/auth.store';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TimeLineScrolleComponent } from './TimeLineScrolle/TimeLineScrolle.component';

// Type pour les commentaires
interface Comment {
    author: string;
    date: string;
    text: string;
}

// Interface pour les paramètres de recherche
interface SearchParams {
    event?: string;
    startYear?: number;
    endYear?: number;
    civilization?: string;
    eventTypes?: {
        cultural: boolean;
        political: boolean;
        military: boolean;
        scientific: boolean;
    };
}

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule,TimeLineScrolleComponent, FormsModule],
    templateUrl: './Home.component.html',
    styleUrl: './Home.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements AfterViewInit, OnDestroy, OnInit {
    @ViewChild('followButton') followButtonRef!: ElementRef<HTMLButtonElement>;
    @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;
    @ViewChild(TimeLineScrolleComponent) timelineComponent!: any;

    isLoggedIn = false;
    private _subscription: Subscription = new Subscription();
    
    // Pour Dynamic Island - Civilisations améliorées
    civilizations = [
        'Égyptienne', 
        'Grecque', 
        'Romaine', 
        'Chinoise', 
        'Américaine',
        'Perse',
        'Indienne',
        'Renaissance',
        'Médiévale',
        'Préhistorique',
        'Toutes'
    ];
    selectedCivilization = this.civilizations[0];
    
    // Pour l'affichage des civilisations en boutons
    displayedCivilizations: string[] = [];
    showMoreCivilizations = false;
    civilizationsPanelOpen = false;
    
    userName = 'Visiteur'; // Valeur par défaut
    islandExpanded = false;
    
    // Pour le panneau de commentaires
    commentsOpen = false;
    newComment = '';
    comments: Comment[] = [
        { 
            author: 'Marie Dupont', 
            date: '23 Oct, 14:30', 
            text: 'La Joconde est vraiment fascinante. J\'adore comment le sourire change selon l\'angle de vue!' 
        },
        { 
            author: 'Pierre Martin', 
            date: '21 Oct, 09:15', 
            text: 'Savez-vous que ce tableau a été volé du Louvre en 1911? Il a été retrouvé deux ans plus tard en Italie.' 
        },
        { 
            author: 'Sophie Laurent', 
            date: '20 Oct, 18:45', 
            text: 'J\'ai visité le Louvre la semaine dernière. La foule autour de ce tableau est incroyable!' 
        },
        { 
            author: 'Jean Moreau', 
            date: '19 Oct, 11:22', 
            text: 'Léonard de Vinci était certainement en avance sur son temps. Ses techniques de peinture étaient révolutionnaires.' 
        }
    ];
    
    private router:Router = inject(Router);
    private authService: AuthService = inject(AuthService);
    // private authStoreService = inject(AuthStoreService);
    private ngZone: NgZone=inject(NgZone)
    private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

    private button!: HTMLButtonElement;
    private container!: HTMLDivElement;
    
    // Distance de retard (plus c'est grand, plus le mouvement est fluide)
    private lag = 8;
    
    // Position cible (où le bouton va se diriger)
    private targetX = window.innerWidth / 2;
    private targetY = window.innerHeight / 2;
    
    // Position actuelle du bouton
    private currentX = window.innerWidth / 2;
    private currentY = window.innerHeight / 2;
    
    // Animation frame
    private animationFrameId: number | null = null;
    
    // Mousemove event listener
    private mouseMoveListener: any;

    // Variable pour suivre le délai d'animation
    private islandAnimationTimeout: any = null;

    // Variables pour la recherche avancée
    searchOpen = false;
    searchEvent = '';
    searchStartYear: number | null = null;
    searchEndYear: number | null = null;
    searchCivilization = '';
    searchEventTypes = {
        cultural: false,
        political: false,
        military: false,
        scientific: false
    };
    activeSearchParams: SearchParams | null = null;

    userMenuOpen = false;

    ngOnInit(): void {
        // Initialiser les civilisations à afficher (3 max)
        this.updateDisplayedCivilizations();
        
        // Vérifier si l'utilisateur est connecté
        this.authService.isLoggedIn$.subscribe(isLoggedIn => {
            this.isLoggedIn = isLoggedIn;
            
            // Si l'utilisateur est connecté, essayer d'obtenir son nom
            if (isLoggedIn && this.authService.accessToken) {
                try {
                    // Essayer de décoder le token pour obtenir le nom de l'utilisateur
                    const userInfo = this.authService.getInfoUser(this.authService.accessToken);
                    this.userName = userInfo.name || 'Utilisateur';
                } catch (error) {
                    console.error('Erreur lors de la récupération des informations utilisateur', error);
                    this.userName = 'Utilisateur';
                }
            } else {
                this.userName = 'Visiteur';
            }
        });
    }
    
    ngAfterViewInit(): void {
        this.button = this.followButtonRef.nativeElement;
        this.container = this.containerRef.nativeElement;
        
        // Position initiale au centre
        this.button.style.left = '50%';
        this.button.style.top = '50%';
        
        // Mise à jour de la position cible lorsque la souris se déplace
        this.mouseMoveListener = (e: MouseEvent) => {
            this.targetX = e.clientX;
            this.targetY = e.clientY;
        };
        
        document.addEventListener('mousemove', this.mouseMoveListener);
        
        // Démarrage de l'animation en dehors de la zone Angular pour améliorer les performances
        this.ngZone.runOutsideAngular(() => {
            this.animate();
        });
    }
    
    ngOnDestroy(): void {
        // Nettoyage des ressources lors de la destruction du composant
        document.removeEventListener('mousemove', this.mouseMoveListener);
        
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
    
    // Animation fluide du bouton
    private animate(): void {
        // Calcul de la nouvelle position avec effet de lissage
        this.currentX += (this.targetX - this.currentX) / this.lag;
        this.currentY += (this.targetY - this.currentY) / this.lag;
        
        // Application de la position au bouton
        this.button.style.left = `${this.currentX}px`;
        this.button.style.top = `${this.currentY}px`;
        
        // Création d'une traînée tous les quelques frames
        if (Math.random() > 0.8) {
            this.createTrail(this.currentX, this.currentY);
        }
        
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
    
    // Fonction pour créer un effet de traînée
    private createTrail(x: number, y: number): void {
        const trail = document.createElement('div');
        trail.classList.add('trail');
        trail.style.left = `${x}px`;
        trail.style.top = `${y}px`;
        this.container.appendChild(trail);
        
        // Animation de disparition
        setTimeout(() => {
            trail.style.opacity = '0';
            trail.style.transform = 'translate(-50%, -50%) scale(0.5)';
            trail.style.transition = 'all 0.5s ease';
            
            // Suppression après la fin de l'animation
            setTimeout(() => {
            if (trail.parentNode === this.container) {
                this.container.removeChild(trail);
            }
            }, 500);
        }, 10);
    }
    
    buttonClicked(): void {
        // Retour dans la zone Angular pour les opérations liées à l'application
        this.ngZone.run(() => {
            // alert('Bouton cliqué !');
            this.logout()
        });
    }
    
    logout(): void {
        this.authService.signOut().subscribe(() => {
            setTimeout(() => {
                this.router.navigate(['/login']);
            }, 500);
        });
    }
    
    // Méthode pour mettre à jour les civilisations affichées
    updateDisplayedCivilizations(): void {
        // On affiche max 3 civilisations dans la Dynamic Island
        this.displayedCivilizations = this.civilizations.slice(0, 3);
        this.showMoreCivilizations = this.civilizations.length > 3;
    }
    
    // Méthode pour sélectionner une civilisation
    selectCivilization(civ: string): void {
        this.selectedCivilization = civ;
        
        // Si c'est une des 3 premières, on ne change rien
        if (this.displayedCivilizations.includes(civ)) {
            return;
        }
        
        // Sinon, on met la civilisation sélectionnée en premier
        const updatedCivs = [civ];
        for (let i = 0; i < 2 && i < this.civilizations.length - 1; i++) {
            if (this.civilizations[i] !== civ) {
                updatedCivs.push(this.civilizations[i]);
            }
        }
        this.displayedCivilizations = updatedCivs;
        
        // Transmettre la civilisation sélectionnée au composant Timeline
        if (this.timelineComponent) {
            this.timelineComponent.selectedCivilization = civ;
        }
    }
    
    // Méthode pour ouvrir/fermer le panneau des civilisations
    toggleCivilizationsPanel(): void {
        this.civilizationsPanelOpen = !this.civilizationsPanelOpen;
    }
    
    // Méthode pour basculer l'état de l'îlot dynamique
    toggleIsland(): void {
        this.islandExpanded = !this.islandExpanded;
        
        // Fermer le panneau des civilisations si on ferme l'island
        if (!this.islandExpanded) {
            this.civilizationsPanelOpen = false;
        }
    }
    
    // Méthode pour ouvrir/fermer le panneau de commentaires
    toggleComments(): void {
        this.commentsOpen = !this.commentsOpen;
        
        // Si on ouvre les commentaires, on s'assure que l'island est fermée
        if (this.commentsOpen) {
            this.islandExpanded = false;
        }
    }
    
    // Méthode pour ajouter un nouveau commentaire
    addComment(): void {
        if (this.newComment.trim()) {
            const now = new Date();
            const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
            const dateStr = now.toLocaleDateString('fr-FR', options) + ', ' + now.getHours() + ':' + 
                            (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
            
            this.comments.unshift({
                author: this.userName,
                date: dateStr,
                text: this.newComment.trim()
            });
            
            this.newComment = '';
        }
    }

    // Méthode pour afficher l'îlot dynamique au survol
    showIsland(): void {
        // Annuler tout timeout de fermeture en cours
        if (this.islandAnimationTimeout) {
            clearTimeout(this.islandAnimationTimeout);
            this.islandAnimationTimeout = null;
        }
        
        // Animation fluide pour l'ouverture
        if (!this.islandExpanded) {
            // Utiliser requestAnimationFrame pour que la transition démarre au bon moment
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.islandExpanded = true;
                    this.cdr.markForCheck();
                });
            });
        }
    }

    // Méthode pour cacher l'îlot dynamique à la fin du survol
    hideIsland(): void {
        // Ne pas fermer si le panneau des civilisations est ouvert
        if (this.civilizationsPanelOpen) return;
        
        // Petit délai avant de fermer pour éviter la fermeture accidentelle
        // lors d'un mouvement rapide de souris
        this.islandAnimationTimeout = setTimeout(() => {
            this.islandExpanded = false;
            this.cdr.markForCheck();
            this.islandAnimationTimeout = null;
        }, 100);
    }

    // Méthode pour maintenir l'îlot dynamique ouvert (utile quand on interagit avec le panneau des civilisations)
    keepIslandOpen(): void {
        this.islandExpanded = true;
        
        // Annuler tout délai de fermeture en cours
        if (this.islandAnimationTimeout) {
            clearTimeout(this.islandAnimationTimeout);
            this.islandAnimationTimeout = null;
        }
        
        this.cdr.markForCheck();
    }

    // Méthode pour ouvrir/fermer le panneau de recherche
    toggleSearch(): void {
        this.searchOpen = !this.searchOpen;
        
        // Si on ferme la recherche, on ferme aussi la dynamic island
        if (!this.searchOpen) {
            this.islandExpanded = false;
        }
        
        this.cdr.markForCheck();
    }
    
    // Méthode pour réinitialiser la recherche
    resetSearch(): void {
        this.searchEvent = '';
        this.searchStartYear = null;
        this.searchEndYear = null;
        this.searchCivilization = '';
        this.searchEventTypes = {
            cultural: false,
            political: false,
            military: false,
            scientific: false
        };
        
        this.cdr.markForCheck();
    }
    
    // Méthode pour soumettre la recherche
    submitSearch(): void {
        // Créer un objet avec les paramètres de recherche
        this.activeSearchParams = {
            event: this.searchEvent || undefined,
            startYear: this.searchStartYear || undefined,
            endYear: this.searchEndYear || undefined,
            civilization: this.searchCivilization || undefined,
            eventTypes: { ...this.searchEventTypes }
        };
        
        // Fermer le panneau de recherche
        this.searchOpen = false;
        this.islandExpanded = false;
        
        // Informer l'utilisateur que la recherche a été appliquée
        console.log('Recherche appliquée:', this.activeSearchParams);
        
        this.cdr.markForCheck();
    }

    // Méthode pour afficher le menu utilisateur
    showUserMenu(): void {
        this.userMenuOpen = true;
        this.islandExpanded = true;
        this.cdr.markForCheck();
    }

    // Méthode pour cacher le menu utilisateur
    hideUserMenu(): void {
        this.userMenuOpen = false;
        this.cdr.markForCheck();
    }

    // Méthode pour afficher le panneau des civilisations au survol
    showCivilizationsPanel(): void {
        this.civilizationsPanelOpen = true;
        this.islandExpanded = true;
        clearTimeout(this.islandAnimationTimeout);
        this.cdr.markForCheck();
    }

    // Méthode pour cacher le panneau des civilisations
    hideCivilizationsPanel(): void {
        // Petit délai pour éviter la fermeture accidentelle lors des mouvements de souris
        setTimeout(() => {
            this.civilizationsPanelOpen = false;
            this.cdr.markForCheck();
        }, 200);
    }

    // Méthode pour afficher la recherche au survol
    showSearch(): void {
        this.searchOpen = true;
        this.islandExpanded = true;
        clearTimeout(this.islandAnimationTimeout);
        this.cdr.markForCheck();
    }

    // Méthode pour cacher la recherche
    hideSearch(): void {
        // Petit délai pour éviter la fermeture accidentelle lors des mouvements de souris
        setTimeout(() => {
            this.searchOpen = false;
            this.cdr.markForCheck();
        }, 200);
    }

    // Méthode pour fermer tous les panneaux
    closeAllPanels(): void {
        this.civilizationsPanelOpen = false;
        this.searchOpen = false;
        this.userMenuOpen = false;
        this.islandExpanded = false;
        this.cdr.markForCheck();
    }

    // Méthode pour fermer seulement les commentaires
    closeComments(): void {
        if (this.commentsOpen) {
            this.commentsOpen = false;
            this.cdr.markForCheck();
        }
    }
}
