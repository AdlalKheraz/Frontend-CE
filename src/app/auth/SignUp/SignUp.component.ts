import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventService, HistoricalEvent } from '../../core/services/event.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './SignUp.component.html',
  styleUrls: ['./SignUp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUpComponent implements OnInit {
  name: string = '';
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  isTransitioning = false;

  isSignedUp = new BehaviorSubject<boolean>(false);
  isLoading = new BehaviorSubject<boolean>(false);
  firstEvent$: Observable<HistoricalEvent | null>;

  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  constructor(
    private router: Router,
    private authService: AuthService,
    private eventService: EventService
  ) {
    this.firstEvent$ = this.eventService.events$.pipe(
      map(state => state.data && state.data.length > 0 ? state.data[0] : null)
    );
  }

  ngOnInit() {
    this.eventService.loadAllEnrichedEvents().subscribe();
    
    // Vérifier si l'utilisateur est déjà connecté
    this.authService.check().subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.router.navigate(['/home']);
      }
    });
  }

  onSignUp(event: Event) {
    event.preventDefault();
    this.errorMessage = '';
    
    // Validation du formulaire
    if (!this.email || !this.password || !this.confirmPassword || !this.firstName || !this.lastName) {
      this.errorMessage = 'Tous les champs sont obligatoires';
      this.cdr.markForCheck();
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      this.cdr.markForCheck();
      return;
    }

    // Activer l'indicateur de chargement
    this.isLoading.next(true);
    this.cdr.markForCheck();

    console.log('Tentative d\'inscription avec:', {
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName
    });

    // Utiliser le service d'authentification pour l'inscription
    this.authService.signUp({
      email: this.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName
    }).subscribe({
      next: (response) => {
        console.log('Inscription réussie:', response);
        this.isLoading.next(false);
        this.isSignedUp.next(true);
        this.cdr.markForCheck();
        
        setTimeout(() => {
          this.authService.signIn({
            email: this.email,
            password: this.password
          }).subscribe({
            next: () => {
              console.log('Connexion automatique réussie');
              this.startTransitionToHome();
            },
            error: (loginError) => {
              console.error('Erreur lors de la connexion automatique:', loginError);
              this.errorMessage = 'Inscription réussie mais échec de connexion automatique. Veuillez vous connecter manuellement.';
              this.router.navigate(['/login']);
              this.cdr.markForCheck();
            }
          });
        }, 1500);
      },
      error: (error) => {
        console.error('Erreur lors de l\'inscription:', error);
        this.isLoading.next(false);
        this.errorMessage = error.error?.message || 'Erreur lors de l\'inscription. Veuillez réessayer.';
        this.cdr.markForCheck();
      }
    });
  }
  
  // Méthode pour naviguer vers la page d'accueil avec une animation
  navigateToHome() {
    // Si on clique sur l'aperçu, on démarre l'animation et on navigue sans connexion
    this.startTransitionToHome();
  }
  
  // Méthode pour démarrer l'animation de transition
  private startTransitionToHome() {
    this.isTransitioning = true;
    this.cdr.markForCheck();
    
    // Navigation plus rapide pour synchroniser avec l'animation
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 300);
  }
}
