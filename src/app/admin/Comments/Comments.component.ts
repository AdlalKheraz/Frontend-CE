import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-comments',
  imports: [],
  templateUrl: './Comments.component.html',
  styleUrl: './Comments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsComponent { }
