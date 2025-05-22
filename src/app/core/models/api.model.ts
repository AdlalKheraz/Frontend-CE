export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

export enum LoadingState {
  INIT = 'INIT',
  LOADING = 'LOADING',
  LOADED = 'LOADED',
  ERROR = 'ERROR'
}

export interface StateData<T> {
  loading: LoadingState;
  data?: T;
  error?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  emailNotifications: boolean;
  preferredCivilizations?: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  fullName?: string;
  bio?: string;
  dateJoined: Date;
  favorites?: string[];
  preferences: UserPreferences;
}