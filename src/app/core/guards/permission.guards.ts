// import { Injectable } from '@angular/core';
// import { Router, ActivatedRouteSnapshot } from '@angular/router';
// import { AuthService } from '../../auth.service';
// import { HttpClient } from '@angular/common/http';
// import { Observable, of, map, catchError } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class PermissionGuard {
//   constructor(
//     private authService: AuthService,
//     private router: Router,
//     private http: HttpClient
//   ) {}

//   canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
//     if (!this.authService.isAuthenticated()) {
//       this.router.navigate(['/login']);
//       return of(false);
//     }

//     const requiredModule = route.data['requiredModule'];
//     if (!requiredModule) {
//       return of(true); 
//     }

//     // Get user rights from the backend
//     return this.http.get<any>('http://localhost:8000/Rights', {
//       params: { uid: this.authService.getUserId() ?? '' },
//       withCredentials: true
//     }).pipe(
//       map(response => {
//         if (response.status_code === 200) {
//           const hasPermission = this.checkPermission(response.data, requiredModule);
//           if (!hasPermission) {
//             this.router.navigate(['/unauthorized']);
//           }
//           return hasPermission;
//         }
//         return false;
//       }),
//       catchError(() => {
//         this.router.navigate(['/login']);
//         return of(false);
//       })
//     );
//   }

//   private checkPermission(userRights: any[], requiredModule: string): boolean {
//     // Check if user has at least view access (v=1) to the required module
//     return userRights.some(right => 
//       right.module_name.includes(requiredModule) && right.v === 1
//     );
//   }
// }