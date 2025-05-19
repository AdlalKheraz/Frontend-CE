import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthUtils } from 'app/core/auth/auth.utils';
// import { UserService } from 'app/core/user/user.service';
import { environment } from 'environments/environment';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, throwError } from 'rxjs';
import { AuthStoreService } from './auth.store';

type userToken = { name: string; email: string; given_name: string; family_name: string; sid: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _authenticated: boolean = false;
    private _httpClient = inject(HttpClient);
    // private authStoreService = inject(AuthStoreService);
    // private _userService = inject(UserService);
    
    // Ajouter un BehaviorSubject pour l'état de connexion
    private _isLoggedInSubject = new BehaviorSubject<boolean>(false);
    public isLoggedIn$ = this._isLoggedInSubject.asObservable();

    constructor() {
        // Initialiser l'état de connexion au démarrage
        this._isLoggedInSubject.next(!!this.accessToken && !AuthUtils.isTokenExpired(this.accessToken));
        this._authenticated = this._isLoggedInSubject.value;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */

    set accessToken(token: string) {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string {
        return localStorage.getItem('accessToken') ?? '';
    }
    set refreshToken(token: string) {
        localStorage.setItem('refreshToken', token);
    }

    get refreshToken(): string {
        return localStorage.getItem('refreshToken') ?? '';
    }
    
    /**
     * Getter pour l'état d'authentification
     */
    get isAuthenticated(): boolean {
        return this._authenticated;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param username
     */
    // forgotPassword(username: string): Observable<any> {
    //     return this._httpClient.put(environment.ENDPOINT.forgotPassword(username), null);
    // }

    /**
     * Reset password
     *
     * @param password
     */
    // resetPassword(): Observable<any> {
    //     return this._httpClient.put(environment.ENDPOINT.resetPassword(), null);
    // }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: { email: string; password: string }): Observable<any> {
        // Throw error, if the user is already logged in
        // if (this._authenticated) {
        //     return throwError('User is already logged in.');
        // }
        // const urlencoded = new URLSearchParams();
        // urlencoded.append('client_id', 'web_app');
        // urlencoded.append('username', credentials.email);
        // urlencoded.append('password', credentials.password);
        // urlencoded.append('grant_type', 'password');
        // return this._httpClient.post('api/auth/sign-in', credentials).pipe(
        this._authenticated = true;
                    // Mettre à jour le BehaviorSubject
        // this.authStoreService.setLogged(true);
        this._isLoggedInSubject.next(true);
        // return this._httpClient
        //     .post(environment.keyclock.login(), urlencoded, {
        //         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        //     })
        //     .pipe(
        //         switchMap((response: any) => {
        //             // Store the access token in the local storage
        //             this.accessToken = response.access_token;
        //             this.refreshToken = response.refresh_token;
        //             // Set the authenticated flag to true
        //             this._authenticated = true;
        //             // Mettre à jour le BehaviorSubject
        //             this._isLoggedInSubject.next(true);

        //             // Return a new observable with the response
        //             return of(response);
        //         }),
        //     );
        return of({});
    }
    /**
     * Sign in using the access token
     */
    signInUsingToken(): Observable<any> {
        // Sign in using the token
        const urlencoded = new URLSearchParams();
        urlencoded.append('client_id', 'web_app');
        urlencoded.append('refresh_token', this.refreshToken);
        urlencoded.append('grant_type', 'refresh_token');
        // return this._httpClient
        //     .post(environment.keyclock.login(), urlencoded, {
        //         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        //     })
        //     .pipe(
        //         catchError(() => {
        //             // Mettre à jour l'état en cas d'échec
        //             this._authenticated = false;
        //             this._isLoggedInSubject.next(false);
        //             // Return false
        //             return of(false);
        //         }),
        //         switchMap((response: any) => {
        //             if (!response) {
        //                 return of(false);
        //             }
        //             // Replace the access token with the new one if it's available on
        //             // the response object.
        //             this.accessToken = response.access_token;
        //             this.refreshToken = response.refresh_token;
        //             const info = this.getInfoUser(response.access_token);
        //             // Set the authenticated flag to true
        //             this._authenticated = true;
        //             // Mettre à jour le BehaviorSubject
        //             this._isLoggedInSubject.next(true);


        //             // Return true
        //             return of(true);
        //         }),
        //     );
        return of(true);
    }

    /**
     * Sign out
     */
    signOut(): Observable<any> {
        // Remove the access token from the local storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Set the authenticated flag to false				
        
        setTimeout(() => {

            this._authenticated = false;
        // this.authStoreService.setLogged(false);
        // Mettre à jour le BehaviorSubject
            this._isLoggedInSubject.next(false);
        }, 1000);

        // Return the observable
        return of(true);
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: { name: string; email: string; password: string; company: string }): Observable<any> {
        // return this._httpClient.post('api/auth/sign-up', user);
        const m_user = {
            'attributes': {
                'attribute_key': 'test_value',
            },
            'credentials': [
                {
                    'temporary': false,
                    'type': 'password',
                    'value': user.password,
                },
            ],
            'username': 'test_admin',
            'firstName': user.name,
            'lastName': user.name,
            'email': user.email,
            'emailVerified': false,
            'enabled': true,
        };
        console.log(m_user);
        // return this._httpClient.post(environment.ENDPOINT.inscription(), m_user);
        return this._httpClient.post('api/auth/sign-up', m_user);
    }

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: { email: string; password: string }): Observable<any> {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        // Check if the user is logged in
        if (this._authenticated) {
            return  of(true);
        }
        // Check the access token availability
        // if (!this.accessToken) {
        //     this._isLoggedInSubject.next(false);
        //     return of(false);
        // }

        // // Check the access token expire date
        // if (AuthUtils.isTokenExpired(this.accessToken)) {
        //     this._isLoggedInSubject.next(false);
        //     return of(false);
        // }

        // If the access token exists, and it didn't expire, sign in using it
        // return this.signInUsingToken();
        return of(!!this.accessToken);
    }
    
    /**
     * Obtenir les informations de l'utilisateur à partir du token
     */
    getInfoUser(token: string): userToken {
        // Implémentez cette méthode si elle n'existe pas déjà
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            return {} as userToken;
        }
        
        try {
            const tokenPayload = JSON.parse(atob(tokenParts[1]));
            return tokenPayload as userToken;
        } catch (error) {
            console.error('Erreur lors du décodage du token', error);
            return {} as userToken;
        }
    }
}
