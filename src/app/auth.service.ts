import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, switchMap, map} from 'rxjs/operators';
import { Router } from '@angular/router';
import { UserRightsService } from './services/user-rights.service';

interface AuthResponse {
  detail: string;
  username?: string;
  expires_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // private baseUrl = 'https://10.127.251.201'; // SIT
  private baseUrl = 'http://localhost:8000';
  private usernameSubject = new BehaviorSubject<string | null>(null);
  private checkSessionInterval: any = null;

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private userRightsService: UserRightsService
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const storedUsername = localStorage.getItem('saml_username');
    if (storedUsername) {
      this.usernameSubject.next(storedUsername);
      
      this.userRightsService.loadCurrentUserRights().subscribe({
        next: (rights) => console.log(`Loaded ${rights.length} cached user rights`),
        error: (err) => console.error('Error loading cached user rights:', err)
      });
    }

    this.validateSessionBackend().subscribe({
      next: (res: any) => {
        if (res.username) {
          this.usernameSubject.next(res.username);
          localStorage.setItem('saml_username', res.username);
          
          if (res.expires_at) {
            this.scheduleAutoLogout(res.expires_at);
          }
          
          this.userRightsService.loadCurrentUserRights().subscribe();
          this.setupSessionChecks();
        } else {
          this.clearSession();
        }
      },
      error: (err) => {
        this.clearSession();
      }
    });
  }

  private setupSessionChecks(): void {
    if (this.checkSessionInterval) {
      clearInterval(this.checkSessionInterval);
    }
    
    this.checkSessionInterval = setInterval(() => {
      if (this.isAuthenticated()) {
        this.validateSessionBackend().subscribe({
          next: (res: any) => {
            if (!res.username) {
              this.clearSession();
              this.router.navigate(['/login'], { 
              });
            }
          },
          error: () => {
            this.clearSession();
          }
        });
      } else {
        clearInterval(this.checkSessionInterval);
      }
    }, 30000); // 30 seconds
  }

  private validateSessionBackend(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/get-token/`, { withCredentials: true })
      .pipe(
        tap(res => {
          if (res.username) {
            this.usernameSubject.next(res.username);
            localStorage.setItem('saml_username', res.username);
            
            if (res.expires_at) {
              this.scheduleAutoLogout(res.expires_at);
            }
          }
        }),
        catchError(error => {
          this.clearSession();
          return throwError(() => error);
        })
      );
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login/`, { username, password }, { withCredentials: true })
      .pipe(
        catchError(error => {
          if (error.status === 403 && error.error.detail === "User already has an active session.") {
            this.clearSession();
          }
          return throwError(() => error);
        })
      );
  }

  verifyTwoFactor(userId: number, code: string, secret: string, platform: string): Observable<any> {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/login/2fa`, 
      { id: userId, code, secret, platform }, 
      { withCredentials: true }
    ).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
        if (response.username) {
          this.setupSessionChecks();
        }
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  loginWithMicrosoft(): void {
    window.location.href = `${this.baseUrl}/api/auth/saml/login/`;
  }

  handleSAMLRedirect(): void {
    const url = new URL(window.location.href);
    const username = url.searchParams.get('username');
    const expiresAt = url.searchParams.get('expires_at');
    const error = url.searchParams.get('error');

    if (error === 'session_active') {
      this.clearSession();
      this.router.navigate(['/login'], { queryParams: { error: 'session_active' } });
      return;
    }

    if (username && expiresAt) {
      this.handleAuthSuccess({
        detail: 'SAML login successful',
        username,
        expires_at: expiresAt
      });
      // Remove SAML query parameters from the URL.
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      this.router.navigate(['/login'], { queryParams: { error: 'invalid_saml', message: 'Invalid SAML response' } });
    }
  }

  private handleAuthSuccess(response: AuthResponse): void {
    if (response.username) {
      this.usernameSubject.next(response.username);
      localStorage.setItem('saml_username', response.username);
      
      this.userRightsService.loadCurrentUserRights().subscribe({
        next: (rights) => console.log(`Successfully loaded ${rights.length} user rights`),
        error: (err) => console.error('Error loading user rights:', err)
      });
    }
    
    if (response.expires_at) {
      this.scheduleAutoLogout(response.expires_at);
    }
    
    this.router.navigate(['/landing']);
  }

  private scheduleAutoLogout(expiresAtIso: string): void {
    const expiresAt = new Date(expiresAtIso.replace(/\s+/g, '')).getTime();
    const timeLeft = expiresAt - Date.now();
    if (timeLeft > 0) {
      setTimeout(() => this.forcedLogout(), timeLeft);
    } else {
      this.forcedLogout();
    }
  }

  logout(): void {
    this.http.post(`${this.baseUrl}/logout/`, {}, { withCredentials: true, observe: 'response' })
      .pipe(catchError(err => throwError(() => err)))
      .subscribe({
        next: () => this.clearSession(),
        error: () => this.clearSession()
      });
  }

  forcedLogout(): void {
    this.http.post(`${this.baseUrl}/logout/force`, { username: this.usernameSubject.getValue() }, { withCredentials: true, observe: 'response' })
      .pipe(catchError(err => throwError(() => err)))
      .subscribe({
        next: () => this.clearSession(),
        error: () => this.clearSession()
      });
  }

  private clearSession(): void {
    localStorage.removeItem('saml_username');
    this.usernameSubject.next(null);
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  isAuthenticated(): boolean {
    return !!this.usernameSubject.getValue();
  }

  getDecodedUsername(): Observable<string | null> {
    return this.usernameSubject.asObservable();
  }
}