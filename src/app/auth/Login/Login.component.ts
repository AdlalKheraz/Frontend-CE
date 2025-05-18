import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { AuthStoreService } from '@core/auth/auth.store';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-login',
	standalone: true,
	imports: [CommonModule, FormsModule, RouterModule],
	templateUrl: './Login.component.html',
	styleUrls: ['./Login.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent  {
	email = '';
	password = '';
	private router:Router = inject(Router);
	private authService: AuthService = inject(AuthService);
	// authStoreService:AuthStoreService = inject(AuthStoreService);
	isLoggedIn =this.authService.isLoggedIn$



	onLogin(e: Event) {
		e.preventDefault();
		// Utiliser le service d'authentification pour se connecter
		this.authService.signIn({ email: this.email, password: this.password }).subscribe({
			next: () => {
				// Donner le temps de voir l'animation avant la redirection
				setTimeout(() => {
					this.router.navigate(['/home']);
				}, 1100);
			},
			error: () => {
				alert('Identifiants incorrects ou problème de connexion');
			},
		});
	}
}
