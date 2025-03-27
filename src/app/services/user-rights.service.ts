import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap, shareReplay } from 'rxjs/operators';

export interface ModuleRight {
  module_name: string;
  module_id: number;
  name: string;
  v: number;  // View permission
  ro: number; // Read-only permission
  rw: number; // Read-write permission
}

@Injectable({
  providedIn: 'root'
})
export class UserRightsService {
  private baseUrl = 'http://localhost:8000';
  private userRightsSubject = new BehaviorSubject<ModuleRight[]>([]);
  public userRights$ = this.userRightsSubject.asObservable();
  
  private loadingRequest: Observable<ModuleRight[]> | null = null;

  constructor(private http: HttpClient) {}

  loadCurrentUserRights(): Observable<ModuleRight[]> {
    if (this.userRightsSubject.getValue().length > 0) {
      return of(this.userRightsSubject.getValue());
    }
    
    if (this.loadingRequest) {
      return this.loadingRequest;
    }

    this.loadingRequest = this.http.get<any>(
      `${this.baseUrl}/api/current-user-rights`, 
      { withCredentials: true }
    ).pipe(
      map(response => {
        if (response && response.status_code === 200) {
          const rights = response.data || [];
          this.userRightsSubject.next(rights);
          return rights;
        }
        return [];
      }),
      tap(() => {
        setTimeout(() => this.loadingRequest = null, 0);
      }),
      catchError(err => {
        this.loadingRequest = null;
        return of([]);
      }),
      shareReplay(1)
    );
    
    return this.loadingRequest;
  }
  
  hasAccess(moduleName: string, accessType: 'v' | 'ro' | 'rw'): boolean {
    const rights = this.userRightsSubject.getValue();
    const moduleRight = rights.find(right => 
      right.module_name.toLowerCase() === moduleName.toLowerCase()
    );
    
    if (rights.length === 0) {
      return true;
    }
    
    return moduleRight ? moduleRight[accessType] === 1 : false;
  }

  getAccessibleModules(): string[] {
    const rights = this.userRightsSubject.getValue();
    if (rights.length === 0) {
      return [];
    }
    
    return rights
      .filter(right => right.v || right.ro || right.rw)
      .map(right => right.module_name);
  }
  
  getAccessibleSections(): string[] {
    const rights = this.userRightsSubject.getValue();
    if (rights.length === 0) {
      return ['Fleet', 'Site', 'Operations', 'Compliance', 'Reports', 'Metrics', 'Admin'];
    }
    
    return [...new Set(
      rights
        .filter(right => right.v || right.ro || right.rw)
        .map(right => right.name)
    )];
  }
}