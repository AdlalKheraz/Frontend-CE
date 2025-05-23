import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse, LoadingState, StateData } from '../models/api.model';

export interface Media {
  id?: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  eventId: string;
  title?: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private mediaState = new BehaviorSubject<StateData<Media[]>>({
    loading: LoadingState.INIT,
    data: []
  });
  
  media$ = this.mediaState.asObservable();
  
  constructor(private http: HttpClient) {}

  loadMediaByEvent(eventId: string): Observable<ApiResponse<Media[]>> {
    this.mediaState.next({
      loading: LoadingState.LOADING,
      data: this.mediaState.value.data
    });
    
    return this.http.get<ApiResponse<Media[]>>(
      environment.ENDPOINT.mediaByEvent(eventId)
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.mediaState.next({
            loading: LoadingState.LOADED,
            data: response.data
          });
        }
      }),
      catchError(error => {
        this.mediaState.next({
          loading: LoadingState.ERROR,
          data: [],
          error: error.message || 'Erreur lors du chargement des médias'
        });
        return throwError(() => error);
      })
    );
  }

  addMedia(media: Media): Observable<ApiResponse<Media>> {
    return this.http.post<ApiResponse<Media>>(
      environment.ENDPOINT.media(),
      media
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Ajouter le nouveau média à la liste
          const currentData = this.mediaState.value.data || [];
          this.mediaState.next({
            loading: LoadingState.LOADED,
            data: [...currentData, response.data]
          });
        }
      }),
      catchError(error => throwError(() => error))
    );
  }
  
  uploadMedia(formData: FormData): Observable<ApiResponse<Media>> {
    return this.http.post<ApiResponse<Media>>(
      `${environment.baseUrl}/api/media/upload`,
      formData
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Ajouter le nouveau média à la liste
          const currentData = this.mediaState.value.data || [];
          this.mediaState.next({
            loading: LoadingState.LOADED,
            data: [...currentData, response.data]
          });
        }
      }),
      catchError(error => throwError(() => error))
    );
  }
}