import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SearchParams } from '@app/shared/interfaces/search-params.interface';
import { AuthService } from '@core/auth/auth.service';
import { generateAvatar } from '@core/avatar/avatar.lib';
import { LoadingState } from '@core/models/api.model'; // Importez également le type de chargement
import { Civilization, CivilizationService } from '@core/services/civilization.service'; // Ajout de cette ligne
import { Comment, CommentService } from '@core/services/comment.service'; // Importez le service et l'interface
import { EventService } from '@core/services/event.service'; // Ajout de l'import
import { FilterService } from '@core/services/filter.service';
import { Subscription } from 'rxjs';
import { TimeLineScrolleComponent } from './TimeLineScrolle/TimeLineScrolle.component';


@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, TimeLineScrolleComponent, FormsModule, RouterLink],
    templateUrl: './Home.component.html',
    styleUrl: './Home.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements AfterViewInit, OnDestroy, OnInit {
    @ViewChild('followButton') followButtonRef!: ElementRef<HTMLButtonElement>;
    @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;
    @ViewChild(TimeLineScrolleComponent) timelineComponent!: any;

    isLoggedIn = false;
    isAdmin = false; // Nouvelle propriété pour détecter les administrateurs
    private _subscription: Subscription = new Subscription();
    text= 'Cliquer'
    
    // Variable pour suivre l'état d'affichage des détails
    detailsVisible = false;

    civilizations: string[] = ['Toutes']; // Initialisation avec l'option "Toutes"
    selectedCivilization = 'Toutes';
    
    // Pour l'affichage de la liste de civilisations (objets complets)
    civilizationData: Civilization[] = [];
    
    // Pour l'affichage des civilisations en boutons
    displayedCivilizations: string[] = [];
    showMoreCivilizations = false;
    civilizationsPanelOpen = false;

    userName = 'Visiteur'; // Valeur par défaut
    islandExpanded = false;
    avatar=generateAvatar( 'default');
    

    // Pour le panneau de commentaires
    commentsOpen = false;
    newComment = '';
    public apiComments: Comment[] = [];
    public commentsLoading = LoadingState.INIT;
    public currentEventId: string = '1'; // Valeur par défaut ou à récupérer dynamiquement
    private commentSubscription?: Subscription;

    comments: Comment[] = [
        {
            authorEmail: 'Marie Dupont',
            eventId: '1',
            createdAt: '23 Oct, 14:30',
            content: 'La Joconde est vraiment fascinante. J\'adore comment le sourire change selon l\'angle de vue!'
        },
        {
            authorEmail: 'Pierre Martin',
            eventId: '2',
            createdAt: '21 Oct, 09:15',
            content: 'Savez-vous que ce tableau a été volé du Louvre en 1911? Il a été retrouvé deux ans plus tard en Italie.'
        },
        {
            eventId:'3',
            authorEmail: 'Sophie Laurent',
            createdAt: '20 Oct, 18:45',
            content: 'J\'ai visité le Louvre la semaine dernière. La foule autour de ce tableau est incroyable!'
        },
        {
            eventId: '4',
            authorEmail: 'Jean Moreau',
            createdAt: '19 Oct, 11:22',
            content: 'Léonard de Vinci était certainement en avance sur son temps. Ses techniques de peinture étaient révolutionnaires.'
        }
    ];

    private router:Router = inject(Router);
    private authService: AuthService = inject(AuthService);
    // private authStoreService = inject(AuthStoreService);
    private ngZone: NgZone=inject(NgZone)
    private commentService: CommentService=inject(CommentService)
    private civilizationService: CivilizationService=inject(CivilizationService)
    // Injecter le service
    private filterService = inject(FilterService);
    private eventService = inject(EventService); // Injection du service

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

    // Variable pour stocker les résultats de recherche
    searchResults: any[] = [];
    isSearching = false;

    ngOnInit(): void {
        // Initialiser les civilisations à afficher (3 max)
        this.updateDisplayedCivilizations();
        this.loadCivilizations();
        // Vérifier si l'utilisateur est connecté
        this.authService.fetchCurrentUserFromToken().subscribe(user=>{
            if (user) {
                this.userName = `${user.firstName} ${user.lastName}` || user.email || 'Utilisateur';
                this.avatar=generateAvatar(user?.firstName || 'default');
                // Vérifier si l'utilisateur est administrateur
                this.isAdmin = user.role === 'ADMIN';
            } else {
                this.userName = 'Visiteur';
                this.avatar=generateAvatar('Visiteur');
                this.isAdmin = false;
            }
            this.cdr.markForCheck();
        })
        this.authService.isLoggedIn$.subscribe(isLoggedIn => {
            this.isLoggedIn = isLoggedIn;
            this.cdr.markForCheck(); // Forcer la détection de changement pour mettre à jour l'affichage
        });

        // Abonnez-vous au flux de commentaires
        this.commentSubscription = this.commentService.comments$.subscribe(state => {
            this.apiComments = state.data!;
            this.commentsLoading = state.loading;
            console.log('État des commentaires mis à jour:', {
                loading: this.commentsLoading,
                count: this.apiComments.length,
                error: state.error
            });
            this.cdr.markForCheck();
        });

        // Chargez les commentaires pour l'événement initial après un court délai
        // pour s'assurer que les composants enfants sont initialisés
        setTimeout(() => {
            if (this.getActiveEvent()) {
                this.loadCommentsForEvent(this.getActiveEvent().id.toString());
            }
        }, 1000);

        // S'abonner aux changements d'état du filtre
        this._subscription.add(
            this.filterService.filterState$.subscribe(state => {
                this.searchResults = state.lastResults;
                this.isSearching = state.loading;
                this.cdr.markForCheck();
            })
        );

        // Charger les événements enrichis au lieu des événements normaux
        this.loadEnrichedEvents();
        
        // Ajouter un écouteur pour la touche Escape
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
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
        
        // Surveillance des changements d'événements après l'initialisation de la vue
        setTimeout(() => {
            if (this.timelineComponent) {
                this._subscription.add(
                    this.timelineComponent.eventSelected.subscribe((eventId: number) => {
                        console.log(`Événement capturé par surveillance: ${eventId}`);
                        this.onEventSelected(eventId);
                    })
                );
            } else {
                console.warn('Le composant timeline n\'est pas encore disponible');
            }
        }, 100);
    }

    ngOnDestroy(): void {
        // Nettoyage des ressources lors de la destruction du composant
        document.removeEventListener('mousemove', this.mouseMoveListener);
        // Supprimer l'écouteur de clavier
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));

        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }

        // Désabonnez-vous pour éviter les fuites mémoire
        if (this.commentSubscription) {
            this.commentSubscription.unsubscribe();
        }

        // Désabonnez-vous des changements d'état du filtre
        this._subscription.unsubscribe();
    }
