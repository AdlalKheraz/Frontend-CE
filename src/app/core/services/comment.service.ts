import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse, LoadingState, StateData } from '../models/api.model';

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
  
  comments$ = this.commentsState.asObservable();
  
  constructor(private http: HttpClient) {}

  loadCommentsByEvent(eventId: string): Observable<ApiResponse<Comment[]>> {
    this.commentsState.next({
      loading: LoadingState.LOADING,
      data: this.commentsState.value.data
    });
    
    return this.http.get<ApiResponse<Comment[]>>(
      environment.ENDPOINT.commentsByEvent(eventId)
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.commentsState.next({
            loading: LoadingState.LOADED,
            data: response.data
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

  createComment(comment: Comment): Observable<ApiResponse<Comment>> {
    return this.http.post<ApiResponse<Comment>>(
      environment.ENDPOINT.comments(),
      comment
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Ajouter le nouveau commentaire à la liste
          const currentData = this.commentsState.value.data || [];
          this.commentsState.next({
            loading: LoadingState.LOADED,
            data: [...currentData, response.data]
          });
        }
      }),
      catchError(error => throwError(() => error))
    );
  }
}