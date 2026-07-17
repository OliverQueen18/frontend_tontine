import { Component, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ChatAssistantComponent } from '../../../shared/components/chat-assistant/chat-assistant.component';

import { environment } from '../../../../environments/environment';



type LoginView = 'login' | 'forgot';

type ForgotStep = 1 | 2 | 3;



@Component({

  selector: 'app-login',

  standalone: true,

  imports: [FormsModule, RouterLink, ChatAssistantComponent],

  templateUrl: './login.component.html',

  styleUrl: './login.component.scss'

})

export class LoginComponent {

  view = signal<LoginView>('login');

  forgotStep = signal<ForgotStep>(1);



  username = '';

  password = '';

  showPassword = false;

  showNewPassword = false;

  showConfirmPassword = false;

  rememberMe = true;

  loading = signal(false);

  error = signal('');

  success = signal('');

  version = environment.appVersion;

  isDev = !environment.production;



  forgotUsername = '';

  otp = '';

  newPassword = '';

  confirmPassword = '';

  resetToken = '';

  maskedEmail = '';

  otpCountdown = signal(0);

  private countdownTimer?: ReturnType<typeof setInterval>;



  constructor(private auth: AuthService, private router: Router) {}



  get progressPercent(): number {

    const step = this.forgotStep();

    if (step === 1) return 33;

    if (step === 2) return 66;

    return 100;

  }



  get progressLabel(): string {

    const labels = ['Identifiant', 'Code OTP', 'Nouveau mot de passe'];

    return labels[this.forgotStep() - 1];

  }



  submit(): void {

    this.loading.set(true);

    this.error.set('');

    this.auth.login(this.username, this.password, this.rememberMe).subscribe({

      next: () => {

        this.loading.set(false);

        this.router.navigate([this.auth.mustChangePassword() ? '/app/profil' : '/app/dashboard']);

      },

      error: (err) => {

        this.loading.set(false);

        this.error.set(err?.error?.message || 'Identifiants incorrects');

      }

    });

  }



  openForgot(): void {

    this.view.set('forgot');

    this.forgotStep.set(1);

    this.forgotUsername = this.username;

    this.otp = '';

    this.newPassword = '';

    this.confirmPassword = '';

    this.resetToken = '';

    this.error.set('');

    this.success.set('');

    this.stopCountdown();

  }



  backToLogin(): void {

    this.view.set('login');

    this.error.set('');

    this.success.set('');

    this.stopCountdown();

  }



  requestOtp(): void {

    if (!this.forgotUsername.trim()) {

      this.error.set('Saisissez votre nom d\'utilisateur');

      return;

    }

    this.loading.set(true);

    this.error.set('');

    this.auth.forgotPassword(this.forgotUsername.trim()).subscribe({

      next: (res) => {

        this.loading.set(false);

        this.maskedEmail = res.maskedEmail || '';

        this.success.set(res.message);

        this.forgotStep.set(2);

        this.startCountdown(res.expiresInSeconds || 600);

      },

      error: (err) => {

        this.loading.set(false);

        this.error.set(err?.error?.message || 'Impossible d\'envoyer le code');

      }

    });

  }



  verifyOtp(): void {

    if (!/^\d{6}$/.test(this.otp)) {

      this.error.set('Le code OTP doit contenir 6 chiffres');

      return;

    }

    this.loading.set(true);

    this.error.set('');

    this.auth.verifyOtp(this.forgotUsername.trim(), this.otp).subscribe({

      next: (res) => {

        this.loading.set(false);

        this.resetToken = res.resetToken || '';

        this.success.set(res.message);

        this.forgotStep.set(3);

        this.stopCountdown();

      },

      error: (err) => {

        this.loading.set(false);

        this.error.set(err?.error?.message || 'Code OTP invalide');

      }

    });

  }



  resetPassword(): void {

    if (this.newPassword.length < 6) {

      this.error.set('Le mot de passe doit contenir au moins 6 caractères');

      return;

    }

    if (this.newPassword !== this.confirmPassword) {

      this.error.set('Les mots de passe ne correspondent pas');

      return;

    }

    this.loading.set(true);

    this.error.set('');

    this.auth.resetPassword(this.forgotUsername.trim(), this.resetToken, this.newPassword).subscribe({

      next: (res) => {

        this.loading.set(false);

        this.success.set(res.message);

        this.username = this.forgotUsername;

        this.password = '';

        setTimeout(() => this.backToLogin(), 2000);

      },

      error: (err) => {

        this.loading.set(false);

        this.error.set(err?.error?.message || 'Erreur lors de la réinitialisation');

      }

    });

  }



  resendOtp(): void {

    if (this.otpCountdown() > 0) return;

    this.requestOtp();

  }



  formatCountdown(): string {

    const s = this.otpCountdown();

    const m = Math.floor(s / 60);

    const r = s % 60;

    return `${m}:${r.toString().padStart(2, '0')}`;

  }



  private startCountdown(seconds: number): void {

    this.stopCountdown();

    this.otpCountdown.set(seconds);

    this.countdownTimer = setInterval(() => {

      const next = this.otpCountdown() - 1;

      this.otpCountdown.set(Math.max(0, next));

      if (next <= 0) this.stopCountdown();

    }, 1000);

  }



  private stopCountdown(): void {

    if (this.countdownTimer) {

      clearInterval(this.countdownTimer);

      this.countdownTimer = undefined;

    }

    this.otpCountdown.set(0);

  }

}

