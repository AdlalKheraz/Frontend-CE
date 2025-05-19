import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Event {
  id: number;
  name: string;
  description: string;
  location: string;
  creationDate: string;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './Events.component.html',
  styleUrl: './Events.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsComponent implements OnInit {
  // Liste des événements
  events: Event[] = [
    { id: 1, name: 'Jane Cooper', description: 'Mona Lisa', location: 'Mona lisa te99ers...', creationDate: '17 May 2025' },
    { id: 2, name: 'Floyd Miles', description: 'Hitler Vs Yacin', location: 'Hitler Itak wo71...', creationDate: '17 May 2025' },
    { id: 3, name: 'Ronald Richards', description: 'Kherrata 1945', location: 'Dirgazzen ro7en...', creationDate: '17 May 2025' },
    { id: 4, name: 'Marvin McKinney', description: 'Mona lisa', location: 'anda le point...', creationDate: '17 May 2025' },
    { id: 5, name: 'Jerome Bell', description: 'payment nature', location: 'cest geniole ce tru...', creationDate: '17 May 2025' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {}

  // Navigation vers le Dashboard
  navigateToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  // Navigation vers les paramètres
  navigateToSettings(): void {
    this.router.navigate(['/admin/settings']);
  }

  // Déconnexion
  signOut(): void {
    // Ajoutez ici la logique de déconnexion
    this.router.navigate(['/auth/login']);
  }

  // Créer un nouvel événement
  createNewEvent(): void {
    this.router.navigate(['/admin/new-event']);
  }

  // Modifier un événement
  modifyEvent(id: number): void {
    this.router.navigate(['/admin/edit-event', id]);
  }

  // Supprimer un événement
  deleteEvent(id: number): void {
    // Dans un cas réel, vous devriez appeler une API pour supprimer l'événement
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      this.events = this.events.filter(event => event.id !== id);
      // On devrait également rafraîchir la vue ici dans un cas réel
    }
  }

  // Afficher les détails d'un événement
  showEventDetails(id: number): void {
    this.router.navigate(['/admin/event-details', id]);
  }
}
