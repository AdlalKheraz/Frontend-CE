import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse, LoadingState, PaginatedResponse, StateData } from '../models/api.model';

export interface Civilization {
  id?: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  region?: string;
  achievements?: string[];
  notableEvents?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CivilizationService {
  private civilizationsState = new BehaviorSubject<StateData<Civilization[]>>({
    loading: LoadingState.INIT,
    data: []
  });

  private selectedCivilizationState = new BehaviorSubject<StateData<Civilization | null>>({
    loading: LoadingState.INIT,
    data: null
  });
  
  civilizations$ = this.civilizationsState.asObservable();
  selectedCivilization$ = this.selectedCivilizationState.asObservable();

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  constructor(private http: HttpClient) {}

  loadAllCivilizations(): Observable<Civilization[]> {
    this.civilizationsState.next({
      loading: LoadingState.LOADING,
      data: this.civilizationsState.value.data
    });
    
    return this.http.get<Civilization[]>(
      environment.ENDPOINT.civilizations(),
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response) {
          this.civilizationsState.next({
            loading: LoadingState.LOADED,
            data: response
          });
        }
      }),
      catchError(error => {
        this.civilizationsState.next({
          loading: LoadingState.ERROR,
          data: [],
          error: error.message || 'Erreur lors du chargement des civilisations'
        });
        return throwError(() => error);
      })
    );
  }

  loadCivilizationById(id: string): Observable<Civilization> {
    this.selectedCivilizationState.next({
      loading: LoadingState.LOADING,
      data: this.selectedCivilizationState.value.data
    });
    
    return this.http.get<Civilization>(
      environment.ENDPOINT.civilizationById(id),
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response) {
          this.selectedCivilizationState.next({
            loading: LoadingState.LOADED,
            data: response
          });
        }
      }),
      catchError(error => {
        this.selectedCivilizationState.next({
          loading: LoadingState.ERROR,
          data: null,
          error: error.message || 'Erreur lors du chargement de la civilisation'
        });
        return throwError(() => error);
      })
    );
  }

  createCivilization(civilization: Civilization): Observable<any> {
    return this.http.post<any>(
      environment.ENDPOINT.civilizations(),
      civilization,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        // Recharger toutes les civilisations pour s'assurer d'avoir les données à jour
        this.loadAllCivilizations().subscribe();
      }),
      catchError(error => throwError(() => error))
    );
  }

  updateCivilization(id: string, civilization: Civilization): Observable<Civilization> {
    return this.http.put<Civilization>(
      environment.ENDPOINT.civilizationById(id),
      civilization,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response) {
          // Mettre à jour la civilisation dans la liste
          const currentData = this.civilizationsState.value.data || [];
          const updatedData = currentData.map(item => 
            item.id === id ? response! : item
          );
          
          this.civilizationsState.next({
            loading: LoadingState.LOADED,
            data: updatedData
          });
          
          // Mettre à jour la civilisation sélectionnée si elle est actuellement visualisée
          if (this.selectedCivilizationState.value.data?.id === id) {
            this.selectedCivilizationState.next({
              loading: LoadingState.LOADED,
              data: response
            });
          }
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  deleteCivilization(id: string): Observable<void> {
    return this.http.delete<void>(
      environment.ENDPOINT.civilizationById(id),
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        // Mettre à jour la liste des civilisations en supprimant l'élément
        const currentData = this.civilizationsState.value.data || [];
        this.civilizationsState.next({
          loading: LoadingState.LOADED,
          data: currentData.filter(item => item.id !== id)
        });
        
        // Si la civilisation supprimée était sélectionnée, réinitialiser
        if (this.selectedCivilizationState.value.data?.id === id) {
          this.selectedCivilizationState.next({
            loading: LoadingState.LOADED,
            data: null
          });
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  searchCivilizations(params: { 
    name?: string, 
    startPeriod?: number, 
    endPeriod?: number, 
    region?: string 
  }): Observable<Civilization[]> {
    this.civilizationsState.next({
      loading: LoadingState.LOADING,
      data: this.civilizationsState.value.data
    });
    
    // Créer les paramètres de recherche
    let httpParams = new HttpParams();
    if (params.name) httpParams = httpParams.set('name', params.name);
    if (params.startPeriod) httpParams = httpParams.set('startPeriod', params.startPeriod.toString());
    if (params.endPeriod) httpParams = httpParams.set('endPeriod', params.endPeriod.toString());
    if (params.region) httpParams = httpParams.set('region', params.region);
    
    return this.http.get<Civilization[]>(
      environment.ENDPOINT.civilizations(),
      { 
        headers: this.getHeaders(),
        params: httpParams
      }
    ).pipe(
      tap(response => {
        if (response) {
          this.civilizationsState.next({
            loading: LoadingState.LOADED,
            data: response
          });
        }
      }),
      catchError(error => {
        this.civilizationsState.next({
          loading: LoadingState.ERROR,
          data: [],
          error: error.message || 'Erreur lors de la recherche des civilisations'
        });
        return throwError(() => error);
      })
    );
  }

  // Méthode pour réinitialiser l'état
  resetCivilizations(): void {
    this.civilizationsState.next({
      loading: LoadingState.INIT,
      data: []
    });
  }

  resetSelectedCivilization(): void {
    this.selectedCivilizationState.next({
      loading: LoadingState.INIT,
      data: null
    });
  }
}