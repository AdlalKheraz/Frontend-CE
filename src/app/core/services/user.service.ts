import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface UserProfile {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  avatar?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api'; // URL de base de l'API

  constructor() {}

  /**
   * Récupérer tous les utilisateurs (Admin uniquement)
   */
  getAllUsers(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${this.apiUrl}/users`);
  }

  /**
   * Récupérer un utilisateur par son ID
   */
  getUserById(userId: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/users/${userId}`);
  }

  /**
   * Mettre à jour le profil d'un utilisateur
   */
  updateUserProfile(userId: string, userData: UpdateUserRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/users/${userId}`, userData);
  }

  /**
   * Changer le rôle d'un utilisateur (Admin uniquement)
   */
  changeUserRole(userId: string, role: string): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/users/${userId}/role`, { role });
  }

  /**
   * Supprimer un compte utilisateur
   */
  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`);
  }

  /**
   * Obtenir les en-têtes d'autorisation avec le token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
} 