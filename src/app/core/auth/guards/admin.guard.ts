import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { jwtDecode } from 'jwt-decode';
import { of, switchMap } from 'rxjs';

export const AdminGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router: Router = inject(Router);
    const authService: AuthService = inject(AuthService);

    // Check the authentication status
    return authService.check().pipe(
        switchMap(authenticated => {
            // If the user is not authenticated...
            if (!authenticated) {
                // Redirect to the sign-in page with a redirectUrl param
                const redirectURL = state.url === '/sign-out' ? '' : `redirectURL=${state.url}`;
                const urlTree = router.parseUrl(`sign-in?${redirectURL}`);
                return of(urlTree);
            }

            // Check if user has admin role
            const user = authService.getInfoUser(authService.accessToken); // Assuming AuthService has a user property
            if (!user || !user.role || !user.role.includes('ADMIN')) {
                // Redirect to unauthorized page or dashboard
                const urlTree = router.parseUrl('/home');
                return of(urlTree);
            }

            // Allow the access
            return of(true);
        }),
    );
};