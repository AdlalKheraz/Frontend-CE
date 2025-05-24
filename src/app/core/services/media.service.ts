import { Injectable } from '@angular/core';
import { HttpClient, HttpResponseBase } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, firstValueFrom, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import {  LoadingState, StateData } from '../models/api.model';

export interface Media {
  id?: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  eventId?: string; // Rendre optionnel pour la création
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

  loadMediaByEvent(eventId: string): Observable<Media[]> {
    this.mediaState.next({
      loading: LoadingState.LOADING,
      data: this.mediaState.value.data
    });
    
    return this.http.get<Media[]>(
      environment.ENDPOINT.mediaByEvent(eventId)
    ).pipe(
      tap(response => {
        if (response) {
          this.mediaState.next({
            loading: LoadingState.LOADED,
            data: response
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

  loadAllMedia(): Observable<Media[]> {
    this.mediaState.next({
      loading: LoadingState.LOADING,
      data: this.mediaState.value.data
    });
    
    return this.http.get<Media[]>(
      environment.ENDPOINT.media()
    ).pipe(
      tap(response => {
        if (response) {
          this.mediaState.next({
            loading: LoadingState.LOADED,
            data: response
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

  addMedia(media: Media): Observable<Media> {
    return this.http.post<Media>(
      environment.ENDPOINT.media(),
      media
    ).pipe(
      tap(response => {
        if (response) {
          // Ajouter le nouveau média à la liste
          const currentData = this.mediaState.value.data || [];
          this.mediaState.next({
            loading: LoadingState.LOADED,
            data: [...currentData, response]
          });
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  getMediaFileUrl(filename: string): string {
    return environment.ENDPOINT.mediaFiles(filename);
  }

  uploadMedia(formData: FormData): Observable<Media> {
    return this.http.post<Media>(
      environment.ENDPOINT.mediaUpload(),
      formData,
      {
        reportProgress: true, // Pour pouvoir suivre le progrès si nécessaire
      }
    ).pipe(
      tap(response => {
        if (response) {
          const currentData = this.mediaState.value.data || [];
          this.mediaState.next({
            loading: LoadingState.LOADED,
            data: [...currentData, response]
          });
        }
      }),
      catchError(error => {
        console.error('Erreur lors de l\'upload:', error);
        return throwError(() => error);
      })
    );
  }

  // Nouvelle méthode pour uploader plusieurs fichiers
  uploadMultipleMedia(files: File[], eventId: string): Observable<Media[]> {
    const uploads = files.map(file => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('eventId', eventId);
      formData.append('type', file.type.includes('image') ? 'IMAGE' : 'VIDEO');
      formData.append('title', file.name.split('.')[0]);
      
      return this.uploadMedia(formData);
    });
    
    // Retourner un Observable qui émet quand tous les uploads sont terminés
    return new Observable(observer => {
      Promise.all(uploads.map(upload => firstValueFrom(upload)))
        .then(results => {
          observer.next(results);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }
}