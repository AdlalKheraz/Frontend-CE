import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Comment {
  id: number;
  userName: string;
  eventName: string;
  content: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './Comments.component.html',
  styleUrl: './Comments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsComponent implements OnInit {
  comments: Comment[] = [];
  stats = {
    pending: 5423,
    approved: 1893,
    rejected: 189,
    pendingTrend: 18,
    approvedTrend: -1
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Simuler des données de commentaires pour l'exemple
    this.loadComments();
  }

  loadComments(): void {
    this.comments = [
      { id: 1, userName: 'Jane Cooper', eventName: 'Mona Lisa', content: 'Mona lisa te99ers...', date: '17 May 2025', status: 'pending' },
      { id: 2, userName: 'Floyd Miles', eventName: 'Hitler Vs Yacin', content: 'Hitler itak w07t...', date: '17 May 2025', status: 'pending' },
      { id: 3, userName: 'Ronald Richards', eventName: 'Kherrata 1945', content: 'Dirgazzen ro7en...', date: '17 May 2025', status: 'pending' },
      { id: 4, userName: 'Marvin McKinney', eventName: 'Mona lisa', content: 'anda le point...', date: '17 May 2025', status: 'pending' },
      { id: 5, userName: 'Jerome Bell', eventName: 'payment nature', content: 'cest geniale ce tru...', date: '17 May 2025', status: 'pending' },
      { id: 6, userName: 'Kathryn Murphy', eventName: 'payment nature', content: 'jaime bien...', date: '17 May 2025', status: 'pending' },
      { id: 7, userName: 'Jacob Jones', eventName: 'payment nature', content: 'Je recommande...', date: '17 May 2025', status: 'pending' },
      { id: 8, userName: 'Kristin Watson', eventName: 'payment nature', content: 'a oui tres satisf...', date: '17 May 2025', status: 'pending' }
    ];
  }

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
    console.log('User signed out');
    this.router.navigate(['/login']);
  }

  approveComment(commentId: number): void {
    console.log(`Comment ${commentId} approved`);
    const comment = this.comments.find(c => c.id === commentId);
    if (comment) {
      comment.status = 'approved';
      // Mise à jour des statistiques
      this.stats.pending--;
      this.stats.approved++;
    }
  }

  rejectComment(commentId: number): void {
    console.log(`Comment ${commentId} rejected`);
    const comment = this.comments.find(c => c.id === commentId);
    if (comment) {
      comment.status = 'rejected';
      // Mise à jour des statistiques
      this.stats.pending--;
      this.stats.rejected++;
    }
  }

  showCommentDetails(commentId: number): void {
    console.log(`Showing details for comment ${commentId}`);
    // Ouvrir une modal ou naviguer vers une page de détails
    alert(`Détails du commentaire #${commentId}`);
  }
  
  sortComments(criterion: string): void {
    console.log(`Sorting comments by ${criterion}`);
    switch (criterion) {
      case 'newest':
        // Logique de tri par date (du plus récent au plus ancien)
        break;
      case 'oldest':
        // Logique de tri par date (du plus ancien au plus récent)
        break;
      case 'popular':
        // Logique de tri par popularité
        break;
    }
  }
  
  searchComments(term: string): void {
    console.log(`Searching for: ${term}`);
    if (term) {
      // Implémenter la logique de recherche
      // this.comments = this.allComments.filter(c => 
      //   c.userName.toLowerCase().includes(term.toLowerCase()) || 
      //   c.content.toLowerCase().includes(term.toLowerCase())
      // );
    } else {
      // Réinitialiser à la liste complète
      this.loadComments();
    }
  }
  
  changePage(page: number): void {
    console.log(`Navigating to page ${page}`);
    // Implémentation de la pagination
  }
}
