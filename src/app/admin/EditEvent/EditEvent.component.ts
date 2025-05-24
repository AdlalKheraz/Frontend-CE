import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, firstValueFrom, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Civilization, CivilizationService } from '../../core/services/civilization.service';
import { EventService, HistoricalEvent } from '../../core/services/event.service';
import { Media, MediaService } from '../../core/services/media.service';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar.component';

// Interface pour la mise à jour d'un événement (pour être sûr du format attendu par l'API)
interface EventUpdateDTO {
  title: string;
  description: string;
  date: string;
  civilizationId: string;
}

@Component({
  selector: 'app-edit-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminSidebarComponent],
  templateUrl: './EditEvent.component.html',
  styleUrl: './EditEvent.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditEventComponent implements OnInit {
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
  
  // Événement en cours d'édition
  eventId: string | null = null;
  currentEvent: HistoricalEvent | null = null;
  
  // Médias existants
  existingMedia: Media[] = [];
  
  // Médias à supprimer
  mediaToDelete: string[] = [];
  
  // Débogage
  showDebugInfo = false;
  
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private civilizationService = inject(CivilizationService);
  private eventService = inject(EventService);
  private mediaService = inject(MediaService);
  private http = inject(HttpClient);
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
    // Récupérer l'ID de l'événement depuis l'URL
    this.route.paramMap.pipe(
      switchMap(params => {
        this.eventId = params.get('id');
        if (!this.eventId) {
          this.errorMessage = "ID d'événement non trouvé dans l'URL";
          return [];
        }
        
        // Charger l'événement avec ses médias (enrichi)
        this.isLoading = true;
        console.log(`Chargement de l'événement enrichi avec ID: ${this.eventId}`);
        return this.eventService.loadEnrichedEventById(this.eventId);
      })
    ).subscribe({
      next: (event) => {
        if (event) {
          console.log('Événement enrichi chargé:', event);
          this.currentEvent = event;
          this.populateEventForm(event);
          
          // Mettre à jour l'UI après le chargement des données
          this.updateStepperUI();
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.errorMessage = "Erreur lors du chargement de l'événement: " + error.message;
        console.error("Erreur détaillée:", error);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
    
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

  // Remplir le formulaire avec les données de l'événement
  populateEventForm(event: HistoricalEvent): void {
    // Remplir le formulaire d'événement
    this.eventForm.patchValue({
      title: event.title || '',
      description: event.description || '',
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
    });
    
    // Sélectionner la civilisation
    if (event.civilizationId) {
      this.civilizationForm.patchValue({
        civilizationId: event.civilizationId,
        createNew: false
      });
    }
    
    // Charger les médias associés - séparer les médias uploadés des URLs externes
    if (event.medias && Array.isArray(event.medias)) {
      console.log('Médias de l\'événement:', event.medias);
      
      // Réinitialiser les médias existants
      this.existingMedia = [];
      
      // Vider le formArray existant pour éviter les doublons
      while (this.externalUrls.length) {
        this.externalUrls.removeAt(0);
      }
      
      // Traiter chaque média pour séparer les médias uploadés des URLs externes
      event.medias.forEach(media => {
        const isExternalUrl = media.url && (media.url.startsWith('http://') || media.url.startsWith('https://'));
        
        if (isExternalUrl) {
          // C'est une URL externe, l'ajouter au formulaire d'URLs externes
          const urlForm = this.fb.group({
            url: [media.url, [Validators.required, Validators.pattern('https?://.+')]],
            title: [media.title || ''],
            description: [media.description || ''],
            type: [media.type || 'IMAGE', Validators.required],
            id: [media.id || null] // Pour identifier les médias existants
          });
          this.externalUrls.push(urlForm);
        } else {
          // C'est un média uploadé, l'ajouter à la liste des médias existants
          this.existingMedia.push(media);
        }
      });
      
      console.log('Médias uploadés:', this.existingMedia);
      console.log('URLs externes:', this.externalUrls.value);
    } else {
      console.warn('Aucun média trouvé pour l\'événement');
      this.existingMedia = [];
    }
  }

  loadCivilizations(): void {
    this.isLoading = true;
    this.civilizationService.loadAllCivilizations()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (civilizations) => {
          this.civilizations = civilizations;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.errorMessage = 'Échec du chargement des civilisations: ' + error.message;
          this.cdr.markForCheck();
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
        type: ['IMAGE', Validators.required],
        id: [null] // null pour les nouveaux médias
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
  }
  
  // Submit the form pour mettre à jour l'événement existant
  async submitForm() {
    if (this.currentStep !== this.totalSteps) {
      this.nextStep();
      return;
    }
    
    if (!this.eventId) {
      this.errorMessage = "ID d'événement manquant, impossible de mettre à jour";
      return;
    }
    
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    try {
      // 1. Récupérer ou créer une civilisation
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
      
      // 2. Mettre à jour l'événement
      if (!civilizationId) {
        throw new Error('ID de civilisation manquant');
      }
      
      // Format exact selon Postman avec conversion explicite des types
      const updatedEvent: EventUpdateDTO = {
        title: String(this.eventForm.get('title')?.value || ''),
        description: String(this.eventForm.get('description')?.value || ''),
        date: this.formatDateForAPI(this.eventForm.get('date')?.value),
        civilizationId: String(civilizationId)
      };
      
      console.log('Updating event with data:', JSON.stringify(updatedEvent));
      
      try {
        // Envoi de la requête avec l'objet brut JSON plutôt qu'un cast
        const url = `${environment.baseUrl}/api/events/${this.eventId}`;
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        });
        
        // Utiliser directement HttpClient pour contrôler exactement ce qui est envoyé
        const eventResponse = await firstValueFrom(
          this.http.put<any>(url, updatedEvent, { headers })
        );
        
        console.log('Update event response:', eventResponse);
        
        // 3. Supprimer les médias marqués pour suppression
        if (this.mediaToDelete.length > 0) {
          console.log(`Suppression de ${this.mediaToDelete.length} médias:`, this.mediaToDelete);
          
          const deletePromises = this.mediaToDelete.map(async (mediaId) => {
            try {
              return await firstValueFrom(this.mediaService.deleteMedia(mediaId));
        } catch (error) {
              console.error(`Erreur lors de la suppression du média ${mediaId}:`, error);
          return null;
        }
      });
      
          const deleteResults = await Promise.all(deletePromises);
          const successfulDeletes = deleteResults.filter(result => result !== null).length;
          console.log(`${successfulDeletes}/${this.mediaToDelete.length} médias supprimés avec succès`);
        }
        
        // 4. Gérer les URLs externes
      const urlPromises = this.externalUrls.controls.map(async (urlControl, index) => {
        try {
            const mediaData = urlControl.value;
            
            // Créer l'objet média
          const media: Media = {
              url: mediaData.url,
              type: mediaData.type as 'IMAGE' | 'VIDEO',
              eventId: this.eventId!,
              title: mediaData.title || `Media externe ${index + 1}`,
              description: mediaData.description || ''
            };
            
            // Si l'ID existe, c'est une mise à jour
            if (mediaData.id) {
              media.id = mediaData.id;
            }
            
            // Utiliser la méthode addMedia pour les mises à jour et les nouvelles entrées
          return await firstValueFrom(this.mediaService.addMedia(media));
        } catch (error) {
            console.error(`Erreur lors de l'ajout/mise à jour de l'URL ${urlControl.value.url}:`, error);
          return null;
        }
      });
      
      const urlResults = await Promise.all(urlPromises);
      const successfulUrls = urlResults.filter(result => result !== null);
      
      // Message de succès avec détails
        let message = 'Événement mis à jour avec succès!';
        if (this.mediaToDelete.length > 0) {
          const successfulDeletes = this.mediaToDelete.length;
          message += ` ${successfulDeletes} médias supprimés.`;
      }
      if (this.externalUrls.length > 0) {
          message += ` ${successfulUrls.length}/${this.externalUrls.length} URLs ajoutées/mises à jour.`;
      }
      
      this.successMessage = message;
      
        // Rediriger vers la liste des événements après un court délai
      setTimeout(() => {
        this.router.navigate(['/admin/events']);
      }, 2000);
      } catch (updateError: any) {
        console.error('Erreur complète:', updateError);
        if (updateError.error && updateError.error.message) {
          throw new Error(`Erreur serveur: ${updateError.error.message}`);
        } else if (updateError.status === 500) {
          throw new Error('Erreur serveur 500: Vérifiez le format de la date ou des champs obligatoires');
        } else {
          throw updateError;
        }
      }
    } catch (error: any) {
      this.errorMessage = "Erreur lors de la mise à jour de l'événement: " + (error.message || 'Erreur inconnue');
      console.error("Détails de l'erreur:", error);
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  // Formater la date pour l'API (YYYY-MM-DD)
  private formatDateForAPI(dateValue: string | null | undefined): string {
    if (!dateValue) return '';
    
    try {
      // Vérifier si la date est déjà au bon format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }
      
      // Convertir en date et formater
      const date = new Date(dateValue);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      console.log(`Date convertie: ${dateValue} -> ${year}-${month}-${day}`);
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return dateValue; // Retourner la valeur originale en cas d'erreur
    }
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
  
  // Pour les médias existants (chargés depuis le serveur)
  getMediaUrl(media: Media): string {
    // Log pour debug
    console.log('Generating URL for media:', media);
    
    if (!media) return '';
    
    // Si c'est une URL externe complète (http ou https)
    if (media.url && (media.url.startsWith('http://') || media.url.startsWith('https://'))) {
      return media.url;
    } 
    // Si c'est un fichier uploadé (stocké sur le serveur)
    else if (media.url) {
      // Construire l'URL complète vers le fichier sur le serveur
      // Vérifions d'abord si l'URL contient déjà le chemin complet
      if (media.url.includes('/api/media/files/')) {
        return media.url;
      } else {
        // Sinon, utiliser le service pour construire l'URL complète
        const fullUrl = this.mediaService.getMediaFileUrl(media.url);
        console.log('Generated server URL:', fullUrl);
        return fullUrl;
      }
    }
    
    // Fallback
    return '';
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

  // Activer/désactiver les informations de débogage
  toggleDebugInfo(): void {
    this.showDebugInfo = !this.showDebugInfo;
  }

  // Marquer/démarquer un média pour suppression
  toggleMediaToDelete(mediaId: string | undefined): void {
    if (!mediaId) {
      console.warn('Tentative de suppression d\'un média sans ID');
      return;
    }
    
    const index = this.mediaToDelete.indexOf(mediaId);
    if (index > -1) {
      // Déjà dans la liste, le retirer (annuler la suppression)
      this.mediaToDelete.splice(index, 1);
    } else {
      // Pas encore dans la liste, l'ajouter pour suppression
      this.mediaToDelete.push(mediaId);
    }
    this.cdr.markForCheck();
  }
}
