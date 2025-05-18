import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-side-bar',
  imports: [],
  templateUrl: './SideBar.component.html',
  styleUrl: './SideBar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideBarComponent { }
