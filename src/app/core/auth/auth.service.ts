import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { environment } from 'environments/environment';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, catchError, Observable, of, switchMap, throwError } from 'rxjs';

type userToken = { name: string; email: string; given_name: string; family_name: string; sid: string };
export interface User {
  id?: string;
  name?: string;
  email: string;
  given_name?: string;
  family_name?: string;
  sid?: string;
}

export interface AuthResponse {
    token: string;
    email: string;
    role: string;
    expiresIn: number;
}

export enum AuthLoadingState {
  INIT = 'INIT',
  LOADING = 'LOADING',
  LOADED = 'LOADED',
  ERROR = 'ERROR'
}

export interface AuthState {
  loading: AuthLoadingState;
  user: User | null;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _authenticated: boolean = false;
    private _httpClient = inject(HttpClient);
    
    // BehaviorSubject pour l'état de connexion
    private _isLoggedInSubject = new BehaviorSubject<boolean>(false);
    public isLoggedIn$ = this._isLoggedInSubject.asObservable();
    
    // BehaviorSubject pour l'état d'authentification complet
    private _authStateSubject = new BehaviorSubject<AuthState>({
        loading: AuthLoadingState.INIT,
        user: null
    });
    public authState$ = this._authStateSubject.asObservable();

    constructor() {
        // Initialiser l'état de connexion au démarrage
        const hasToken = !!this.accessToken;
        const isTokenValid = hasToken && !AuthUtils.isTokenExpired(this.accessToken);
        
        this._isLoggedInSubject.next(isTokenValid);
        this._authenticated = isTokenValid;
        
        // Si un token valide existe, essayer de récupérer les informations utilisateur
        if (isTokenValid) {
            const userInfo = this.getInfoUser(this.accessToken);
            this._authStateSubject.next({
                loading: AuthLoadingState.LOADED,
                user: userInfo
            });
        }
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

    
    /**
     * Getter pour l'état d'authentification
     */
    get isAuthenticated(): boolean {
        return this._authenticated;
    }
    
    /**
     * Getter pour l'utilisateur actuel
     */
    get currentUser(): User | null {
        return this._authStateSubject.value.user;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: { email: string; password: string }): Observable<any> {
        // Mettre à jour l'état de chargement
        this._authStateSubject.next({
            loading: AuthLoadingState.LOADING,
            user: null
        });

        // Appel API au endpoint login
        return this._httpClient.post<AuthResponse>(
            environment.ENDPOINT.login(), 
            credentials
        ).pipe(
            switchMap((response: AuthResponse) => {
                // Stocker les tokens
                this.accessToken = response.token;
                
                // Décoder les informations utilisateur
                const userInfo = this.getInfoUser(response.token);
                
                // Mettre à jour les états
                this._authenticated = true;
                this._isLoggedInSubject.next(true);
                this._authStateSubject.next({
                    loading: AuthLoadingState.LOADED,
                    user: userInfo
                });

                return of(response);
            }),
            catchError(error => {
                // Mettre à jour l'état en cas d'erreur
                this._authStateSubject.next({
                    loading: AuthLoadingState.ERROR,
                    user: null,
                    error: error.error?.message || 'Erreur lors de la connexion'
                });
                return throwError(() => error);
            })
        );
    }

    /**
     * Sign in using the access token
     */
    signInUsingToken(): Observable<boolean> {
        // Si pas de refresh token, impossible de rafraîchir la session
        // if (!this.refreshToken) {
        //     return of(false);
        // }

        // Paramètres pour le refresh token
        const urlencoded = new URLSearchParams();
        urlencoded.append('grant_type', 'refresh_token');
        // urlencoded.append('refresh_token', this.refreshToken);
        urlencoded.append('client_id', 'chrono_explorer_client');

        return this._httpClient.post<AuthResponse>(
            environment.ENDPOINT.login(), 
            urlencoded.toString(),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        ).pipe(
            switchMap((response: AuthResponse) => {
                console.log('🚀 ~ AuthService ~ switchMap ~ response:', response)
                // Stocker les nouveaux tokens
                this.accessToken = response.token;
                
                // Décoder les informations utilisateur
                const userInfo = this.getInfoUser(response.token);
                
                // Mettre à jour les états
                this._authenticated = true;
                this._isLoggedInSubject.next(true);
                this._authStateSubject.next({
                    loading: AuthLoadingState.LOADED,
                    user: userInfo
                });

                return of(true);
            }),
            catchError(() => {
                // En cas d'échec, effacer les tokens et déconnecter
                this.signOut();
                return of(false);
            })
        );
    }

    /**
     * Sign out
     */
    signOut(): Observable<boolean> {
        // Mettre à jour l'état de chargement
        this._authStateSubject.next({
            loading: AuthLoadingState.LOADING,
            user: this._authStateSubject.value.user
        });

        // Supprimer les tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Mettre à jour les états
        this._authenticated = false;
        this._isLoggedInSubject.next(false);
        this._authStateSubject.next({
            loading: AuthLoadingState.LOADED,
            user: null
        });

        return of(true);
    }

    /**
     * Sign up
     *
     * @param userData
     */
    signUp(userData: { email: string; password: string; name?: string }): Observable<any> {
        return this._httpClient.post(
            environment.ENDPOINT.register(),
            userData
        ).pipe(
            catchError(error => throwError(() => error))
        );
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        // Si déjà authentifié
        if (this._authenticated) {
            return of(true);
        }

        // Si pas de token
        if (!this.accessToken) {
            return of(false);
        }

        // Si token expiré
        if (AuthUtils.isTokenExpired(this.accessToken)) {
            // Essayer de rafraîchir avec le refresh token
            return this.signInUsingToken();
        }

        // Token valide, récupérer les infos utilisateur
        const userInfo = this.getInfoUser(this.accessToken);
        this._authenticated = true;
        this._isLoggedInSubject.next(true);
        this._authStateSubject.next({
            loading: AuthLoadingState.LOADED,
            user: userInfo
        });
        
        return of(true);
    }
    
    /**
     * Obtenir les informations de l'utilisateur à partir du token
     */
    getInfoUser(token: string): userToken {
        return jwtDecode(token);
    }
}
