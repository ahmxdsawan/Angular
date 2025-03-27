import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { LandingComponent } from './landing/landing.component';
import { UserManagementComponent } from './admin/user-management/user-management.component';
import { AuthGuard } from '../app/core/guards/auth.guard'; 

const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [AuthGuard] },
  { path: 'landing', component: LandingComponent, canActivate: [AuthGuard] },
  { 
    path: 'admin/user-management', 
    component: UserManagementComponent, 
    canActivate: [AuthGuard],
    data: { 
      moduleName: 'Admin - User Management',
      access: 'view'
    }
  },
  { path: '', redirectTo: '/landing', pathMatch: 'full' },
  { path: '**', redirectTo: '/landing' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }