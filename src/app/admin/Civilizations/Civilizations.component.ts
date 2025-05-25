import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { Civilization, CivilizationService } from '../../core/services/civilization.service';
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
  styleUrl :'./Civilizations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CivilizationsComponent implements OnInit, OnDestroy {
  private civilizationService = inject(CivilizationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // UI state
  showModal = false;
  showDeleteConfirmation = false;
  showViewModal = false;
  editMode = false;
  isSubmitting = false;
  loading = false;
  error: string | null = null;

  // Form and data
  civilizationForm!: FormGroup;
  civilizationToDelete: Civilization | null = null;
  selectedCivilization: Civilization | null = null;

  // Search parameters
  searchParams = {
    name: '',
    startPeriod: null as number | null,
    endPeriod: null as number | null
  };

  // Propriétés de recherche et tri
  searchTerm = '';
  sortBy = 'name';
  filteredCivilizations: Civilization[] = [];
  civilizations: Civilization[] = []; // Simple comme Users

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
      achievements: [[]],
      notableEvents: [[]]
    });
  }

  loadCivilizations(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();
    
    this.civilizationService.loadAllCivilizations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (civilizations) => {
          this.civilizations = civilizations;
          this.loading = false;
          this.applyFilters();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading civilizations:', err);
          this.loading = false;
          this.error = err.message || 'Erreur lors du chargement des civilisations';
          this.cdr.markForCheck();
        }
      });
  }

  searchCivilizations(): void {
    // Filter out null values
    const params: any = {};
    if (this.searchParams.name) params.name = this.searchParams.name;
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
          this.loadCivilizations(); // Reload civilizations after deletion
          this.cdr.markForCheck();
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
            this.loadCivilizations(); // Reload civilizations after update
            this.cdr.markForCheck();
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
            this.loadCivilizations(); // Reload civilizations after createCivilization
            this.cdr.markForCheck();
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

  // Helper method to calculate duration between two dates
  getDuration(startDate: string, endDate: string): number {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return Math.abs(end.getFullYear() - start.getFullYear());
  }

  // Helper method to format date for input fields
  private formatDateForInput(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  // Méthodes de recherche et tri
  onSearchChange(): void {
    this.applyFilters();
  }

  sortCivilizations(sortType: string): void {
    this.sortBy = sortType;
    this.applyFilters();
  }

  getSortLabel(): string {
    switch (this.sortBy) {
      case 'name': return 'Nom A-Z';
      case 'startDate': return 'Date début';
      case 'endDate': return 'Date fin';
      case 'duration': return 'Durée';
      default: return 'Nom A-Z';
    }
  }

  private applyFilters(): void {
    let filtered = [...this.civilizations];

    // Appliquer la recherche
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(civilization => 
        civilization.name.toLowerCase().includes(searchLower) ||
        (civilization.description?.toLowerCase().includes(searchLower) || false)
      );
    }

    // Appliquer le tri
    switch (this.sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'startDate':
        filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        break;
      case 'endDate':
        filtered.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
        break;
      case 'duration':
        filtered.sort((a, b) => this.getDuration(a.startDate, a.endDate) - this.getDuration(b.startDate, b.endDate));
        break;
    }

    this.filteredCivilizations = filtered;
  }
}
