import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './Comments.component.html',
  styleUrl: './Comments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsComponent { 
  constructor(private router: Router) {}

  navigateToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  navigateToEvents(): void {
    this.router.navigate(['/admin/events']);
  }

  approveComment(commentId: number): void {
    console.log(`Comment ${commentId} approved`);
    // Implement approval logic here
  }

  rejectComment(commentId: number): void {
    console.log(`Comment ${commentId} rejected`);
    // Implement rejection logic here
  }

  showCommentDetails(commentId: number): void {
    console.log(`Showing details for comment ${commentId}`);
    // Implement showing details logic here
  }
}
