
import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'RE';
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const url = new URL(window.location.href);
    const username = url.searchParams.get('username');

    if (username) {
      this.authService.handleSAMLRedirect();
    }
  }
}