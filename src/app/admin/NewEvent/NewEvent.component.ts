import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-event',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './NewEvent.component.html',
  styleUrl: './NewEvent.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewEventComponent implements OnInit {
  currentStep = 1;
  totalSteps = 4;

  ngOnInit(): void {
    // Initialiser l'interface après le chargement de la vue
    setTimeout(() => this.setupEventListeners(), 0);
  }

  private setupEventListeners(): void {
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }
  }

  private nextStep(): void {
    // Masquer le contenu de l'étape actuelle
    const currentStepContent = document.getElementById(`step${this.currentStep}-content`);
    if (currentStepContent) {
      currentStepContent.classList.add('hidden');
    }
    
    // Passer à l'étape suivante (ou revenir à la première)
    this.currentStep = this.currentStep < this.totalSteps ? this.currentStep + 1 : 1;
    
    // Afficher le contenu de la nouvelle étape
    const newStepContent = document.getElementById(`step${this.currentStep}-content`);
    if (newStepContent) {
      newStepContent.classList.remove('hidden');
    }
    
    // Mettre à jour l'interface du stepper
    this.updateStepsUI();
    
    // Mettre à jour le texte du bouton à la dernière étape
    const nextButton = document.getElementById('nextBtn');
    if (nextButton) {
      if (this.currentStep === this.totalSteps) {
        nextButton.classList.add('hidden');
      } else {
        nextButton.classList.remove('hidden');
      }
    }
  }

  private updateStepsUI(): void {
    // Mettre à jour les étapes
    for (let i = 1; i <= this.totalSteps; i++) {
      const step = document.getElementById(`step${i}`);
      const badge = document.getElementById(`badge${i}`);
      
      if (step && badge) {
        if (i < this.currentStep) {
          // Étapes terminées
          step.classList.add('step-primary');
          badge.classList.add('badge-primary');
        } else if (i === this.currentStep) {
          // Étape actuelle
          step.classList.add('step-primary');
          badge.classList.add('badge-primary');
        } else {
          // Étapes futures
          step.classList.remove('step-primary');
          badge.classList.remove('badge-primary');
        }
      }
    }
  }
}
