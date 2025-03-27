import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, OnDestroy {
  username: string | null = null;
  private subscription: Subscription = new Subscription();
  userSites: any[] = [];
  errorMessage: string = '';

  constructor(
    public authService: AuthService,
    private http: HttpClient
  ) {}
  
  ngOnInit(): void {
    this.subscription = this.authService.getDecodedUsername().subscribe(username => {
      this.username = username;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }


  getUserSites(): void {
    this.errorMessage = ''; 
    // this.http.get('https://10.127.251.201/reviewworks/sites', { withCredentials: true })
    this.http.get('http://localhost:8000/reviewworks/sites', { withCredentials: true })
      .subscribe({
        next: (response: any) => {
          this.userSites = response.data;
          console.log('User Sites:', this.userSites);
        },
        error: (error) => {
          this.errorMessage = `Error fetching user sites: ${error.message}`;
          console.error('Error:', error);
        }
      });
    }

}