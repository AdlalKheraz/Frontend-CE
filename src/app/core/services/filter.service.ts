import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SearchParams } from '../../shared/interfaces/search-params.interface';
import { FilterState, initialFilterState } from './models/filter.model';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private http = inject(HttpClient);
  
  // Sujet BehaviorSubject pour stocker et émettre l'état du filtre
  private filterState = new BehaviorSubject<FilterState>(initialFilterState);
  
  // Observable exposé aux composants
  public filterState$ = this.filterState.asObservable();

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  /**
   * Recherche des événements selon les critères fournis
   * @param params Paramètres de recherche
   */
  searchEvents(params: SearchParams): Observable<any> {
    // Mise à jour de l'état pour indiquer chargement en cours
    this.updateFilterState({
      ...this.filterState.value,
      activeFilters: params,
      loading: true,
      error: null
    });

    // Construction des paramètres de filtre pour l'API
    const apiParams = this.buildSearchParams(params);

    // Appel à l'API de recherche (utilise l'endpoint de recherche de Postman)
    return this.http.post(environment.ENDPOINT.searchEvents(), apiParams ,{ headers: this.getHeaders()}).pipe(
      tap((response: any) => {
        // Mise à jour avec les résultats
        this.updateFilterState({
          ...this.filterState.value,
          lastResults: response.content || response || [],
          totalResults: response.totalElements || response.length || 0,
          currentPage: response.number || 1,
          loading: false
        });
      }),
      catchError((error) => {
        this.updateFilterState({
          ...this.filterState.value,
          loading: false,
          error: error.message || 'Une erreur est survenue lors de la recherche'
        });
        throw error;
      })
    );
  }

  /**
   * Charge la page suivante des résultats avec les mêmes filtres
   */
  loadNextPage(): Observable<any> {
    const currentState = this.filterState.value;
    const nextPage = currentState.currentPage + 1;
    
    const updatedParams = {
      ...currentState.activeFilters,
      page: nextPage
    };
    
    return this.searchEvents(updatedParams);
  }

  /**
   * Réinitialise les filtres aux valeurs par défaut
   */
  resetFilters(): void {
    this.updateFilterState({
      ...initialFilterState,
      lastResults: [],
      totalResults: 0
    });
  }

  /**
   * Applique un filtre par civilisation
   * @param civilizationId Identifiant ou nom de la civilisation
   */
  filterByCivilization(civilizationId: string): Observable<any> {
    if (!civilizationId || civilizationId === 'Toutes') {
      // Si "Toutes" est sélectionné, on retire le filtre de civilisation
      const { civilization, ...otherFilters } = this.filterState.value.activeFilters;
      return this.searchEvents({
        ...otherFilters,
        page: 1 // Retour à la première page
      });
    } else {
      return this.searchEvents({
        ...this.filterState.value.activeFilters,
        civilization: civilizationId,
        page: 1 // Retour à la première page
      });
    }
  }

  /**
   * Met à jour l'état du filtre
   */
  private updateFilterState(newState: FilterState): void {
    this.filterState.next(newState);
  }

  /**
   * Construit les paramètres de recherche pour l'API selon le format attendu
   */
  private buildSearchParams(params: SearchParams): any {
    // Construction d'un objet correspondant au format exact attendu par l'API
    const apiParams: any = {
      page: params.page || 0,            // API attend page à partir de 0
      size: params.size || 10,
      sortBy: "date",                    // Valeur par défaut
      sortDirection: params.sortDirection || 'DESC'
    };

    // Ajout des filtres conditionnels selon le format exact du prompt
    if (params.event) {
      apiParams.title = params.event;
    }

    if (params.startYear) {
      apiParams.dateFrom = this.formatYearToAPIDate(params.startYear);
    }

    if (params.endYear) {
      apiParams.dateTo = this.formatYearToAPIDate(params.endYear);
    }

    // Conversion du civilizationId en nombre si nécessaire
    if (params.civilization && params.civilization !== 'Toutes') {
      try {
        // Si l'ID est un nombre, on le convertit
        apiParams.civilizationId = Number(params.civilization);
      } catch (e) {
        // Sinon on garde la valeur telle quelle
        apiParams.civilizationId = params.civilization;
      }
    }

    // Gestion des types d'événements - n'envoyer qu'un seul type
    if (params.eventTypes) {
      if (params.eventTypes.cultural) {
        apiParams.type = "CULTURAL";
      } else if (params.eventTypes.political) {
        apiParams.type = "POLITICAL";
      } else if (params.eventTypes.military) {
        apiParams.type = "MILITARY";
      } else if (params.eventTypes.scientific) {
        apiParams.type = "SCIENTIFIC";
      }
    }

    return apiParams;
  }

  /**
   * Convertit une année en format de date pour l'API
   */
  private formatYearToAPIDate(year: number): string {
    // Format attendu par l'API: YYYY-MM-DD
    const formattedYear = Math.abs(year).toString().padStart(4, '0');
    // Gérer les années négatives (avant JC) et positives
    return year < 0 
      ? `-${formattedYear}-01-01` 
      : `${formattedYear}-01-01`;
  }
}