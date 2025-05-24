import { SearchParams } from '../../../shared/interfaces/search-params.interface';

export interface FilterState {
    activeFilters: SearchParams;
    lastResults: any[];
    loading: boolean;
    error: string | null;
    totalResults: number;
    currentPage: number;
}

export const initialFilterState: FilterState = {
    activeFilters: {
        eventTypes: {
            cultural: false,
            political: false,
            military: false,
            scientific: false
        },
        sortDirection: 'DESC',
        page: 1,
        size: 10
    },
    lastResults: [],
    loading: false,
    error: null,
    totalResults: 0,
    currentPage: 1
};