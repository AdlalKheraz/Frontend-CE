import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-users',
  imports: [],
  templateUrl: './Users.component.html',
  styleUrl: './Users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent { }
