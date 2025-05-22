export interface SearchParams {
    event?: string;               // Titre/nom de l'événement
    startYear?: number;           // Année de début pour la période de recherche
    endYear?: number;             // Année de fin pour la période de recherche
    civilization?: string;        // Civilisation associée
    sortDirection?: 'ASC' | 'DESC'; // Direction de tri
    eventTypes?: {
        cultural: boolean;
        political: boolean;
        military: boolean;
        scientific: boolean;
    };
    page?: number;                // Pour la pagination
    size?: number;            // Taille de la page
}