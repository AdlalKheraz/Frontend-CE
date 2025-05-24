import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventService, HistoricalEvent } from '../../core/services/event.service';

@Component({
	selector: 'app-login',
	standalone: true,
	imports: [CommonModule, FormsModule, RouterModule],
	templateUrl: './Login.component.html',
	styleUrls: ['./Login.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
	email = '';
	password = '';
	isTransitioning = false;
	firstEvent$: Observable<HistoricalEvent | null> | undefined;
	errorMessage = '';
	isLoading = false;

	private router: Router = inject(Router);
	private authService: AuthService = inject(AuthService);
	private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
	// authStoreService:AuthStoreService = inject(AuthStoreService);
	isLoggedIn = this.authService.isLoggedIn$;

	constructor(private eventService: EventService) {}

	ngOnInit() {
		// Récupérer le premier événement
		this.firstEvent$ = this.eventService.events$.pipe(
			map(state => (state.data && state.data.length > 0 ? state.data[0] : null))
		);

		// Charger tous les événements pour récupérer le premier
		this.eventService.loadAllEvents().subscribe();
		
		// Vérifier si l'utilisateur est déjà connecté
		this.authService.check().subscribe(isAuthenticated => {
			if (isAuthenticated) {
				this.router.navigate(['/home']);
			}
		});
	}

	onLogin(e: Event) {
		e.preventDefault();
		this.errorMessage = '';
		
		if (!this.email || !this.password) {
			this.errorMessage = 'Veuillez remplir tous les champs';
			this.cdr.markForCheck();
			return;
		}
		
		this.isLoading = true;
		this.cdr.markForCheck();
		
		// Utiliser le service d'authentification pour se connecter
		this.authService.signIn({ email: this.email, password: this.password }).subscribe({
			next: () => {
				// Donner le temps de voir l'animation avant la redirection
				this.isLoading = false;
				this.startTransitionToHome();
			},
			error: (error) => {
				this.isLoading = false;
				console.error('Erreur de connexion:', error);
				this.errorMessage = error.error?.message || 'Identifiants incorrects ou problème de connexion';
				this.cdr.markForCheck();
			},
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
