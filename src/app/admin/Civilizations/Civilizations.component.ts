import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { CivilizationService, Civilization } from '../../core/services/civilization.service';
import { LoadingState, StateData } from '../../core/models/api.model';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-civilizations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AdminSidebarComponent
  ],
  templateUrl: './Civilizations.component.html',
  styleUrls: ['./Civilizations.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CivilizationsComponent implements OnInit, OnDestroy {
  private civilizationService = inject(CivilizationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // State observables
  civilizationsState$ = this.civilizationService.civilizations$;

  // UI state
  showModal = false;
  showDeleteConfirmation = false;
  showViewModal = false;
  editMode = false;
  isSubmitting = false;

  // Form and data
  civilizationForm!: FormGroup;
  civilizationToDelete: Civilization | null = null;
  selectedCivilization: Civilization | null = null;

  // Search parameters
  searchParams = {
    name: '',
    region: '',
    startPeriod: null as number | null,
    endPeriod: null as number | null
  };

  ngOnInit(): void {
    this.initForm();
    this.loadCivilizations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.civilizationForm = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      description: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      region: [''],
      imageUrl: [''],
      achievements: [[]],
      notableEvents: [[]]
    });
  }

  loadCivilizations(): void {
    this.civilizationService.loadAllCivilizations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Error loading civilizations:', err)
      });
  }

  searchCivilizations(): void {
    // Filter out null values
    const params: any = {};
    if (this.searchParams.name) params.name = this.searchParams.name;
    if (this.searchParams.region) params.region = this.searchParams.region;
    if (this.searchParams.startPeriod) params.startPeriod = this.searchParams.startPeriod;
    if (this.searchParams.endPeriod) params.endPeriod = this.searchParams.endPeriod;

    this.civilizationService.searchCivilizations(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Error searching civilizations:', err)
      });
  }

  openAddCivilizationModal(): void {
    this.editMode = false;
    this.civilizationForm.reset({
      achievements: [],
      notableEvents: []
    });
    this.showModal = true;
  }

  viewCivilization(civilization: Civilization): void {
    this.selectedCivilization = civilization;
    this.showViewModal = true;
  }

  editCivilization(civilization: Civilization | null): void {
    if (!civilization) return;

    this.editMode = true;
    this.civilizationForm.patchValue({
      id: civilization.id,
      name: civilization.name,
      description: civilization.description,
      startDate: this.formatDateForInput(civilization.startDate),
      endDate: this.formatDateForInput(civilization.endDate),
      region: civilization.region,
      imageUrl: civilization.imageUrl,
      achievements: civilization.achievements || [],
      notableEvents: civilization.notableEvents || []
    });

    this.showModal = true;
    this.showViewModal = false; // Close view modal if open
  }

  deleteCivilization(civilization: Civilization): void {
    this.civilizationToDelete = civilization;
    this.showDeleteConfirmation = true;
  }

  confirmDelete(): void {
    if (!this.civilizationToDelete?.id) return;

    this.civilizationService.deleteCivilization(this.civilizationToDelete.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showDeleteConfirmation = false;
          this.civilizationToDelete = null;
        },
        error: (err) => {
          console.error('Error deleting civilization:', err);
          this.showDeleteConfirmation = false;
        }
      });
  }

  cancelDelete(): void {
    this.showDeleteConfirmation = false;
    this.civilizationToDelete = null;
  }

  saveCivilization(): void {
    if (this.civilizationForm.invalid) return;

    this.isSubmitting = true;
    const formValue = this.civilizationForm.value;

    // Créer un objet avec seulement les champs acceptés par le backend
    const civilizationData: Civilization = {
      id: formValue.id,
      name: formValue.name,
      description: formValue.description,
      startDate: formValue.startDate,
      endDate: formValue.endDate
      // Le champ region n'est pas accepté par le backend
    };

    if (this.editMode && formValue.id) {
      this.civilizationService.updateCivilization(formValue.id, civilizationData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.closeModal();
            this.isSubmitting = false;
          },
          error: (error: Error) => {
            console.error('Error updating civilization:', error);
            this.isSubmitting = false;
          }
        });
    } else {
      this.civilizationService.createCivilization(civilizationData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.closeModal();
            this.isSubmitting = false;
          },
          error: (error: Error) => {
            console.error('Error creating civilization:', error);
            this.isSubmitting = false;
          }
        });
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.civilizationForm.reset();
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedCivilization = null;
  }

  // Helper method to format date for input fields
  private formatDateForInput(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }
}