// Méthode pour charger les civilisations depuis le service
    loadCivilizations(): void {
        this.civilizationService.loadAllCivilizations().subscribe({
            next: (civilizations) => {
                // Stocker les données complètes
                this.civilizationData = civilizations;
                
                // Extraire juste les noms pour la liste des options
                const civNames = civilizations.map(civ => civ.name);
                this.civilizations = ['Toutes', ...civNames];
                
                // Mettre à jour les civilisations affichées
                this.updateDisplayedCivilizations();
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Erreur lors du chargement des civilisations:', error);
                // Garder au moins l'option "Toutes"
                this.civilizations = ['Toutes'];
                this.updateDisplayedCivilizations();
                this.cdr.markForCheck();
            }
        });
    }
    
    // Méthode pour rechercher des civilisations selon des critères
    searchCivilizations(criteria: { name?: string, startPeriod?: number, endPeriod?: number, region?: string }): void {
        this.civilizationService.searchCivilizations(criteria).subscribe({
            next: (civilizations) => {
                // Mettre à jour la liste des civilisations avec les résultats
                this.civilizationData = civilizations;
                const civNames = civilizations.map(civ => civ.name);
                this.civilizations = ['Toutes', ...civNames];
                this.updateDisplayedCivilizations();
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Erreur lors de la recherche des civilisations:', error);
                this.cdr.markForCheck();
            }
        });
    }
    
    // Méthode pour obtenir les détails d'une civilisation par son nom
    getCivilizationByName(name: string): Civilization | undefined {
        return this.civilizationData.find(civ => civ.name === name);
    }
    
    // Ajouter cette nouvelle méthode
    getCivilizationById(id: string): Civilization | undefined {
        return this.civilizationData.find(civ => civ.id === id);
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
            // Vérifier si l'utilisateur est connecté
            if (!this.isLoggedIn) {
                setTimeout(() => {
                    this.router.navigate(['/login']);
                }, 500);
            } else {
                this.text= this.text === 'Cliquer' ? 'Anuller' : 'Cliquer';
                
                // Basculer l'affichage des détails pour les utilisateurs connectés
                this.toggleDetails();
            }
        });
    }
    
    // Toggle l'affichage des détails
    toggleDetails(): void {
        this.detailsVisible = !this.detailsVisible;
        
        if (this.detailsVisible) {
            // Fermer les autres panels si nécessaire
            this.closeAllPanels();
            
            // Ajouter un effet de flou au conteneur d'image
            this.container.classList.add('blurred');
        } else {
            // Retirer l'effet de flou
            this.container.classList.remove('blurred');
        }
        
        this.cdr.markForCheck();
    }
    
    // Cache les détails
    hideDetails(): void {
        if (this.detailsVisible) {
            // Animation de sortie
            const detailsOverlay = document.querySelector('.details-overlay') as HTMLElement;
            const eventHighlight = document.querySelector('.event-highlight') as HTMLElement;
            
            if (detailsOverlay && eventHighlight) {
                // Animer la sortie
                detailsOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
                detailsOverlay.style.backdropFilter = 'blur(0px)';
                eventHighlight.style.opacity = '0';
                eventHighlight.style.transform = 'scale(0.95) translateY(10px)';
                
                // Délai avant de fermer complètement
                setTimeout(() => {
        this.detailsVisible = false;
                    this.container.classList.remove('blurred');
                    this.cdr.markForCheck();
                }, 200);
            } else {
                // Fallback si les éléments ne sont pas trouvés
                this.detailsVisible = false;
                this.container.classList.remove('blurred');
        this.cdr.markForCheck();
            }
        }
    }

    logout(): void {
        this.authService.signOut().subscribe(() => {
            // Mettre à jour le nom d'utilisateur à "Visiteur" après la déconnexion
            this.userName = 'Visiteur';
            this.cdr.markForCheck();
            // setTimeout(() => {
            //     this.router.navigate(['/login']);
            // }, 500);
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
        console.log('🏛️ Sélection de civilisation:', civ);
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
        // this.displayedCivs = updatedCivs;

        // Si une civilisation spécifique est sélectionnée (pas "Toutes"), charger ses événements
        if (civ !== 'Toutes') {
            const selectedCiv = this.getCivilizationByName(civ);
            console.log('🏛️ Civilisation trouvée:', selectedCiv);
            if (selectedCiv && selectedCiv.id) {
                // Charger les événements de cette civilisation
                console.log('🏛️ Chargement des événements pour la civilisation:', selectedCiv.id);
                this.eventService.loadEventsByCivilization(selectedCiv.id).subscribe();
            }
        } else {
            // ✅ IMPORTANT : Charger tous les événements enrichis quand "Toutes" est sélectionné
            console.log('🏛️ Chargement de tous les événements enrichis');
            this.eventService.loadAllEnrichedEvents().subscribe();
        }
        
        // Transmettre la civilisation sélectionnée au composant Timeline
        if (this.timelineComponent) {
            console.log('🏛️ Transmission de la civilisation au timeline:', civ);
            this.timelineComponent.selectedCivilization = civ;
        } else {
            console.warn('🏛️ Timeline component non disponible');
        }

        // Forcer la détection des changements
        this.cdr.markForCheck();

        // Gestion de l'affichage des civilisations (optionnel)
        if (!this.displayedCivilizations.includes(civ)) {
            // Réorganiser l'affichage si nécessaire
            const updatedCivs = [civ];
            for (let i = 0; i < 2 && i < this.civilizations.length - 1; i++) {
                if (this.civilizations[i] !== civ) {
                    updatedCivs.push(this.civilizations[i]);
                }
            }
            // Si vous voulez réorganiser l'affichage, décommentez cette ligne :
            // this.displayedCivilizations = updatedCivs;
        }
    }
    // Méthode pour ouvrir/fermer le panneau des civilisations
    toggleCivilizationsPanel(): void {
        // Fermer les autres panneaux
        this.userMenuOpen = false;
        this.searchOpen = false;

        // Inverser l'état du panneau des civilisations
        this.civilizationsPanelOpen = !this.civilizationsPanelOpen;

        // Garder l'island ouverte si un panneau est ouvert
        this.islandExpanded = this.civilizationsPanelOpen || this.userMenuOpen || this.searchOpen;

        this.cdr.markForCheck();
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

        // Si on ouvre les commentaires, on ferme tout le reste et on recharge les commentaires
        if (this.commentsOpen) {
            this.islandExpanded = false;
            this.civilizationsPanelOpen = false;
            this.searchOpen = false;
            this.userMenuOpen = false;
            
            // Recharger les commentaires pour l'événement actuel
            const activeEvent = this.getActiveEvent();
            if (activeEvent) {
                const eventId = activeEvent.id.toString();
                console.log(`Ouverture des commentaires pour l'événement ${eventId}`);
                this.loadCommentsForEvent(eventId);
            } else {
                console.warn('Panneau de commentaires ouvert mais aucun événement actif trouvé');
            }
        }

        this.cdr.markForCheck();
    }

    // Méthode pour ouvrir/fermer le panneau de recherche
    toggleSearch(): void {
        // Vérifier si l'utilisateur est connecté
        if (!this.isLoggedIn) {
            // Informer l'utilisateur qu'il doit se connecter
            // ou simplement ne rien faire
            return;
        }

        // Fermer les autres panneaux
        this.userMenuOpen = false;
        this.civilizationsPanelOpen = false;

        // Inverser l'état du panneau de recherche
        this.searchOpen = !this.searchOpen;

        // Garder l'island ouverte si un panneau est ouvert
        this.islandExpanded = this.civilizationsPanelOpen || this.userMenuOpen || this.searchOpen;

        this.cdr.markForCheck();
    }

    // Méthode pour charger les commentaires de l'événement actuel
    loadComments(): void {
        // Cette méthode est maintenant remplacée par loadCommentsForEvent
        this.loadCommentsForEvent(this.currentEventId);
    }

    // Méthode pour charger les commentaires lors d'un changement d'événement
    loadCommentsForEvent(eventId: string): void {
        console.log(`Chargement des commentaires pour l'événement ${eventId} (actuel: ${this.currentEventId})`);
        
        if (!eventId) {
            console.error('ID d\'événement invalide ou manquant');
            return;
        }
        
        // Si l'ID d'événement a changé, réinitialiser les commentaires
        if (this.currentEventId !== eventId) {
            this.commentService.resetComments();
            this.currentEventId = eventId;
            
            // Essayer de charger les commentaires pour le nouvel événement
            this.commentService.loadCommentsByEvent(eventId).subscribe({
                next: (comments) => {
                    console.log(`${comments.length} commentaires chargés pour l'événement ${eventId}`);
                    this.cdr.markForCheck();
                },
                error: (error) => {
                    console.error(`Erreur lors du chargement des commentaires pour l'événement ${eventId}:`, error);
                    this.cdr.markForCheck();
                }
            });
        } else {
            // Même événement, juste rafraîchir les commentaires
            this.commentService.refreshComments(eventId).subscribe({
                next: (comments) => {
                    console.log(`${comments.length} commentaires rafraîchis pour l'événement ${eventId}`);
                    this.cdr.markForCheck();
                },
                error: (error) => {
                    console.error(`Erreur lors du rafraîchissement des commentaires pour l'événement ${eventId}:`, error);
                    this.cdr.markForCheck();
                }
            });
        }
    }

    // Méthode pour charger plus de commentaires (pagination)
    loadMoreComments(): void {
      // Calculer la page suivante (en supposant que nous stockons la page courante)
      const nextPage = Math.ceil(this.apiComments.length / 10) + 1;
      
      this.commentService.loadMoreComments(this.currentEventId, nextPage).subscribe({
        next: (comments) => {
          console.log(`${comments.length} commentaires supplémentaires chargés`);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erreur lors du chargement de commentaires supplémentaires:', error);
          this.cdr.markForCheck();
        }
      });
    }

    // Méthode pour supprimer un commentaire (si l'utilisateur est l'auteur)
    deleteComment(commentId: string): void {
      this.commentService.deleteComment(commentId).subscribe({
        next: () => {
          console.log('Commentaire supprimé avec succès');
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du commentaire:', error);
          this.cdr.markForCheck();
        }
      });
    }

    // Méthode pour mettre à jour l'événement actuel et charger les commentaires correspondants
    setCurrentEvent(eventId: string): void {
      if (this.currentEventId !== eventId) {
        this.currentEventId = eventId;
        this.loadCommentsForEvent(eventId);
      }
    }

    // Méthode modifiée pour ajouter un commentaire via le service
    addComment(): void {
        if (!this.newComment.trim() || !this.isLoggedIn) return;
        
        const activeEvent = this.getActiveEvent();
        if (!activeEvent) return;
        
        const eventId = activeEvent.id.toString();
        console.log(`Ajout d'un commentaire pour l'événement actif: ${eventId}`);
        
        // Créer le commentaire en utilisant le nom d'utilisateur comme authorEmail
        const comment: Comment = {
            content: this.newComment.trim(),
            eventId: eventId,
            authorEmail: this.userName // Utiliser le nom d'utilisateur (pas l'email)
        };
        
        console.log('Envoi du commentaire:', comment);
        
        this.commentService.createComment(comment).subscribe({
            next: (response) => {
                console.log('Commentaire ajouté avec succès:', response);
                this.newComment = ''; // Réinitialiser le champ après envoi
                this.cdr.markForCheck();
            },
            error: (error: any) => {
                console.error('Erreur lors de l\'ajout du commentaire:', error);
            }
        });
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

    // Créer une méthode générique pour fermer un popup avec animation
    private closeWithAnimation(callback: () => void): void {
        // Ajouter une classe d'animation de sortie
        document.querySelectorAll('.panel-content, .user-menu-content').forEach(el => {
            el.classList.add('panel-closing');
        });

        // Attendre la fin de l'animation avant de réellement fermer le popup
        setTimeout(() => {
            callback();
            // Retirer la classe d'animation
            document.querySelectorAll('.panel-content, .user-menu-content').forEach(el => {
                el.classList.remove('panel-closing');
            });
        }, 200);
    }

    // Méthode pour cacher l'îlot dynamique à la fin du survol
    hideIsland(): void {
        // Ne pas fermer si un des panneaux est ouvert
        if (this.civilizationsPanelOpen || this.searchOpen || this.userMenuOpen) return;

        // Petit délai avant de fermer pour éviter la fermeture accidentelle
        this.islandAnimationTimeout = setTimeout(() => {
            this.islandExpanded = false;
            this.cdr.markForCheck();
            this.islandAnimationTimeout = null;
        }, 150);
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

    // Méthode pour soumettre la recherche
    submitSearch(): void {
        const searchParams = {
            event: this.searchEvent,
            startYear: this.searchStartYear!,
            endYear: this.searchEndYear!,
            civilization: this.searchCivilization || 'Toutes',
            eventTypes: this.searchEventTypes,
            page: 0,
            size: 50 // Récupérer un bon nombre d'événements
        };

        // Rechercher les événements via le service
        this.filterService.searchEvents(searchParams).subscribe({
            next: (response) => {
                // Fermer le panneau de recherche
                this.searchOpen = false;
                
                // Mise à jour des paramètres de recherche actifs
                this.activeSearchParams = response;
                
                // Afficher un message si aucun résultat
                if (response.content && response.content.length === 0) {
                    console.log('Aucun résultat trouvé');
                    // Vous pourriez afficher un message à l'utilisateur ici
                }
            },
            error: (err) => {
                console.error('Erreur lors de la recherche:', err);
                // Afficher un message d'erreur à l'utilisateur
            }
        });
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
        
        // Réinitialiser le service de filtrage
        this.filterService.resetFilters();
        this.activeSearchParams = null;
        
        this.cdr.markForCheck();
    }
    
    // Méthode pour filtrer par civilisation
    filterByCivilization(civ: string): void {
        this.selectedCivilization = civ;
        
        // Utiliser le service pour filtrer par civilisation
        if (civ !== 'Toutes') {
            const selectedCiv = this.getCivilizationByName(civ);
            if (selectedCiv && selectedCiv.id) {
                this.filterService.filterByCivilization(selectedCiv.id).subscribe({
                    next: () => {
                        // Mise à jour des paramètres actifs pour la timeline
                        this.activeSearchParams = {
                            ...this.activeSearchParams || {},
                            civilization: civ
                        };
                        
                        // Fermer le panneau des civilisations
                        this.civilizationsPanelOpen = false;
                        this.islandExpanded = false;
                        
                        this.cdr.markForCheck();
                    },
                    error: (error) => {
                        console.error('Erreur lors du filtrage par civilisation:', error);
                    }
                });
            }
        } else {
            // Réinitialiser le filtrage par civilisation
            this.filterService.filterByCivilization('').subscribe({
                next: () => {
                    if (this.activeSearchParams) {
                        const { civilization, ...otherParams } = this.activeSearchParams;
                        this.activeSearchParams = otherParams;
                    }
                    
                    // Fermer le panneau des civilisations
                    this.civilizationsPanelOpen = false;
                    this.islandExpanded = false;
                    
                    this.cdr.markForCheck();
                }
            });
        }
        
        // Mettre à jour l'affichage des civilisations
        this.updateDisplayedCivilizations();
    }
    
    // Méthode pour ouvrir/fermer le menu utilisateur
    toggleUserMenu(): void {
        // Fermer les autres panneaux
        this.civilizationsPanelOpen = false;
        this.searchOpen = false;

        // Inverser l'état du menu utilisateur
        this.userMenuOpen = !this.userMenuOpen;

        // Garder l'island ouverte si un panneau est ouvert
        this.islandExpanded = this.civilizationsPanelOpen || this.userMenuOpen || this.searchOpen;

        this.cdr.markForCheck();
    }

    // Méthode pour afficher le panneau des civilisations au survol
    showCivilizationsPanel(): void {
        // Fermer les autres popups
        this.userMenuOpen = false;
        this.searchOpen = false;

        // Ouvrir le panneau des civilisations
        this.civilizationsPanelOpen = true;
        this.islandExpanded = true;
        this.cdr.markForCheck();
    }

    // Méthode pour fermer le panneau des civilisations
    hideCivilizationsPanel(): void {
        this.civilizationsPanelOpen = false;
        // Si aucun autre panneau n'est ouvert, fermer l'island
        if (!this.userMenuOpen && !this.searchOpen) {
            this.islandExpanded = false;
        }
        this.cdr.markForCheck();
    }

    // Méthode pour afficher la recherche au survol
    showSearch(): void {
        // Fermer les autres popups
        this.userMenuOpen = false;
        this.civilizationsPanelOpen = false;

        // Ouvrir le panneau de recherche
        this.searchOpen = true;
        this.islandExpanded = true;
        this.cdr.markForCheck();
    }

    // Méthode pour cacher la recherche
    hideSearch(): void {
        // Animation de sortie puis fermeture
        this.closeWithAnimation(() => {
            this.searchOpen = false;
            this.cdr.markForCheck();
        });
    }

    // Méthode pour fermer tous les panneaux
    closeAllPanels(): void {
        this.civilizationsPanelOpen = false;
        this.searchOpen = false;
        this.userMenuOpen = false;
        this.closeComments();
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

    // Méthode pour récupérer l'événement actif depuis le composant timeline
    getActiveEvent(): any {
        if (this.timelineComponent) {
            const activeEvent = this.timelineComponent.getActiveEvent();
            if (activeEvent) {
                console.log('Active event found:', activeEvent);
                return activeEvent;
            }
        }
        console.warn('No active event found');
        return null;
    }

    // Méthode appelée lorsqu'un événement est sélectionné dans la timeline
    onEventSelected(eventId: number): void {
        // Convertir l'ID en string si nécessaire pour l'API
        const eventIdString = eventId.toString();
        console.log(`Événement sélectionné: ${eventIdString}, commentaires ouverts: ${this.commentsOpen}`);
        
        // Si un nouvel événement est sélectionné, charger ses commentaires
        if (this.currentEventId !== eventIdString) {
            // Mettre à jour l'ID de l'événement actuel et charger les commentaires
            this.loadCommentsForEvent(eventIdString);
            
            // Si le panneau de commentaires est déjà ouvert, forcer un rafraîchissement
            if (this.commentsOpen) {
                console.log("Panneau de commentaires déjà ouvert, rafraîchissement forcé");
                setTimeout(() => {
                    this.cdr.markForCheck();
                }, 0);
            }
        }
    }
    
    // Méthode pour naviguer entre les événements (précédent/suivant)
    navigateEvent(direction: number): void {
        if (!this.timelineComponent) return;
        
        const newIndex = this.timelineComponent.activeEventIndex + direction;
        
        // Vérifier que le nouvel index est valide
        if (newIndex >= 0 && newIndex < this.timelineComponent.filteredEvents.length) {
            console.log(`Navigation vers l'événement ${newIndex}`);
            this.timelineComponent.setActiveEvent(newIndex);
        }
    }

    // Méthode pour ouvrir les commentaires de l'événement actuel
    openCommentsForCurrentEvent(): void {
        const activeEvent = this.getActiveEvent();
        if (activeEvent) {
            const eventId = activeEvent.id.toString();
            this.currentEventId = eventId;
            this.loadCommentsForEvent(eventId);
            this.commentsOpen = true;
            this.hideDetails(); // Fermer les détails de l'événement
            this.cdr.markForCheck();
        }
    }

    // Méthode pour empêcher la propagation des événements de défilement
    onDetailScroll(event: WheelEvent): void {
        // Empêche la propagation de l'événement wheel à la timeline
        event.stopPropagation();
        
        // Empêche également le comportement par défaut si nécessaire
        const target = event.currentTarget as HTMLElement;
        const content = target.querySelector('.highlight-content-wrapper') as HTMLElement;
        
        if (content) {
            // Si on est au sommet et qu'on défile vers le haut, ou
            // si on est en bas et qu'on défile vers le bas, empêcher le défilement par défaut
            const atTop = content.scrollTop === 0;
            const atBottom = content.scrollHeight - content.scrollTop === content.clientHeight;
            
            if ((atTop && event.deltaY < 0) || (atBottom && event.deltaY > 0)) {
                event.preventDefault();
            }
        }
    }

    // Nouvelle méthode pour charger les événements enrichis
    loadEnrichedEvents(): void {
        this.eventService.loadAllEnrichedEvents().subscribe({
            next: (enrichedEvents) => {
                console.log('Événements enrichis chargés:', enrichedEvents);
                // Transmettre les événements enrichis au composant Timeline
                if (this.timelineComponent) {
                    this.timelineComponent.setEnrichedEvents(enrichedEvents);
                }
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Erreur lors du chargement des événements enrichis:', error);
                this.cdr.markForCheck();
            }
        });
    }

    // Nouvelle méthode pour gérer les événements clavier
    handleKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.closeAllPanels();
            if (this.detailsVisible) {
                this.hideDetails();
            }
        }
    }

    // Méthode pour gérer les événements vidéo
    onVideoEvent(event: Event): void {
        event.stopPropagation();
        console.log('Video event:', event.type);
    }

    // Méthode pour gérer le clic sur une vidéo
    onVideoClick(event: Event, media: any): void {
        event.stopPropagation();
        const video = event.target as HTMLVideoElement;
        
        if (video.paused) {
            video.play().catch(error => {
                console.error('Erreur lors de la lecture de la vidéo:', error);
            });
        } else {
            video.pause();
        }
    }

    // Méthode pour vérifier si l'URL de la vidéo est valide
    isValidVideoUrl(url: string): boolean {
        if (!url) return false;
        
        // Vérifier les extensions vidéo courantes
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov'];
        const hasValidExtension = videoExtensions.some(ext => 
            url.toLowerCase().includes(ext)
        );
        
        // Vérifier les domaines de streaming courants
        const streamingDomains = ['youtube.com', 'vimeo.com', 'dailymotion.com'];
        const isStreamingUrl = streamingDomains.some(domain => 
            url.toLowerCase().includes(domain)
        );
        
        return hasValidExtension || isStreamingUrl || url.startsWith('blob:') || url.startsWith('data:');
    }
}
