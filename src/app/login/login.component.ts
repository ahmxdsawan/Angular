import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  submitted: boolean = false;
  errorMessage: string = '';

  // 2fa
  showTwoFactorAuth: boolean = false;
  twoFactorCode: string = '';
  userId: number | null = null;
  twoFactorSecret: string = '';
  platform: string = '';
  otpauthUrl: string = '';
  isTwoFactorSetup: boolean = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
          if (params['error'] === 'session_active') {
              this.errorMessage = params['message'] || 'You have an active session in another browser. Please logout from there first.';
          } else if (params['error'] === 'invalid_saml') {
              this.errorMessage = params['message'] || 'SAML authentication failed';
          }
      }
  });
}

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    
    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        if (response.username === 'api.test') {
          this.errorMessage = 'This user is not authorized';
          this.submitted = false;
          return;
        }

        this.userId = response.id;
        this.platform = response.platform;
        this.showTwoFactorAuth = true;
        
        if (response.require_2fa) {
          this.isTwoFactorSetup = true;
        } else {
          this.isTwoFactorSetup = false;
          this.twoFactorSecret = response.secret;
          this.otpauthUrl = response.otpauth_url;
        }
        this.submitted = false;
      },
      error: (err) => {
          console.error('Login failed', err);
          this.submitted = false;
          
          if (err.error && err.error.detail === "User already has an active session") {
              this.errorMessage = 'You have an active session in another browser. Please logout from there first.';
          } else {
              this.errorMessage = 'Invalid credentials';
          }
      }
    });
  }

  submitTwoFactorCode() {
    if (!this.twoFactorCode) {
      this.errorMessage = 'Please enter the verification code';
      return;
    }

    this.submitted = true;
    this.errorMessage = '';

    this.authService.verifyTwoFactor(
      this.userId!,
      this.twoFactorCode,
      this.twoFactorSecret,
      this.platform
    ).subscribe({
      next: (response) => {
      },
      error: (err) => {
        this.submitted = false;
        this.errorMessage = err.error?.detail || 'Invalid verification code';
      }
    });
  }

  backToLogin() {
    this.showTwoFactorAuth = false;
    this.twoFactorCode = '';
    this.userId = null;
    this.twoFactorSecret = '';
    this.platform = '';
    this.otpauthUrl = '';
    this.isTwoFactorSetup = false;
    this.errorMessage = '';
  }

  loginWithMicrosoft() {
    this.authService.loginWithMicrosoft();
  }
}