import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthStoreService } from '@core/auth/auth.store';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './Home.component.html',
    styleUrl: './Home.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
    isLoggedIn = false;
    private _subscription: Subscription = new Subscription();
    
    private router:Router = inject(Router);
	private authService: AuthService = inject(AuthService);
    // private authStoreService = inject(AuthStoreService);

    
    ngOnDestroy() {
        // Se désabonner pour éviter les fuites de mémoire
        this._subscription.unsubscribe();
    }
    
    goToDashboard() {
        this.router.navigate(['/']);
    }
    
    logout() {
        this.authService.signOut().subscribe(() => {
            setTimeout(() => {
                this.router.navigate(['/login']);
            }, 500);
        });
    }
}
