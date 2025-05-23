import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CivilizationService, Civilization } from '../../core/services/civilization.service';
import { ApiResponse } from '../../core/models/api.model';
import { EventService, HistoricalEvent } from '../../core/services/event.service';
import { MediaService, Media } from '../../core/services/media.service';
import { Observable, finalize, firstValueFrom, tap } from 'rxjs';

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
  civilizationForm: FormGroup;
  mediaForm: FormGroup;
  
  civilizations: Civilization[] = [];
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  createdEventId: string | undefined;
  
  // File upload
  selectedFiles: File[] = [];
  
  private civilizationService = inject(CivilizationService);
  private eventService = inject(EventService);
  private mediaService = inject(MediaService);
  
  constructor(private fb: FormBuilder, private router: Router) {
    // Event form
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      date: ['', Validators.required]
    });
    
    // Civilization form
    this.civilizationForm = this.fb.group({
      civilizationId: ['', Validators.required],
      createNew: [false],
      newCivilization: this.fb.group({
        name: [''],
        description: [''],
        startDate: [''],
        endDate: ['']
      })
    });
    
    // Media form
    this.mediaForm = this.fb.group({
      mediaItems: this.fb.array([]),
      externalUrls: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadCivilizations();
    
    // Enable/disable validation for new civilization based on createNew checkbox
    this.civilizationForm.get('createNew')?.valueChanges.subscribe(createNew => {
      const newCivGroup = this.civilizationForm.get('newCivilization') as FormGroup;
      
      if (createNew) {
        newCivGroup.get('name')?.setValidators([Validators.required]);
        newCivGroup.get('description')?.setValidators([Validators.required]);
        this.civilizationForm.get('civilizationId')?.clearValidators();
      } else {
        newCivGroup.get('name')?.clearValidators();
        newCivGroup.get('description')?.clearValidators();
        this.civilizationForm.get('civilizationId')?.setValidators([Validators.required]);
      }
      
      newCivGroup.get('name')?.updateValueAndValidity();
      newCivGroup.get('description')?.updateValueAndValidity();
      this.civilizationForm.get('civilizationId')?.updateValueAndValidity();
    });
  }

  loadCivilizations(): void {
    this.isLoading = true;
    this.civilizationService.loadAllCivilizations()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (civilizations) => {
          this.civilizations = civilizations;
        },
        error: (error) => {
          this.errorMessage = 'Échec du chargement des civilisations: ' + error.message;
        }
      });
  }

  // Form array getters
  get mediaItems() {
    return this.mediaForm.get('mediaItems') as FormArray;
  }
  
  get externalUrls() {
    return this.mediaForm.get('externalUrls') as FormArray;
  }
  
  // Add external URL form
  addExternalUrl() {
    this.externalUrls.push(
      this.fb.group({
        url: ['', [Validators.required, Validators.pattern('https?://.+')]],
        title: [''],
        description: [''],
        type: ['IMAGE', Validators.required]
      })
    );
  }
  
  // Remove external URL form
  removeExternalUrl(index: number) {
    this.externalUrls.removeAt(index);
  }
  
  // Handle file selection
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      for (let i = 0; i < input.files.length; i++) {
        this.selectedFiles.push(input.files[i]);
      }
    }
  }
  
  // Remove selected file
  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }
  
  // Récupérer le nom de la civilisation sélectionnée
  getSelectedCivilizationName(): string {
    const civilizationId = this.civilizationForm.get('civilizationId')?.value;
    if (!civilizationId) {
      return 'Aucune sélectionnée';
    }
    
    const selectedCivilization = this.civilizations.find(c => c.id === civilizationId);
    return selectedCivilization?.name || 'Aucune sélectionnée';
  }

  handleButtonClick(): void {
    if (this.currentStep === this.totalSteps) {
      this.submitForm();
    } else {
      this.nextStep();
    }
  }

  nextStep(): void {
    if (this.currentStep === 1 && !this.eventForm.valid) {
      this.markFormGroupTouched(this.eventForm);
      return;
    }
    
    if (this.currentStep === 2 && !this.civilizationForm.valid) {
      this.markFormGroupTouched(this.civilizationForm);
      return;
    }
    
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateStepperUI();
    }
  }
  
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepperUI();
    }
  }
  
  // Mark all form controls as touched to trigger validation
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  
  // Update stepper UI
  updateStepperUI() {
    // Hide all step content
    for (let i = 1; i <= this.totalSteps; i++) {
      const stepContent = document.getElementById(`step${i}-content`);
      
      // Sélectionner les éléments du stepper - noter que le premier n'a pas d'ID
      let step: Element | null;
      if (i === 1) {
        // Pour l'étape 1, on sélectionne le premier élément li.step
        const steps = document.querySelectorAll('ul.steps li.step');
        if (steps.length > 0) {
          step = steps[0];
        } else {
          step = null;
        }
      } else {
        step = document.getElementById(`step${i}`);
      }
      
      // Afficher/masquer le contenu de l'étape
      if (stepContent) {
        if (i === this.currentStep) {
          stepContent.classList.remove('hidden');
        } else {
          stepContent.classList.add('hidden');
        }
      }
      
      // Mettre à jour l'apparence du stepper
      if (step) {
        if (i <= this.currentStep) {
          step.classList.add('step-primary');
        } else {
          step.classList.remove('step-primary');
        }
      }
    }
    
    // Le texte du bouton est géré par Angular dans le HTML avec *ngIf
  }
  
  // Submit the form
  async submitForm() {
    if (this.currentStep !== this.totalSteps) {
      this.nextStep();
      return;
    }
    
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    try {
      // 1. Create or select civilization
      let civilizationId: string = '';
      
      if (this.civilizationForm.get('createNew')?.value) {
        const newCivData = this.civilizationForm.get('newCivilization')?.value;
        if (!newCivData) {
          throw new Error('Données de civilisation manquantes');
        }
        
        const newCivilization: Civilization = {
          name: newCivData.name,
          description: newCivData.description,
          startDate: newCivData.startDate || null,
          endDate: newCivData.endDate || null
        };
        
        const civResponse = await firstValueFrom(this.civilizationService.createCivilization(newCivilization));
        if (civResponse?.success && civResponse.data) {
          civilizationId = civResponse.data.id || '';
        } else {
          throw new Error('Échec de la création de la civilisation');
        }
      } else {
        const selectedCivId = this.civilizationForm.get('civilizationId')?.value;
        if (!selectedCivId) {
          throw new Error('Veuillez sélectionner une civilisation');
        }
        civilizationId = selectedCivId;
      }
      
      // 2. Create event
      if (!civilizationId) {
        throw new Error('ID de civilisation manquant');
      }
      
      const event = {
        ...this.eventForm.value,
        civilizationId
      };
      
      const eventResponse = await firstValueFrom(this.eventService.createEvent(event));
      if (!eventResponse || !eventResponse.id) {
        throw new Error('Échec de la création de l\'événement');
      }
      
      const eventId = eventResponse.id as string;
      
      // 3. Upload files
      for (const file of this.selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('eventId', eventId);
        formData.append('type', file.type.includes('image') ? 'IMAGE' : 'VIDEO');
        
        await firstValueFrom(this.mediaService.uploadMedia(formData));
      }
      
      // 4. Add external URLs
      for (const urlControl of this.externalUrls.controls) {
        const media = {
          ...urlControl.value,
          eventId
        };
        
        await firstValueFrom(this.mediaService.addMedia(media));
      }
      this.successMessage = 'Événement créé avec succès!';
      setTimeout(() => {
        this.router.navigate(['/admin/events']);
      }, 2000);
      
    } catch (error: any) {
      this.errorMessage = 'Erreur lors de la création de l\'événement: ' + (error.message || 'Erreur inconnue');
    } finally {
      this.isSubmitting = false;
    }
  }
}
