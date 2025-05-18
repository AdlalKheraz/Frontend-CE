import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-home',
    imports: [],
    templateUrl: './Home.component.html',
    styleUrl: './Home.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
    constructor(private router: Router){}
    goToDashboard() {
		this.router.navigate(['/dashboard']);
	}
}
