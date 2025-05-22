export const environment = {
    production: false,
    baseUrl: 'http://localhost:8080',
    ENDPOINT: {
        // Auth Service
        register: () => `${environment.baseUrl}/api/auth/register`,
        login: () => `${environment.baseUrl}/api/auth/login`,
        
        // User Management
        users: () => `${environment.baseUrl}/api/users`,
        userById: (id: string) => `${environment.baseUrl}/api/users/${id}`,
        updateUserRole: (id: string) => `${environment.baseUrl}/api/users/${id}/role`,
        
        // Civilization Management
        civilizations: () => `${environment.baseUrl}/api/civilizations`,
        civilizationById: (id: string) => `${environment.baseUrl}/api/civilizations/${id}`,
        
        
        // Events Management
        events: () => `${environment.baseUrl}/api/events`,
        eventById: (id: string) => `${environment.baseUrl}/api/events/${id}`,
        eventsByCivilization: (civilizationId: string) => 
        `${environment.baseUrl}/api/events/civilization/${civilizationId}`,
        
        // Comments Management
        comments: () => `${environment.baseUrl}/api/comments`,
        commentsByEvent: (eventId: string) => 
        `${environment.baseUrl}/api/comments/event/${eventId}`,
        
        // Media Management
        media: () => `${environment.baseUrl}/api/media`,
        mediaByEvent: (eventId: string) => 
        `${environment.baseUrl}/api/media/event/${eventId}`,
    }
};
