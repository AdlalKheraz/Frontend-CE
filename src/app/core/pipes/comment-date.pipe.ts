import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'commentDate',
  standalone: true
})
export class CommentDatePipe implements PipeTransform {
  transform(comment: any): string {
    if (!comment) return '';
    return comment.postedAt || comment.createdAt || '';
  }
} 