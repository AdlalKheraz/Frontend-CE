import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from 'app/core/auth/auth.service'; // Importer AuthService

@Component({
  selector: 'app-signup',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './SignUp.component.html',
  styleUrls: ['./SignUp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUpComponent implements OnInit {
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  errorMessage: string = ''; // Pour afficher les messages d'erreur

  // BehaviorSubject pour gérer l'animation de transition
  isSignedUp = new BehaviorSubject<boolean>(false);
  isLoading = new BehaviorSubject<boolean>(false);
  

  constructor(
    private router: Router,
    private authService: AuthService // Injecter AuthService
  ) {}

  ngOnInit() {}

  onSignUp(event: Event) {
    event.preventDefault();
    this.errorMessage = ''; // Réinitialiser les erreurs précédentes
    
    // Validation du formulaire
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
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
    this.authService.signUp({
      name: this.name,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        // Inscription réussie
        this.isLoading.next(false);
        this.isSignedUp.next(true);
        
        // Rediriger après un délai pour permettre à l'animation de se terminer
        setTimeout(() => {
          // Optionnel : connecter automatiquement l'utilisateur après inscription
          this.authService.signIn({
            email: this.email,
            password: this.password
          }).subscribe(() => {
            this.router.navigate(['/home']);
          });
        }, 1500);
      },
      error: (error) => {
        // Gérer les erreurs d'inscription
        this.isLoading.next(false);
        this.errorMessage = error.error?.message || 'Erreur lors de l\'inscription';
      }
    });
  }
}
