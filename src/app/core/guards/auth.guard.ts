import { Injectable } from '@angular/core';
import { AuthService } from '../../auth.service'; 
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserRightsService } from '../../services/user-rights.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private authService: AuthService,
    private router: Router,
    private userRightsService: UserRightsService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const isAuthenticated = this.authService.isAuthenticated();
    const isLoginPage = state.url.includes('/login');
    
    if (isAuthenticated) {
      if (isLoginPage) {
        this.router.navigate(['/landing']);
        return false;
      }
      
      // Trigger rights loading (will do nothing if already loaded)
      this.userRightsService.loadCurrentUserRights().subscribe();
      
      // Check module access if route data is provided
      if (route.data && route.data['moduleName'] && route.data['access']) {
        const moduleName = route.data['moduleName'];
        const accessType = route.data['access'];
        
        // Map access type string to the actual property name
        const accessMapping: { [key: string]: 'v' | 'ro' | 'rw' } = {
          'view': 'v',
          'read': 'ro',
          'write': 'rw'
        };
        
        const mappedAccessType = accessMapping[accessType];
        
        if (mappedAccessType) {
          const hasAccess = this.userRightsService.hasAccess(moduleName, mappedAccessType);
          
          if (!hasAccess) {
            console.log(`Access denied to ${moduleName}`);
            this.router.navigate(['/landing']);
            return false;
          }
        }
      }
      
      return true;
    } else {
      if (!isLoginPage) {
        this.router.navigate(['/login']);
        return false;
      }
      return true;
    }
  }
}