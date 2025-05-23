import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { BehaviorSubject } from 'rxjs';

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
  
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {}

  onSignUp(event: Event) {
    event.preventDefault();
    this.errorMessage = '';
    
    // Validation du formulaire
    if (!this.email || !this.password || !this.confirmPassword || !this.firstName || !this.lastName) {
      this.errorMessage = 'Tous les champs sont obligatoires';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    // Activer l'indicateur de chargement
    this.isLoading.next(true);

    // Utiliser le service d'authentification pour l'inscription
    // Adaptation selon la structure attendue par l'API dans Postman
    this.authService.signUp({
      email: this.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName
    }).subscribe({
      next: () => {
        this.isLoading.next(false);
        this.isSignedUp.next(true);
        
        setTimeout(() => {
          this.authService.signIn({
            email: this.email,
            password: this.password
          }).subscribe(() => {
            this.startTransitionToHome();
          });
        }, 1500);
      },
      error: (error) => {
        this.isLoading.next(false);
        this.errorMessage = error.error?.message || 'Erreur lors de l\'inscription';
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
    
    // Laisser le temps à l'animation de se dérouler avant de naviguer
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 1200);
  }
}
