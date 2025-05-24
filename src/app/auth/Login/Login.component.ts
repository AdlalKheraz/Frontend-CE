import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { EventService, HistoricalEvent } from '../../core/services/event.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
this.firstEvent$ .subscribe(event => {console.log('Premier événement:', event); // Afficher le premier événement dans la console
})
		// Charger tous les événements pour récupérer le premier
		this.eventService.loadAllEnrichedEvents().subscribe();
	}

	onLogin(e: Event) {
		e.preventDefault();
		// Utiliser le service d'authentification pour se connecter
		this.authService.signIn({ email: this.email, password: this.password }).subscribe({
			next: () => {
				// Donner le temps de voir l'animation avant la redirection
				this.startTransitionToHome();
			},
			error: () => {
				alert('Identifiants incorrects ou problème de connexion');
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
