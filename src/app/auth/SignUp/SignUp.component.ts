import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

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

  // BehaviorSubject pour gérer l'animation de transition
  isSignedUp = new BehaviorSubject<boolean>(false);

  constructor(private router: Router) {}

  ngOnInit() {}

  onSignUp(event: Event) {
    event.preventDefault();

    // Validation du formulaire
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      // Gestion des erreurs - à implémenter
      return;
    }

    if (this.password !== this.confirmPassword) {
      // Gestion des erreurs - à implémenter
      return;
    }

    // Simuler une inscription réussie
    // Remplacer par votre logique d'authentification réelle

    // Déclencher l'animation de transition
    this.isSignedUp.next(true);

    // Rediriger après un délai pour permettre à l'animation de se terminer
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 1500);
  }
}
