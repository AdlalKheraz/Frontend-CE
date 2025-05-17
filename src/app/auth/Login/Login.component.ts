import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
	selector: 'app-login',
	standalone: true,
	imports: [CommonModule, FormsModule, RouterModule],
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
		// Ici, ajoutez votre logique d'authentification
		if (this.email && this.password) {
			this.isLoggedIn = true;
			// Donner le temps de voir l'animation avant la redirection
			setTimeout(() => {
				this.router.navigate(['/dashboard']);
			}, 2000);
		} else {
			alert('Veuillez remplir tous les champs');
		}
	}

	goToDashboard() {
		this.router.navigate(['/dashboard']);
	}
}
