import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { environment } from 'environments/environment';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, catchError, Observable, of, switchMap, throwError } from 'rxjs';

type userToken = { name: string; email: string; given_name: string; family_name: string; sid: string, userId: string };
export interface User {
  id?: string;
  name?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  given_name?: string;
  family_name?: string;
  sid?: string;
  role?: string; // Ajout du rôle
}

export interface AuthResponse {
    token: string;
    email: string;
    role: string;
    expiresIn: number;
    firstName: string,
    lastName: string,
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

// Définir les interfaces pour la gestion des utilisateurs
export interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    email?: string;
}

export interface UpdateRoleData {
    role: string;
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
    
    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('accessToken');
        return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
        });
    }
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
                const info= {
                    ...userInfo, 
                    firstName: response.firstName, 
                    lastName: response.lastName,
                    role: response.role
                };
                
                // Mettre à jour les états
                this._authenticated = true;
                this._isLoggedInSubject.next(true);
                this._authStateSubject.next({
                    loading: AuthLoadingState.LOADED,
                    user: info
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
    signUp(userData: { email: string; password: string; firstName: string; lastName: string }): Observable<any> {
        return this._httpClient.post(
            environment.ENDPOINT.register(),
            userData,
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

    // -----------------------------------------------------------------------------------------------------
    // @ User Management methods
    // -----------------------------------------------------------------------------------------------------
    
    /**
     * Récupérer tous les utilisateurs (admin uniquement)
     */
    getAllUsers(): Observable<User[]> {
        return this._httpClient.get<User[]>(
            environment.ENDPOINT.users(),
            { headers: this.getHeaders() }
        ).pipe(
            catchError(error => throwError(() => error))
        );
    }
    
    /**
     * Récupérer un utilisateur par son ID
     */
    getUserById(userId: string): Observable<User> {
        return this._httpClient.get<User>(
            environment.ENDPOINT.userById(userId),
            { headers: this.getHeaders() }
        ).pipe(
            catchError(error => throwError(() => error))
        );
    }
    
    /**
     * Récupérer l'utilisateur courant à partir de l'id du token et mettre à jour _authStateSubject
     */
    fetchCurrentUserFromToken(): Observable<User | null> {
        const token = this.accessToken;
        if (!token) {
            this._authStateSubject.next({
                loading: AuthLoadingState.ERROR,
                user: null,
                error: 'Aucun token trouvé'
            });
            return of(null);
        }
        
        let userId: string;
        try {
            const decoded = this.getInfoUser(token);
            userId = decoded.userId;
        } catch (e) {
            this._authStateSubject.next({
                loading: AuthLoadingState.ERROR,
                user: null,
                error: 'Token invalide'
            });
            return of(null);
        }
        
        // this._authStateSubject.next({
        //     loading: AuthLoadingState.LOADING,
        //     user: null
        // });

        return this.getUserById(userId).pipe(
            switchMap((user: User) => {
                this._authStateSubject.next({
                    loading: AuthLoadingState.LOADED,
                    user
                });
                return of(user);
            }),
            catchError(error => {
                this._authStateSubject.next({
                    loading: AuthLoadingState.ERROR,
                    user: null,
                    error: error.error?.message || 'Erreur lors de la récupération de l\'utilisateur'
                });
                return of(null);
            })
        );
    }
    /**
     * Mettre à jour les informations d'un utilisateur
     */
    updateUser(userId: string, userData: UpdateUserData): Observable<User> {
        return this._httpClient.put<User>(
            environment.ENDPOINT.userById(userId),
            userData,
            { headers: this.getHeaders() }
        ).pipe(
            catchError(error => throwError(() => error))
        );
    }
    /**
     * Supprimer un utilisateur (admin uniquement)
     */
    deleteUser(userId: string): Observable<void> {
        return this._httpClient.delete<void>(
            environment.ENDPOINT.userById(userId),
            { headers: this.getHeaders() }
        ).pipe(
            catchError(error => throwError(() => error))
        );
    }
    deleteMeUser(): Observable<void> {
        return this._httpClient.delete<void>(
            environment.ENDPOINT.usersMe(),
            { headers: this.getHeaders() }
        ).pipe(
            catchError(error => throwError(() => error))
        );
    }
    
    /**
     * Mettre à jour le rôle d'un utilisateur (admin uniquement)
     */
    updateUserRole(userId: string, roleData: UpdateRoleData): Observable<User> {
        return this._httpClient.patch<User>(
            environment.ENDPOINT.updateUserRole(userId),
            roleData,
            { headers: this.getHeaders() }
        ).pipe(
            catchError(error => throwError(() => error))
        );
    }
}
