import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-dashboard',
    imports: [RouterModule],
    templateUrl: './Dashboard.component.html',
    styleUrl: './Dashboard.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent { }
