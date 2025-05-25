import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { LoadingState, StateData } from '../models/api.model';

export interface HistoricalEvent {
  imageUrl: string;
  medias: any;
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

  // Méthode privée pour créer les headers avec le token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  loadAllEvents(): Observable<HistoricalEvent[]> {
    this.eventsState.next({
      loading: LoadingState.LOADING,
      data: this.eventsState.value.data
    });
    
    return this.http.get<HistoricalEvent[]>(
      environment.ENDPOINT.events(),
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response) {
          this.eventsState.next({
            loading: LoadingState.LOADED,
            data: response
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

  loadEventById(id: string): Observable<HistoricalEvent> {
    this.selectedEventState.next({
      loading: LoadingState.LOADING,
      data: this.selectedEventState.value.data
    });
    
    return this.http.get<HistoricalEvent>(
      environment.ENDPOINT.eventById(id),
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response) {
          this.selectedEventState.next({
            loading: LoadingState.LOADED,
            data: response
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
  
  loadEnrichedEventById(eventId: string): Observable<HistoricalEvent> {
    this.selectedEventState.next({
      loading: LoadingState.LOADING,
      data: this.selectedEventState.value.data
    });
    
    return this.http.get<HistoricalEvent>(
      environment.ENDPOINT.eventsEnrichedById(eventId),
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response) {
          this.selectedEventState.next({
            loading: LoadingState.LOADED,
            data: response
          });
        }
      }),
      catchError(error => {
        this.selectedEventState.next({
          loading: LoadingState.ERROR,
          data: null,
          error: error.message || 'Erreur lors du chargement de l\'événement enrichi'
        });
        return throwError(() => error);
      })
    );
  }

  loadAllEnrichedEvents(): Observable<HistoricalEvent[]> {
    this.eventsState.next({
      loading: LoadingState.LOADING,
      data: this.eventsState.value.data
    });
    
    return this.http.get<HistoricalEvent[]>(
      environment.ENDPOINT.eventsEnriched(''),
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response) {
          this.eventsState.next({
            loading: LoadingState.LOADED,
            data: response
          });
        }
      }),
      catchError(error => {
        this.eventsState.next({
          loading: LoadingState.ERROR,
          data: [],
          error: error.message || 'Erreur lors du chargement des événements enrichis'
        });
        return throwError(() => error);
      })
    );
  }

  loadEventsByCivilization(civilizationId: string): Observable<HistoricalEvent[]> {
    this.eventsState.next({
      loading: LoadingState.LOADING,
      data: this.eventsState.value.data
    });
    
    return this.http.get<HistoricalEvent[]>(
      environment.ENDPOINT.eventsByCivilization(civilizationId),
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response) {
          this.eventsState.next({
            loading: LoadingState.LOADED,
            data: response
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

  loadEnrichedEventsByCivilization(civilizationId: string): Observable<HistoricalEvent[]> {
    this.eventsState.next({
      loading: LoadingState.LOADING,
      data: this.eventsState.value.data
    });
    
    return this.http.get<HistoricalEvent[]>(
      environment.ENDPOINT.eventsEnrichedByCivilization(civilizationId),
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response) {
          this.eventsState.next({
            loading: LoadingState.LOADED,
            data: response
          });
        }
      }),
      catchError(error => {
        this.eventsState.next({
          loading: LoadingState.ERROR,
          data: [],
          error: error.message || 'Erreur lors du chargement des événements enrichis par civilisation'
        });
        return throwError(() => error);
      })
    );
  }

  createEvent(event: HistoricalEvent): Observable<HistoricalEvent> {
    return this.http.post<HistoricalEvent>(
      environment.ENDPOINT.events(),
      event,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if ( response) {
          // Mettre à jour la liste des événements
          const currentData = this.eventsState.value.data || [];
          this.eventsState.next({
            loading: LoadingState.LOADED,
            data: [...currentData, response]
          });
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(
      environment.ENDPOINT.eventById(id),
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        // Mettre à jour la liste en supprimant l'événement
        const currentData = this.eventsState.value.data || [];
        const updatedData = currentData.filter(event => event.id !== id);
        this.eventsState.next({
          loading: LoadingState.LOADED,
          data: updatedData
        });
      }),
      catchError(error => throwError(() => error))
    );
  }

  updateEvent(id: string, event: HistoricalEvent): Observable<HistoricalEvent> {
    return this.http.put<HistoricalEvent>(
      environment.ENDPOINT.eventById(id),
      event,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response) {
          // Mettre à jour l'événement dans la liste
          const currentData = this.eventsState.value.data || [];
          const updatedData = currentData.map(e => e.id === id ? response : e);
          this.eventsState.next({
            loading: LoadingState.LOADED,
            data: updatedData
          });
        }
      }),
      catchError(error => throwError(() => error))
    );
  }
}