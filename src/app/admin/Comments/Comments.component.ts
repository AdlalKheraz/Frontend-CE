import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CommentService, Comment as ServiceComment } from '../../core/services/comment.service';
import { LoadingState } from '../../core/models/api.model';

interface Comment {
  id: string;
  userName: string;
  eventName: string;
  content: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  authorEmail: string;
  eventId: string;
}

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './Comments.component.html',
  styleUrl: './Comments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsComponent implements OnInit, OnDestroy {
  comments: Comment[] = [];
  filteredComments: Comment[] = [];
  loading = false;
  error: string | null = null;
  
  stats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    pendingTrend: 18,
    approvedTrend: -1
  };

  // Pagination
  currentPage = 1;
  itemsPerPage = 8;
  totalItems = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private commentService: CommentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
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
        this.loading = state.loading === LoadingState.LOADING;
        this.error = state.error || null;
        
        if (state.data) {
          this.comments = this.transformServiceComments(state.data);
          this.filteredComments = [...this.comments];
          this.totalItems = this.comments.length;
          this.updateStats();
        }
        
        this.cdr.markForCheck();
      });
  }

  private transformServiceComments(serviceComments: ServiceComment[]): Comment[] {
    return serviceComments.map(comment => ({
      id: comment.id || '',
      userName: this.extractUserName(comment.authorEmail),
      eventName: `Event ${comment.eventId}`, // À améliorer avec un service Event
      content: comment.content,
      date: this.formatDate(comment.createdAt),
      status: 'pending' as const, // Par défaut, à améliorer avec un champ status dans le service
      authorEmail: comment.authorEmail,
      eventId: comment.eventId
    }));
  }

  private extractUserName(email: string): string {
    return email.split('@')[0] || 'Utilisateur anonyme';
  }

  private formatDate(dateString?: string): string {
    if (!dateString) return new Date().toLocaleDateString();
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  private updateStats(): void {
    this.stats.pending = this.comments.filter(c => c.status === 'pending').length;
    this.stats.approved = this.comments.filter(c => c.status === 'approved').length;
    this.stats.rejected = this.comments.filter(c => c.status === 'rejected').length;
  }

  loadAllComments(): void {
    this.commentService.loadAllComments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Les données sont automatiquement mises à jour via l'observable
        },
        error: (error) => {
          console.error('Erreur lors du chargement des commentaires:', error);
        }
      });
  }

  // Méthodes liées aux actions des boutons
  approveComment(commentId: string): void {
    this.commentService.approveComment(commentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`Comment ${commentId} approved`);
          // Les données sont automatiquement mises à jour via l'observable
        },
        error: (error) => {
          console.error('Erreur lors de l\'approbation:', error);
        }
      });
  }

  rejectComment(commentId: string): void {
    this.commentService.rejectComment(commentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`Comment ${commentId} rejected`);
          // Les données sont automatiquement mises à jour via l'observable
        },
        error: (error) => {
          console.error('Erreur lors du rejet:', error);
        }
      });
  }

  deleteComment(commentId: string): void {
    this.commentService.deleteComment(commentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`Comment ${commentId} deleted`);
          // Les données sont automatiquement mises à jour via l'observable
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
        }
      });
  }

  showCommentDetails(commentId: string): void {
    const comment = this.comments.find(c => c.id === commentId);
    if (comment) {
      alert(`Détails du commentaire #${commentId}\n\nAuteur: ${comment.userName}\nEmail: ${comment.authorEmail}\nÉvénement: ${comment.eventName}\nContenu: ${comment.content}\nDate: ${comment.date}\nStatut: ${comment.status}`);
    }
  }

  // Méthodes de tri et recherche
  sortComments(criterion: string): void {
    console.log(`Sorting comments by ${criterion}`);
    switch (criterion) {
      case 'newest':
        this.filteredComments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'oldest':
        this.filteredComments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
    this.loadAllComments();
  }
}
