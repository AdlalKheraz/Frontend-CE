import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { LoadingState } from '../../core/models/api.model';
import { CommentService, Comment as ServiceComment } from '../../core/services/comment.service';
import { EventService, HistoricalEvent } from '../../core/services/event.service';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar.component';

interface Comment {
  id: string;
  userName: string;
  eventName: string;
  content: string;
  date: string;
  rawDate: Date;
  authorEmail: string;
  eventId: string;
}

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminSidebarComponent],
  templateUrl: './Comments.component.html',
  styleUrl: './Comments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsComponent implements OnInit, OnDestroy {
  comments: Comment[] = [];
  filteredComments: Comment[] = [];
  loading = false;
  error: string | null = null;
  selectedComment: Comment | null = null;
  events: HistoricalEvent[] = [];
  
  // Suppression des stats de statut qui ne sont plus utilisées

  // Pagination
  currentPage = 1;
  itemsPerPage = 8;
  totalItems = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private commentService: CommentService,
    private eventService: EventService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Vérifier si l'utilisateur est authentifié
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No authentication token found');
      this.error = 'Vous devez être connecté pour accéder à cette page';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    
    this.loadAllComments();
    this.subscribeToCommentsState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToCommentsState(): void {
    this.commentService.comments$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        console.log('Comments state updated:', state);
        this.loading = state.loading === LoadingState.LOADING;
        this.error = state.error || null;
        
        if (state.data) {
          console.log('Transforming comments data:', state.data);
          this.comments = this.transformServiceComments(state.data);
          this.filteredComments = [...this.comments];
          this.totalItems = this.comments.length;
          this.updateStats();
        } else if (state.loading === LoadingState.LOADED) {
          // Si l'état est chargé mais sans données, afficher un message
          console.warn('No comments data received');
          this.error = 'Aucun commentaire trouvé';
          this.comments = [];
          this.filteredComments = [];
          this.totalItems = 0;
          this.updateStats();
        }
        
        this.cdr.markForCheck();
      });
  }

  private transformServiceComments(serviceComments: ServiceComment[]): Comment[] {
    if (!serviceComments || !Array.isArray(serviceComments)) {
      console.error('Invalid service comments:', serviceComments);
      return [];
    }
    
    return serviceComments.map(comment => {
      // Vérifier si l'objet comment est valide
      if (!comment || typeof comment !== 'object') {
        console.error('Invalid comment object:', comment);
        return null;
      }
      
      return {
      id: comment.id || '',
        userName: this.extractUserName(comment.authorEmail || 'anonymous@user.com'),
        eventName: this.getEventName(comment.eventId || 'unknown'),
        content: comment.content || 'No content',
      date: this.formatDate(comment.createdAt),
        rawDate: new Date(comment.createdAt || new Date()),
        authorEmail: comment.authorEmail || 'anonymous@user.com',
        eventId: comment.eventId || 'unknown'
      };
    }).filter(comment => comment !== null) as Comment[];
  }

  private extractUserName(email: string): string {
    if (!email) return 'Utilisateur anonyme';
    return email.includes('@') ? email.split('@')[0] : email;
  }

  private formatDate(dateString?: string): string {
    if (!dateString) return new Date().toLocaleDateString();
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  private getEventName(eventId: string): string {
    if (!eventId || eventId === 'unknown') return 'Événement inconnu';
    
    const event = this.events.find(e => e.id === eventId);
    return event ? event.title : `Événement ${eventId}`;
  }

  private updateStats(): void {
    // Cette méthode est conservée mais vidée car les stats de statut ne sont plus nécessaires
  }

  loadAllComments(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();
    
    // Charger les commentaires et les événements en parallèle
    forkJoin({
      comments: this.commentService.loadAllComments(),
      events: this.eventService.loadAllEvents()
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: { comments: ServiceComment[], events: HistoricalEvent[] }) => {
          console.log('Comments and events loaded:', result);
          this.events = result.events;
          // Les commentaires sont automatiquement mis à jour via l'observable
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des données:', error);
          this.loading = false;
          this.error = error.message || 'Erreur lors du chargement des données';
          this.cdr.markForCheck();
        }
      });
  }

  // Méthodes liées aux actions des boutons

  deleteComment(commentId: string): void {
    const comment = this.comments.find(c => c.id === commentId);
    if (comment && confirm(`Êtes-vous sûr de vouloir supprimer définitivement le commentaire de ${comment.userName} ?\n\nCette action est irréversible.`)) {
      this.commentService.deleteComment(commentId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log(`Comment ${commentId} deleted`);
            // Supprimer localement pour une réactivité immédiate
            this.comments = this.comments.filter(c => c.id !== commentId);
            this.filteredComments = this.filteredComments.filter(c => c.id !== commentId);
            this.totalItems = this.filteredComments.length;
            this.updateStats();
            
            // Ajuster la page courante si nécessaire
            if (this.paginatedComments.length === 0 && this.currentPage > 1) {
              this.currentPage--;
            }
            
            this.cdr.markForCheck();
            alert('Commentaire supprimé avec succès');
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression du commentaire');
          }
        });
    }
  }

  showCommentDetails(commentId: string): void {
    const comment = this.comments.find(c => c.id === commentId);
    if (comment) {
      this.selectedComment = comment;
      
      // Open the modal dialog
      const modal = document.getElementById('comment_modal') as HTMLDialogElement;
      if (modal) {
        modal.showModal();
      }
    }
  }
  
  closeModal(): void {
    const modal = document.getElementById('comment_modal') as HTMLDialogElement;
    if (modal) {
      modal.close();
    }
  }

  // Méthodes de tri et recherche
  sortComments(criterion: string): void {
    console.log(`Sorting comments by ${criterion}`);
    switch (criterion) {
      case 'newest':
        this.filteredComments.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
        break;
      case 'oldest':
        this.filteredComments.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
        break;
      case 'popular':
        // Logique de tri par popularité (par contenu le plus long pour l'exemple)
        this.filteredComments.sort((a, b) => b.content.length - a.content.length);
        break;
    }
    this.cdr.markForCheck();
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const term = target.value.toLowerCase();
    
    if (term) {
      this.filteredComments = this.comments.filter(c => 
        c.userName.toLowerCase().includes(term) || 
        c.content.toLowerCase().includes(term) ||
        c.eventName.toLowerCase().includes(term) ||
        c.authorEmail.toLowerCase().includes(term)
      );
    } else {
      this.filteredComments = [...this.comments];
    }
    
    this.totalItems = this.filteredComments.length;
    this.currentPage = 1; // Reset to first page
    this.cdr.markForCheck();
  }

  // Méthodes de pagination
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.markForCheck();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get paginatedComments(): Comment[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredComments.slice(startIndex, endIndex);
  }

  get paginationInfo(): string {
    const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    return `Showing data ${startItem} to ${endItem} of ${this.totalItems} entries`;
  }

  // Méthodes de navigation
  navigateToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  navigateToEvents(): void {
    this.router.navigate(['/admin/events']);
  }
  
  navigateToUsers(): void {
    this.router.navigate(['/admin/users']);
  }
  
  navigateToSettings(): void {
    this.router.navigate(['/admin/settings']);
  }
  
  signOut(): void {
    localStorage.removeItem('accessToken');
    this.router.navigate(['/login']);
  }

  refreshComments(): void {
    console.log('Refreshing comments...');
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();
    
    this.loadAllComments();
  }
}
