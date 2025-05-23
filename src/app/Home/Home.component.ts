import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SearchParams } from '@app/shared/interfaces/search-params.interface';
import { AuthService } from '@core/auth/auth.service';
import { LoadingState } from '@core/models/api.model'; // Importez également le type de chargement
import { Civilization, CivilizationService } from '@core/services/civilization.service'; // Ajout de cette ligne
import { Comment, CommentService } from '@core/services/comment.service'; // Importez le service et l'interface
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
    private civilizationData: Civilization[] = [];
    
    // Pour l'affichage des civilisations en boutons
    displayedCivilizations: string[] = [];
    showMoreCivilizations = false;
    civilizationsPanelOpen = false;

    userName = 'Visiteur'; // Valeur par défaut
    islandExpanded = false;

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
                // Vérifier si l'utilisateur est administrateur
                this.isAdmin = user.role === 'ADMIN';
            } else {
                this.userName = 'Visiteur';
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
            this.cdr.markForCheck();
        });

        // Chargez les commentaires pour l'événement initial
        this.loadCommentsForEvent(this.currentEventId);

        // S'abonner aux changements d'état du filtre
        this._subscription.add(
            this.filterService.filterState$.subscribe(state => {
                this.searchResults = state.lastResults;
                this.isSearching = state.loading;
                this.cdr.markForCheck();
            })
        );
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
                console.log('Configuration de la surveillance des événements dans la timeline');
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
    
    // Méthode pour basculer l'affichage des détails
    toggleDetails(): void {
        this.detailsVisible = !this.detailsVisible;
        this.cdr.markForCheck();
    }
    
    // Méthode pour masquer les détails
    hideDetails(): void {
        this.detailsVisible = false;
        this.text = 'Cliquer';
        this.cdr.markForCheck();
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

        // Si une civilisation spécifique est sélectionnée (pas "Toutes"), charger ses détails
        if (civ !== 'Toutes') {
            const selectedCiv = this.getCivilizationByName(civ);
            if (selectedCiv && selectedCiv.id) {
                // Charger les détails complets depuis l'API
                this.civilizationService.loadCivilizationById(selectedCiv.id).subscribe({
                    next: (civilization) => {
                        console.log('Détails de la civilisation chargés:', civilization);
                        // Ici vous pouvez faire quelque chose avec les détails chargés
                    },
                    error: (error) => {
                        console.error('Erreur lors du chargement des détails de la civilisation:', error);
                    }
                });
            }
        }
        // Transmettre la civilisation sélectionnée au composant Timeline
        if (this.timelineComponent) {
            this.timelineComponent.selectedCivilization = civ;
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
                this.currentEventId = eventId; // Mettre à jour l'ID actuel
                this.loadCommentsForEvent(eventId);
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
        this.commentService.loadCommentsByEvent(this.currentEventId).subscribe({
            next: (comments) => {
                // Les données sont déjà mises à jour via le BehaviorSubject
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Erreur lors du chargement des commentaires:', error);
                this.cdr.markForCheck();
            }
        });
    }

    // Méthode pour charger les commentaires lors d'un changement d'événement
    loadCommentsForEvent(eventId: string): void {
        console.log(`Chargement des commentaires pour l'événement ${eventId} (actuel: ${this.currentEventId})`);
        
        // Si l'ID d'événement a changé, réinitialiser les commentaires
        if (this.currentEventId !== eventId) {
            this.commentService.resetComments();
            this.currentEventId = eventId;
            this.loadComments();
            this.cdr.markForCheck();
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
        this.loadComments();
      }
    }

    // Méthode modifiée pour ajouter un commentaire via le service
    addComment(): void {
        if (!this.newComment.trim() || !this.isLoggedIn) return;
        
        const activeEvent = this.getActiveEvent();
        if (!activeEvent) return;
        
        const eventId = activeEvent.id.toString();
        console.log(`Ajout d'un commentaire pour l'événement actif: ${eventId}`);
        
        const comment: Comment = {
            content: this.newComment.trim(),
            eventId: eventId,
            authorEmail: this.userName // Utilisation temporaire du nom d'utilisateur comme email
        };
        
        this.commentService.createComment(comment).subscribe({
            next: () => {
                this.newComment = ''; // Réinitialiser le champ après envoi
                this.cdr.markForCheck();
            },
            error: (error) => {
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

    // Méthode pour cacher le panneau des civilisations
    hideCivilizationsPanel(): void {
        // Animation de sortie puis fermeture
        this.closeWithAnimation(() => {
            this.civilizationsPanelOpen = false;
            this.cdr.markForCheck();
        });
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
        this.detailsVisible = false;
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
                console.log(`Événement actif récupéré: ${activeEvent.id} - ${activeEvent.title}`);
                return activeEvent;
            }
        }
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
}
