import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dialog-user-details',
  templateUrl: './dialog-user-details.component.html',
  styleUrls: ['./dialog-user-details.component.scss']
})
export class DialogUserDetailsComponent implements OnInit {
  quickActionsForm!: FormGroup;
  loading = false;
  saving = false;
  
  // Rights management
  rightsGridData: any[] = [];
  custom_selector = false;
  menus: any[] = [];
  actions: any[] = [];
  availableRoles = ['Admin', 'Client', 'Field Tech', 'Control Room Operator', 'Engineering'];
  personalRoles: string[] = [];
  
  // Table columns
  displayedColumns: string[] = ['module_name', 'v', 'ro', 'rw'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<DialogUserDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.quickActionsForm = this.fb.group({
      menuSelector: [[]],
      actionSelector: [[]],
      commonRoleSelector: ['']
    });
    
    this.loadUserRights();
    this.loadQuickOptionsData();
    
    if (this.data.user) {
      console.log('User roles from data:', this.data.user.roles);
      
      // Handle various formats of roles data
      if (this.data.user.roles) {
        if (typeof this.data.user.roles === 'string') {
          // Split the string if it's comma-separated
          this.personalRoles = this.data.user.roles.split(',').map((r: string) => r.trim());
        } else if (Array.isArray(this.data.user.roles)) {
          this.personalRoles = this.data.user.roles;
        }
      }
      
      console.log('Processed personal roles:', this.personalRoles);
      
      // Set a default role in the form if none exists
      if (this.personalRoles.length > 0) {
        this.quickActionsForm.get('commonRoleSelector')?.setValue(this.personalRoles[0]);
      } else if (this.availableRoles.length > 0) {
        // Default to a role if user has none
        this.personalRoles = ['Client']; // Default to a basic role
        this.quickActionsForm.get('commonRoleSelector')?.setValue('Client');
      }
    }
  }

  loadUserRights(): void {
    if (!this.data.user || !this.data.user.id) {
      return;
    }

    this.loading = true;
    this.http.get<any>(`http://localhost:8000/api/rights?uid=${this.data.user.id}`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          if (response.status_code === 200) {
            this.rightsGridData = response.data || [];
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading user rights:', error);
          this.loading = false;
        }
      });
  }

  loadQuickOptionsData(): void {
    this.http.get<any>('http://localhost:8000/api/rights-quick-options', { withCredentials: true })
      .subscribe({
        next: (response) => {
          if (response.status_code === 200) {
            this.menus = response.data[0] || [];
            this.actions = response.data[1] || [];
          }
        },
        error: (error) => {
          console.error('Error loading quick options data:', error);
        }
      });
  }

  toggleCustomSelector(event: any): void {
    this.custom_selector = event.checked;
    
    if (!this.custom_selector) {
      this.quickActionsForm.get('menuSelector')?.setValue([]);
      this.quickActionsForm.get('actionSelector')?.setValue([]);
    } else {
      this.quickActionsForm.get('commonRoleSelector')?.setValue('');
    }
  }

  changeCustomizeSelector(): void {
    if (!this.custom_selector) {
      this.quickActionsForm.get('menuSelector')?.setValue([]);
      this.quickActionsForm.get('actionSelector')?.setValue([]);
    } else {
      this.quickActionsForm.get('commonRoleSelector')?.setValue('');
    }
  }

  updateCheckbox(right: any, column: string, checked: boolean): void {
    console.log('Before update:', right, column, checked);
  
    if (column === 'v') {
      if (!checked) {
        // Unchecking "View" turns off both "Read-Only" and "Read-Write"
        right.ro = 0;
        right.rw = 0;
      } else {
        // Checking "View" turns "Read-Only" on and "Read-Write" off
        right.ro = 1;
        right.rw = 0;
      }
    } else if (column === 'ro') {
      // Toggling "Read-Only" always turns "View" on and "Read-Write" off
      right.v = 1;
      right.rw = 0;
    } else if (column === 'rw') {
      if (!checked) {
        // Unchecking "Read-Write" turns "Read-Only" on
        right.ro = 1;
      } else {
        // Checking "Read-Write" turns "View" on and "Read-Only" off
        right.v = 1;
        right.ro = 0;
      }
    }
  
    right[column] = checked ? 1 : 0;
  
    console.log('After update:', right);
  }

  loadQuickSelectionRole(): void {
    const role = this.quickActionsForm.get('commonRoleSelector')?.value;
    if (!role) return;

    this.loading = true;
    this.http.post<any>('http://localhost:8000/api/rights-from-quick-actions', {
      menu_ids: [],
      action_ids: [],
      role
    }, { withCredentials: true })
      .subscribe({
        next: (response) => {
          if (response.status_code === 200) {
            this.rightsGridData = response.data || [];
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading role rights:', error);
          this.loading = false;
        }
      });
  }

  loadQuickSelectionNonRole(): void {
    const menuIds = this.quickActionsForm.get('menuSelector')?.value || [];
    const actionIds = this.quickActionsForm.get('actionSelector')?.value || [];
    
    if (menuIds.length === 0 || actionIds.length === 0) return;

    this.loading = true;
    this.http.post<any>('http://localhost:8000/api/rights-from-quick-actions', {
      menu_ids: menuIds,
      action_ids: actionIds,
      role: 'N/A'
    }, { withCredentials: true })
      .subscribe({
        next: (response) => {
          if (response.status_code === 200) {
            this.rightsGridData = response.data || [];
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading custom rights:', error);
          this.loading = false;
        }
      });
  }

  updateUserRights(): void {
    if (!this.data.user || !this.data.user.id) {
      return;
    }
  
    // Always ensure there's a default role if none is selected
    let roleToSend = this.personalRoles.length > 0 ? this.personalRoles[0] : 'Client';
    
    // If using custom selector, set the appropriate role
    if (this.custom_selector) {
      // If custom is selected but no role in personal roles, add 'Custom'
      if (!this.personalRoles.includes('Custom')) {
        this.personalRoles.push('Custom');
      }
    } else {
      // Use the selected role from the dropdown
      const selectedRole = this.quickActionsForm.get('commonRoleSelector')?.value;
      if (selectedRole) {
        roleToSend = selectedRole;
        
        // Update personalRoles if needed
        if (!this.personalRoles.includes(selectedRole)) {
          this.personalRoles = [selectedRole]; // Replace with the newly selected role
        }
      }
    }
  
    console.log('Sending role to server:', roleToSend);
    console.log('Custom role flag:', this.custom_selector);
  
    this.saving = true;
    this.http.put<any>('http://localhost:8000/api/rights', {
      id: this.data.user.id,
      data: this.rightsGridData,
      username: this.data.user.username,
      role: roleToSend, // Always send a valid role
      custom_role: this.custom_selector
    }, { withCredentials: true })
      .subscribe({
        next: (response) => {
          console.log('Response from server:', response);
          if (response.status_code === 200) {
            this.dialogRef.close({ 
              success: true, 
              isEdit: true, 
              rightsUpdated: true
            });
          }
          this.saving = false;
        },
        error: (error) => {
          console.error('Error updating user rights:', error);
          this.saving = false;
        }
      });
  }

  

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }
}