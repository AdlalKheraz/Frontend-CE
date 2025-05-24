export interface Civilization {
  id?: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  events?: any[];
  // Champs frontend uniquement (non envoyés au backend)
  region?: string;
  imageUrl?: string;
  achievements?: any[];
  notableEvents?: any[];
}

export interface CreateCivilizationDto {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface UpdateCivilizationDto extends Partial<CreateCivilizationDto> {}
