import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, UpdateRoleData, UpdateUserData, User } from '../../core/auth/auth.service';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-Users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AdminSidebarComponent],
  templateUrl: './Users.component.html',
  styleUrl: './Users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error: string | null = null;
  selectedUser: User | null = null;
  isEditingRole = false;
  isEditingUser = false;
  isConfirmingDelete = false;
  newRole = '';
  showUserDetails = false;
  
  // Propriétés pour les modals
  // (aucune propriété nécessaire car nous utilisons les modals DaisyUI)
  
  // Données pour l'édition d'un utilisateur
  editUserData: UpdateUserData = {
    firstName: '',
    lastName: '',
    email: ''
  };
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 5;
  
  // Notification popup
  showNotification = false;
  notificationMessage = '';
  notificationSuccess = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  // Getter for paginated users
  get paginatedUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.users.slice(startIndex, endIndex);
  }

  // Getter for total pages
  get totalPages(): number {
    return Math.ceil(this.users.length / this.itemsPerPage);
  }

  // Getter for page number array
  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Getter for display info
  get displayInfo() {
    if (this.users.length === 0) {
      return { start: 0, end: 0, total: 0 };
    }
    
    const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endItem = Math.min(this.currentPage * this.itemsPerPage, this.users.length);
    return {
      start: startItem,
      end: endItem,
      total: this.users.length
    };
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.markForCheck();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cdr.markForCheck();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.cdr.markForCheck();
    }
  }

  // Load all users
  loadUsers(): void {
    this.loading = true;
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
        this.error = null;
      this.currentPage = 1;
      this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.error = error.message || 'Error loading users';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Navigation to Dashboard
  navigateToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  // Navigation to Settings
  navigateToSettings(): void {
    this.router.navigate(['/admin/settings']);
  }

  // Sign out
  signOut(): void {
    this.authService.signOut().subscribe({
      next: () => {
    this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Error signing out:', error);
      }
    });
  }

  // Show notification
  showNotificationPopup(message: string, success: boolean): void {
    this.notificationMessage = message;
    this.notificationSuccess = success;
    this.showNotification = true;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.showNotification = false;
      this.cdr.markForCheck();
    }, 3000);
  }

  // View user details
  viewUserDetails(id: string): void {
    this.loading = true;
    this.authService.getUserById(id).subscribe({
      next: (user) => {
        this.selectedUser = user;
        
        // Open the modal dialog
        const modal = document.getElementById('user_modal') as HTMLDialogElement;
        if (modal) {
          modal.showModal();
          
          // Add event listener to close on backdrop click
          modal.addEventListener('click', (event) => {
            const modalDimensions = modal.getBoundingClientRect();
            if (
              event.clientX < modalDimensions.left ||
              event.clientX > modalDimensions.right ||
              event.clientY < modalDimensions.top ||
              event.clientY > modalDimensions.bottom
            ) {
              this.closeUserDetails();
            }
          });
        }
        
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading user details:', error);
        this.error = error.message || 'Error loading user details';
        this.loading = false;
        this.showNotificationPopup('Error loading user details', false);
        this.cdr.markForCheck();
      }
    });
  }

  // Close user details modal
  closeUserDetails(): void {
    const modal = document.getElementById('user_modal') as HTMLDialogElement;
    if (modal) {
      modal.close();
    }
    this.selectedUser = null;
    this.cdr.markForCheck();
  }

  // Start editing user role
  startEditRole(user: User): void {
    this.selectedUser = { ...user };
    this.newRole = user.role || 'USER';
    
    // Ouvrir le modal d'édition de rôle
    const modal = document.getElementById('edit_role_modal') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
    
    this.cdr.markForCheck();
  }

  // Cancel editing user role
  cancelEditRole(): void {
    const modal = document.getElementById('edit_role_modal') as HTMLDialogElement;
    if (modal) {
      modal.close();
    }
    this.cdr.markForCheck();
  }

  // Save user role change
  saveRoleChange(): void {
    if (!this.selectedUser?.id || !this.newRole) return;
    
    const roleData: UpdateRoleData = { role: this.newRole };
    
    this.loading = true;
    this.authService.updateUserRole(this.selectedUser.id, roleData).subscribe({
        next: () => {
        // Fermer le modal
        const modal = document.getElementById('edit_role_modal') as HTMLDialogElement;
        if (modal) {
          modal.close();
        }
        
        this.showNotificationPopup('User role updated successfully', true);
        this.loadUsers(); // Reload to get updated list
        },
        error: (error) => {
        console.error('Error updating user role:', error);
        this.error = error.message || 'Error updating user role';
        this.loading = false;
        this.showNotificationPopup('Error updating user role', false);
        this.cdr.markForCheck();
      }
    });
  }

  // Start editing user
  startEditUser(user: User): void {
    this.selectedUser = { ...user };
    this.editUserData = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email
    };
    
    // Ouvrir le modal d'édition d'utilisateur
    const modal = document.getElementById('edit_user_modal') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
    
    this.cdr.markForCheck();
  }

  // Cancel editing user
  cancelEditUser(): void {
    const modal = document.getElementById('edit_user_modal') as HTMLDialogElement;
    if (modal) {
      modal.close();
    }
    this.cdr.markForCheck();
  }

  // Save user changes
  saveUserChanges(): void {
    if (!this.selectedUser?.id) return;
    
    this.loading = true;
    this.authService.updateUser(this.selectedUser.id, this.editUserData).subscribe({
      next: () => {
        // Fermer le modal
        const modal = document.getElementById('edit_user_modal') as HTMLDialogElement;
        if (modal) {
          modal.close();
        }
        
        this.showNotificationPopup('User information updated successfully', true);
        this.loadUsers(); // Reload to get updated list
      },
      error: (error) => {
        console.error('Error updating user:', error);
        this.error = error.message || 'Error updating user';
        this.loading = false;
        this.showNotificationPopup('Error updating user information', false);
        this.cdr.markForCheck();
      }
    });
  }

  // Edit user
  editUser(id: string): void {
    // Si l'utilisateur est déjà sélectionné dans le modal, passer directement en mode édition
    if (this.selectedUser && this.selectedUser.id === id) {
      this.prepareEditUser();
      // Ouvrir le modal d'édition d'utilisateur
      const modal = document.getElementById('edit_user_modal') as HTMLDialogElement;
      if (modal) {
        modal.showModal();
      }
      this.cdr.markForCheck();
      return;
    }
    
    this.loading = true;
    this.authService.getUserById(id).subscribe({
      next: (user) => {
        this.loading = false;
        this.startEditUser(user);
      },
      error: (error) => {
        console.error('Error loading user for edit:', error);
        this.error = error.message || 'Error loading user';
        this.loading = false;
        this.showNotificationPopup('Error loading user information', false);
        this.cdr.markForCheck();
      }
    });
  }
  
  // Start delete confirmation
  confirmDeleteUser(id: string): void {
    // Si l'utilisateur est déjà sélectionné dans le modal, ouvrir directement le modal de suppression
    if (this.selectedUser && this.selectedUser.id === id) {
      const modal = document.getElementById('delete_user_modal') as HTMLDialogElement;
      if (modal) {
        modal.showModal();
      }
      this.cdr.markForCheck();
      return;
    }
    
    this.loading = true;
    this.authService.getUserById(id).subscribe({
      next: (user) => {
        this.selectedUser = user;
        
        // Ouvrir le modal de confirmation de suppression
        const modal = document.getElementById('delete_user_modal') as HTMLDialogElement;
        if (modal) {
          modal.showModal();
        }
        
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading user for deletion:', error);
        this.error = error.message || 'Error loading user';
        this.loading = false;
        this.showNotificationPopup('Error loading user information', false);
        this.cdr.markForCheck();
      }
    });
  }
  
  // Cancel delete confirmation
  cancelDeleteUser(): void {
    const modal = document.getElementById('delete_user_modal') as HTMLDialogElement;
    if (modal) {
      modal.close();
    }
    this.cdr.markForCheck();
  }

  // Delete user
  deleteUser(): void {
    if (!this.selectedUser?.id) return;
    
    this.loading = true;
    this.authService.deleteUser(this.selectedUser.id).subscribe({
      next: () => {
        // Fermer le modal
        const modal = document.getElementById('delete_user_modal') as HTMLDialogElement;
        if (modal) {
          modal.close();
        }
        
        this.selectedUser = null;
        this.showNotificationPopup('User deleted successfully', true);
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.error = error.message || 'Error deleting user';
        this.loading = false;
        this.showNotificationPopup('Error deleting user', false);
        this.cdr.markForCheck();
      }
    });
  }
  
  // Méthodes pour les actions dans le modal
  
  // Préparer l'édition d'un utilisateur dans le modal
  prepareEditUser(): void {
    if (this.selectedUser) {
      this.editUserData = {
        firstName: this.selectedUser.firstName || '',
        lastName: this.selectedUser.lastName || '',
        email: this.selectedUser.email
      };
    }
  }
  
  // Fin des méthodes de gestion des utilisateurs
}
