import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-new-event',
  imports: [],
  templateUrl: './NewEvent.component.html',
  styleUrl: './NewEvent.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewEventComponent { }
