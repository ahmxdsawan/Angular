import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogUserDetailsComponent } from './dialog-user-details/dialog-user-details.component';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {

  users: any[] = [];
  loading = false;
  errorMessage = '';
  selectedUser: any = null;
  
  //column definitions
  columns = [
    { field: 'username', header: 'Username' },
    { field: 'full_name', header: 'Full Name' },
    { field: 'email', header: 'Email' },
    { field: 'roles', header: 'Roles' },
    { field: 'isActive', header: 'Status' }
  ];

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.http.get<any>('http://localhost:8000/api/users', { withCredentials: true })
      .subscribe({
        next: (response) => {
          const usersData = response.data || response;
          
          this.users = Array.isArray(usersData) ? usersData.map(user => {
            return {
              id: user.id,
              username: user.username,
              full_name: user.full_name,
              fname : user.fname,
              lname : user.lname,
              email: user.email,
              roles: user.roles,
              site_codes: user.site_codes,
              isActive: user.isActive === 1 || user.isActive === true
            };
          }) : [];
          
          console.log('Processed users data:', this.users);
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = `Error fetching users: ${error.message}`;
          this.loading = false;
          console.error('Error:', error);
        }
      });
  }

  openUserDialog(user: any = null): void {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.autoFocus = true;
    dialogConfig.width = '70vw';
    dialogConfig.height = '80vh';
    dialogConfig.disableClose = true;

    dialogConfig.data = {
      user: user,
      isEdit: !!user
    };

    const dialogRef = this.dialog.open(DialogUserDetailsComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.loadUsers();
        const message = result.isEdit ? 'User updated successfully' : 'User created successfully';
        this.openSnackBar(message, 'Close');
      }
    });
  }

  onUserRowClick(user: any): void {
    this.selectedUser = user;
    this.openUserDialog(user);
  }


  openSnackBar(message: string, action: string, duration: number = 3000): void {
    this.snackBar.open(message, action, {
      duration: duration,
      verticalPosition: 'bottom'
    });
  }


}