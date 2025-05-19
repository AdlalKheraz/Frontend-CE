import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './NewEvent.component.html',
  styleUrl: './NewEvent.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewEventComponent implements OnInit {
  currentStep = 1;
  totalSteps = 4;
  eventForm: FormGroup;
  
  constructor(private fb: FormBuilder, private router: Router) {
    this.eventForm = this.fb.group({
      // Définir les champs du formulaire avec validation
      title: ['', Validators.required],
      description: ['', Validators.required],
      location: [''],
      // Autres champs...
    });
  }

  ngOnInit(): void {
    // Initialisation
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }
  
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
  
  // Autres méthodes
}
