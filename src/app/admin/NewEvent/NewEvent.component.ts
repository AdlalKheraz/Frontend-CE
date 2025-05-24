import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { finalize, firstValueFrom } from 'rxjs';
import { Civilization, CivilizationService } from '../../core/services/civilization.service';
import { EventService } from '../../core/services/event.service';
import { Media, MediaService } from '../../core/services/media.service';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-new-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminSidebarComponent],
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
  
  private civilizationService = inject(CivilizationService);
  private eventService = inject(EventService);
  private mediaService = inject(MediaService);
  private sanitizer = inject(DomSanitizer);
  
  constructor(private fb: FormBuilder, public router: Router) {
    // Event form
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      date: ['', Validators.required],
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
  
  // Récupérer le nom de la civilisation sélectionnée
  getSelectedCivilizationName(): string {
    const civilizationId = this.civilizationForm.get('civilizationId')?.value;
    if (!civilizationId) {
      return 'Aucune sélectionnée';
    }
    
    const selectedCivilization = this.civilizations.find(c => c.id === civilizationId);
    return selectedCivilization?.name || 'Aucune sélectionnée';
  }

  // Gérer les erreurs d'affichage d'images
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/placeholder-image.png'; // Remplacer par une image par défaut
    imgElement.alt = 'Image non disponible';
    imgElement.classList.add('opacity-50');
  }
  
  // Gérer les erreurs d'affichage de vidéos
  handleVideoError(event: Event): void {
    const videoElement = event.target as HTMLVideoElement;
    const videoUrl = videoElement.src;
    console.error(`Erreur de chargement de vidéo: ${videoUrl}`);
    
    // Masquer la vidéo
    videoElement.style.display = 'none';
    
    // Trouver le parent pour ajouter le message d'erreur
    const parentElement = videoElement.parentElement;
    if (!parentElement) return;
    
    // Créer et afficher un message d'erreur s'il n'existe pas déjà
    if (!parentElement.querySelector('.video-error-message')) {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'video-error-message absolute inset-0 flex items-center justify-center bg-red-50 text-red-500 text-sm';
      errorMsg.textContent = 'Vidéo non disponible';
      parentElement.appendChild(errorMsg);
    }
  }

  // Vérifier si une URL est une URL YouTube
  isYouTubeUrl(url: string): boolean {
    if (!url) return false;
    
    // Différents formats d'URL YouTube
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  }
  
  // Obtenir une URL sécurisée pour l'iframe YouTube
  getSafeYoutubeUrl(url: string): SafeResourceUrl {
    if (!url) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    
    // Transformer l'URL YouTube en URL embed
    let embedUrl = url;
    
    // Format youtu.be
    if (url.includes('youtu.be')) {
      const videoId = url.split('/').pop();
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } 
    // Format youtube.com/watch
    else if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    // Format youtube.com/embed - déjà au bon format
    else if (!url.includes('youtube.com/embed')) {
      console.warn('Format d\'URL YouTube non reconnu:', url);
    }
    
    console.log('URL YouTube transformée:', embedUrl);
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
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
  
  // Submit the form avec gestion des médias améliorée
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
      this.createdEventId = eventId;
      
      // 3. Add external URLs avec gestion d'erreurs individuelle
      const urlPromises = this.externalUrls.controls.map(async (urlControl, index) => {
        try {
          const media: Media = {
            url: urlControl.value.url,
            type: urlControl.value.type,
            eventId: eventId,
            title: urlControl.value.title || `Media externe ${index + 1}`,
            description: urlControl.value.description || ''
          };
          
          return await firstValueFrom(this.mediaService.addMedia(media));
        } catch (error) {
          console.error(`Erreur lors de l'ajout de l'URL ${urlControl.value.url}:`, error);
          return null;
        }
      });
      
      const urlResults = await Promise.all(urlPromises);
      const successfulUrls = urlResults.filter(result => result !== null);
      
      // Message de succès avec détails
      let message = 'Événement créé avec succès!';
      if (this.externalUrls.length > 0) {
        message += ` ${successfulUrls.length}/${this.externalUrls.length} URLs ajoutées.`;
      }
      
      this.successMessage = message;
      
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
