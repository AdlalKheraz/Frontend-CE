import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse, LoadingState, StateData } from '../models/api.model';

export interface HistoricalEvent {
  id?: string;
  title: string;
  description: string;
  date: string;
  civilizationId: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private eventsState = new BehaviorSubject<StateData<HistoricalEvent[]>>({
    loading: LoadingState.INIT,
    data: []
  });

  private selectedEventState = new BehaviorSubject<StateData<HistoricalEvent | null>>({
    loading: LoadingState.INIT,
    data: null
  });
  
  events$ = this.eventsState.asObservable();
  selectedEvent$ = this.selectedEventState.asObservable();
  
  constructor(private http: HttpClient) {}

  loadAllEvents(): Observable<ApiResponse<HistoricalEvent[]>> {
    this.eventsState.next({
      loading: LoadingState.LOADING,
      data: this.eventsState.value.data
    });
    
    return this.http.get<ApiResponse<HistoricalEvent[]>>(
      environment.ENDPOINT.events()
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.eventsState.next({
            loading: LoadingState.LOADED,
            data: response.data
          });
        }
      }),
      catchError(error => {
        this.eventsState.next({
          loading: LoadingState.ERROR,
          data: [],
          error: error.message || 'Erreur lors du chargement des événements'
        });
        return throwError(() => error);
      })
    );
  }

  loadEventById(id: string): Observable<ApiResponse<HistoricalEvent>> {
    this.selectedEventState.next({
      loading: LoadingState.LOADING,
      data: this.selectedEventState.value.data
    });
    
    return this.http.get<ApiResponse<HistoricalEvent>>(
      environment.ENDPOINT.eventById(id)
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.selectedEventState.next({
            loading: LoadingState.LOADED,
            data: response.data
          });
        }
      }),
      catchError(error => {
        this.selectedEventState.next({
          loading: LoadingState.ERROR,
          data: null,
          error: error.message || 'Erreur lors du chargement de l\'événement'
        });
        return throwError(() => error);
      })
    );
  }

  loadEventsByCivilization(civilizationId: string): Observable<ApiResponse<HistoricalEvent[]>> {
    this.eventsState.next({
      loading: LoadingState.LOADING,
      data: this.eventsState.value.data
    });
    
    return this.http.get<ApiResponse<HistoricalEvent[]>>(
      environment.ENDPOINT.eventsByCivilization(civilizationId)
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.eventsState.next({
            loading: LoadingState.LOADED,
            data: response.data
          });
        }
      }),
      catchError(error => {
        this.eventsState.next({
          loading: LoadingState.ERROR,
          data: [],
          error: error.message || 'Erreur lors du chargement des événements'
        });
        return throwError(() => error);
      })
    );
  }

  createEvent(event: HistoricalEvent): Observable<ApiResponse<HistoricalEvent>> {
    return this.http.post<ApiResponse<HistoricalEvent>>(
      environment.ENDPOINT.events(),
      event
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Mettre à jour la liste des événements
          const currentData = this.eventsState.value.data || [];
          this.eventsState.next({
            loading: LoadingState.LOADED,
            data: [...currentData, response.data]
          });
        }
      }),
      catchError(error => throwError(() => error))
    );
  }
}