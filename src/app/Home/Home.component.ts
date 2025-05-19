import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { Subscription } from 'rxjs';
// import { AuthStoreService } from '@core/auth/auth.store';
import { FormsModule } from '@angular/forms';
import { TimeLineScrolleComponent } from './TimeLineScrolle/TimeLineScrolle.component';

// Type pour les commentaires
interface Comment {
    author: string;
    date: string;
    text: string;
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

    ngOnInit(): void {
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
    
    // Méthode pour basculer l'état de l'îlot dynamique
    toggleIsland(): void {
        this.islandExpanded = !this.islandExpanded;
    }
    
    // Méthode pour ouvrir/fermer le panneau de commentaires
    toggleComments(): void {
        this.commentsOpen = !this.commentsOpen;
        // On n'a plus besoin de gérer le shifting ici car c'est fait par le binding dans le template
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
}
