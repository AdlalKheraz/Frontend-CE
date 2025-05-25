import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { Civilization, CivilizationService } from '@app/core/services/civilization.service';
import { CommentService } from '@app/core/services/comment.service';
import { EventService } from '@app/core/services/event.service';
import { Subject, catchError, combineLatest, forkJoin, of, takeUntil } from 'rxjs';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, AdminSidebarComponent],
    templateUrl: './Dashboard.component.html',
    styleUrl: './Dashboard.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
    // Statistiques du dashboard
    totalUsers = 0;
    onlineUsers = 0;
    totalEvents = 0;
    totalCivilizations = 0;
    totalComments = 0;
    totalPageViews = 0;
    totalFavorites = 0;
    
    // Date du jour formatée pour l'affichage
    todayDate = new Date().toISOString();
    
    // Données pour les graphiques
    eventsPerCivilization: any[] = [];
    usersActivity: any[] = [];
    
    // Événements récents
    recentEvents: any[] = [];
    
    // Commentaires récents
    recentComments: any[] = [];
    
    // Civilisations chargées
    civilizations: Civilization[] = [];
    
    // États de chargement
    loading = {
        overview: true,
        events: true,
        comments: true,
        civilizations: true
    };
    
    // Erreurs
    error: string | null = null;
    
    // Utilisateur actuel
    currentUser: any;

    private destroy$ = new Subject<void>();

    constructor(
        private eventService: EventService,
        private commentService: CommentService,
        private civilizationService: CivilizationService,
        private authService: AuthService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.checkAuth();
        this.loadDashboardData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private checkAuth(): void {
        // Vérifier si l'utilisateur est connecté et est admin
        this.authService.fetchCurrentUserFromToken()
            .pipe(takeUntil(this.destroy$))
            .subscribe(user => {
                if (!user || user.role !== 'ADMIN') {
                    // Rediriger vers la page de connexion si l'utilisateur n'est pas admin
                    this.router.navigate(['/login']);
                    return;
                }
                
                this.currentUser = user;
                this.cdr.markForCheck();
            });
    }

    private loadDashboardData(): void {
        // Charger les statistiques générales et les civilisations
        this.loadOverviewStats();
        
        // Charger les événements récents et les commentaires
        this.loadRecentEvents();
        this.loadRecentComments();
        
        // Synchroniser le chargement des événements et civilisations pour générer les données
        this.synchronizeEventsAndCivilizations();
    }

    private loadOverviewStats(): void {
        this.loading.overview = true;
        this.loading.civilizations = true;
        
        // Utiliser forkJoin pour combiner plusieurs requêtes en une seule réponse
        forkJoin({
            users: this.authService.getAllUsers().pipe(catchError(() => of([]))),
            events: this.eventService.loadAllEvents().pipe(catchError(() => of([]))),
            comments: this.commentService.loadAllComments().pipe(catchError(() => of([]))),
            civilizations: this.civilizationService.loadAllCivilizations().pipe(catchError(() => of([])))
        }).subscribe({
            next: (results) => {
                // Mettre à jour les statistiques
                this.totalUsers = results.users.length || 0;
                this.onlineUsers = Math.floor(this.totalUsers * 0.3); // Simulé: 30% des utilisateurs en ligne
                this.totalEvents = results.events.length || 0;
                this.totalComments = results.comments.length || 0;
                this.totalCivilizations = results.civilizations.length || 0;
                
                // Stocker les civilisations
                this.civilizations = results.civilizations;
                
                // Simuler les vues de page et favoris
                this.totalPageViews = this.totalEvents * 15 + 100;
                this.totalFavorites = Math.floor(this.totalEvents * 0.4);
                
                this.loading.overview = false;
                this.loading.civilizations = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('Erreur lors du chargement des statistiques', err);
                this.error = 'Erreur lors du chargement des données du dashboard';
                this.loading.overview = false;
                this.loading.civilizations = false;
                this.cdr.markForCheck();
            }
        });
    }

    private loadRecentEvents(): void {
        this.loading.events = true;
        
        this.eventService.loadAllEnrichedEvents()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (events) => {
                    // Trier par date décroissante
                    this.recentEvents = events
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 5); // Prendre les 5 plus récents
                    
                    this.loading.events = false;
                    this.cdr.markForCheck();
                },
                error: (err) => {
                    console.error('Erreur lors du chargement des événements récents', err);
                    this.loading.events = false;
                    this.cdr.markForCheck();
                }
            });
    }

    private loadRecentComments(): void {
        this.loading.comments = true;
        
        this.commentService.loadAllComments()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (comments) => {
                    // Trier par date décroissante en utilisant postedAt
                    this.recentComments = comments
                        .sort((a, b) => {
                            const dateA = (a as any)?.postedAt || '';
                            const dateB = (b as any)?.postedAt || '';
                            if (!dateA || !dateB) return 0;
                            return new Date(dateB).getTime() - new Date(dateA).getTime();
                        })
                        .slice(0, 5); // Prendre les 5 plus récents
                    
                    this.loading.comments = false;
                    this.cdr.markForCheck();
                },
                error: (err) => {
                    console.error('Erreur lors du chargement des commentaires récents', err);
                    this.loading.comments = false;
                    this.cdr.markForCheck();
                }
            });
    }

    private synchronizeEventsAndCivilizations(): void {
        combineLatest([
            this.eventService.loadAllEnrichedEvents().pipe(catchError(() => of([]))),
            this.civilizationService.loadAllCivilizations().pipe(catchError(() => of([])))
        ]).pipe(takeUntil(this.destroy$))
            .subscribe({
            next: ([events, civilizations]) => {
                this.civilizations = civilizations;
                this.generateEventsPerCivilizationData(events);
                },
                error: (err) => {
                console.error('Erreur lors de la synchronisation des données', err);
                }
            });
    }

    private generateEventsPerCivilizationData(events: any[]): void {
        // Créer un dictionnaire pour compter les événements par civilisation
        const eventCountsByCiv: {[key: string]: number} = {};
        
        events.forEach(event => {
            const civId = event.civilizationId ? event.civilizationId.toString() : 'Autres';
            if (!eventCountsByCiv[civId]) {
                eventCountsByCiv[civId] = 0;
            }
            eventCountsByCiv[civId]++;
        });
        
        // Convertir en tableau pour l'affichage avec les vrais noms des civilisations
        this.eventsPerCivilization = Object.entries(eventCountsByCiv).map(([id, count]) => ({
            name: this.getCivilizationName(id),
            count
        }));
        
        // Trier par nombre d'événements décroissant
        this.eventsPerCivilization.sort((a, b) => b.count - a.count);
        
        this.cdr.markForCheck();
    }

    // Méthode pour obtenir le nom d'une civilisation par son ID
    getCivilizationName(civilizationId: string | number): string {
        if (!civilizationId || civilizationId === 'Autres') {
            return 'Autres';
        }
        
        const civilization = this.civilizations.find(civ => civ.id?.toString() === civilizationId.toString());
        return civilization ? civilization.name : `Civilisation ${civilizationId}`;
    }

    // Navigation
    navigateToDashboard(): void {
        this.router.navigate(['/admin/dashboard']);
    }

    navigateToEvents(): void {
        this.router.navigate(['/admin/events']);
    }
    
    navigateToUsers(): void {
        this.router.navigate(['/admin/users']);
    }
    
    navigateToComments(): void {
        this.router.navigate(['/admin/comments']);
    }
    
    navigateToSettings(): void {
        this.router.navigate(['/admin/settings']);
    }
    
    signOut(): void {
        this.authService.signOut().subscribe(() => {
            this.router.navigate(['/login']);
        });
    }

    formatDate(dateStr?: string): string {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return '';
        }
    }

    formatCommentDate(comment: any): string {
        if (!comment) return '';
        const dateStr = comment.postedAt || comment.createdAt || '';
        return this.formatDate(dateStr);
    }
}
