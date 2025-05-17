import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
	selector: 'app-login',
	imports: [CommonModule,FormsModule],
	templateUrl: './Login.component.html',
	styleUrls: ['./Login.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
	isLoggedIn = false;
	email = '';
	password = '';

	constructor(private router: Router) {}

	onLogin(e: Event) {
		e.preventDefault();
		console.log('🚀 ~ LoginComponent ~ onLogin ~ e:', e)
		// Ici, ajoutez votre logique d'authentification
		if (this.email && this.password) {
			this.isLoggedIn = true;

			// Donner le temps de voir l'animation avant la redirection
			setTimeout(() => {
				this.router.navigate(['/dashboard']); // Décommentez pour la redirection
			}, 2000);
		}
	}

	goToDashboard() {
		this.router.navigate(['/dashboard']);
	}
}
