import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse, LoadingState, PaginatedResponse, StateData } from '../models/api.model';

export interface Civilization {
  id?: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
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
  
  constructor(private http: HttpClient) {}

  loadAllCivilizations(): Observable<ApiResponse<Civilization[]>> {
    this.civilizationsState.next({
      loading: LoadingState.LOADING,
      data: this.civilizationsState.value.data
    });
    
    return this.http.get<ApiResponse<Civilization[]>>(
      environment.ENDPOINT.civilizations()
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.civilizationsState.next({
            loading: LoadingState.LOADED,
            data: response.data
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

  loadCivilizationById(id: string): Observable<ApiResponse<Civilization>> {
    this.selectedCivilizationState.next({
      loading: LoadingState.LOADING,
      data: this.selectedCivilizationState.value.data
    });
    
    return this.http.get<ApiResponse<Civilization>>(
      environment.ENDPOINT.civilizationById(id)
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.selectedCivilizationState.next({
            loading: LoadingState.LOADED,
            data: response.data
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

  createCivilization(civilization: Civilization): Observable<ApiResponse<Civilization>> {
    return this.http.post<ApiResponse<Civilization>>(
      environment.ENDPOINT.civilizations(),
      civilization
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Mettre à jour la liste des civilisations
          const currentData = this.civilizationsState.value.data || [];
          this.civilizationsState.next({
            loading: LoadingState.LOADED,
            data: [...currentData, response.data]
          });
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  updateCivilization(id: string, civilization: Civilization): Observable<ApiResponse<Civilization>> {
    return this.http.put<ApiResponse<Civilization>>(
      environment.ENDPOINT.civilizationById(id),
      civilization
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Mettre à jour la civilisation dans la liste
          const currentData = this.civilizationsState.value.data || [];
          const updatedData = currentData.map(item => 
            item.id === id ? response.data! : item
          );
          
          this.civilizationsState.next({
            loading: LoadingState.LOADED,
            data: updatedData
          });
          
          // Mettre à jour la civilisation sélectionnée si elle est actuellement visualisée
          if (this.selectedCivilizationState.value.data?.id === id) {
            this.selectedCivilizationState.next({
              loading: LoadingState.LOADED,
              data: response.data
            });
          }
        }
      }),
      catchError(error => throwError(() => error))
    );
  }
}