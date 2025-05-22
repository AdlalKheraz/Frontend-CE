import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { LoadingState, StateData } from '../models/api.model';

export interface Comment {
  id?: string;
  authorEmail: string;
  content: string;
  eventId: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private commentsState = new BehaviorSubject<StateData<Comment[]>>({
    loading: LoadingState.INIT,
    data: []
  });
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  comments$ = this.commentsState.asObservable();
  
  constructor(private http: HttpClient) {}

  loadCommentsByEvent(eventId: string): Observable<Comment[]> {
    this.commentsState.next({
      loading: LoadingState.LOADING,
      data: this.commentsState.value.data
    });
    
    return this.http.get<Comment[]>(
      environment.ENDPOINT.commentsByEvent(eventId),
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response) {
          this.commentsState.next({
            loading: LoadingState.LOADED,
            data: response
          });
        }
      }),
      catchError(error => {
        this.commentsState.next({
          loading: LoadingState.ERROR,
          data: [],
          error: error.message || 'Erreur lors du chargement des commentaires'
        });
        return throwError(() => error);
      })
    );
  }

  createComment(comment: Comment): Observable<Comment> {
    return this.http.post<Comment>(
      environment.ENDPOINT.comments(),
      comment,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response) {
          // Ajouter le nouveau commentaire à la liste
          const currentData = this.commentsState.value.data || [];
          this.commentsState.next({
            loading: LoadingState.LOADED,
            data: [...currentData, response]
          });
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  // Ajout d'une méthode pour rafraîchir les commentaires après un certain temps
  refreshComments(eventId: string): Observable<Comment[]> {
    return this.loadCommentsByEvent(eventId);
  }

  // Ajouter une méthode pour supprimer un commentaire (utile pour l'auteur du commentaire)
  deleteComment(commentId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.ENDPOINT.comments()}/${commentId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        // Supprimer le commentaire de l'état
        const currentData = this.commentsState.value.data || [];
        const updatedData = currentData.filter(comment => comment.id !== commentId);
        this.commentsState.next({
          loading: LoadingState.LOADED,
          data: updatedData
        });
      }),
      catchError(error => throwError(() => error))
    );
  }

  // Ajouter une méthode pour charger plus de commentaires (pagination)
  loadMoreComments(eventId: string, page: number, limit: number = 10): Observable<Comment[]> {
    const params = `?page=${page}&limit=${limit}`;
    
    return this.http.get<Comment[]>(
      `${environment.ENDPOINT.commentsByEvent(eventId)}${params}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response) {
          // Ajouter les nouveaux commentaires à la liste existante
          const currentData = this.commentsState.value.data || [];
          this.commentsState.next({
            loading: LoadingState.LOADED,
            data: [...currentData, ...response]
          });
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  // Réinitialiser l'état des commentaires (utile lors d'un changement d'événement)
  resetComments(): void {
    this.commentsState.next({
      loading: LoadingState.INIT,
      data: []
    });
  }

  // Obtenir le nombre de commentaires pour un événement
  getCommentCount(eventId: string): Observable<number> {
    return this.http.get<{count: number}>(
      `${environment.ENDPOINT.commentsByEvent(eventId)}/count`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.count),
      catchError(error => throwError(() => error))
    );
  }
}