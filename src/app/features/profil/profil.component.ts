import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ChangePasswordPayload, UpdateProfilePayload, UserProfile } from '../../core/models/models';
import { PhotoCaptureComponent } from '../../shared/components/photo-capture/photo-capture.component';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [FormsModule, PhotoCaptureComponent],
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.scss'
})
export class ProfilComponent implements OnInit {
  profile = signal<UserProfile | null>(null);
  profileMessage = signal('');
  passwordMessage = signal('');
  loadingProfile = signal(false);
  loadingPassword = signal(false);

  form: UpdateProfilePayload = { nomComplet: '', email: '', telephone: '', photoUrl: '' };
  passwordForm: ChangePasswordPayload = { currentPassword: '', newPassword: '', confirmPassword: '' };

  constructor(public auth: AuthService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.auth.getProfile().subscribe({
      next: p => {
        this.profile.set(p);
        this.form = {
          nomComplet: p.nomComplet,
          email: p.email ?? '',
          telephone: p.telephone ?? '',
          photoUrl: p.photoUrl ?? ''
        };
      },
      error: e => this.profileMessage.set(e?.error?.message || 'Impossible de charger le profil')
    });
  }

  onPhotoChange(url: string): void {
    this.form.photoUrl = url;
  }

  saveProfile(): void {
    if (!this.form.nomComplet.trim()) {
      this.profileMessage.set('Le nom complet est obligatoire');
      return;
    }
    this.loadingProfile.set(true);
    this.profileMessage.set('');
    const payload: UpdateProfilePayload = {
      nomComplet: this.form.nomComplet.trim(),
      email: this.form.email?.trim() || undefined,
      telephone: this.form.telephone?.trim() || undefined,
      photoUrl: this.form.photoUrl || undefined
    };
    this.auth.updateProfile(payload).subscribe({
      next: p => {
        this.profile.set(p);
        this.loadingProfile.set(false);
        this.profileMessage.set('Profil mis à jour');
      },
      error: e => {
        this.loadingProfile.set(false);
        this.profileMessage.set(e?.error?.message || 'Erreur lors de la mise à jour');
      }
    });
  }

  changePassword(): void {
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      this.passwordMessage.set('Tous les champs sont obligatoires');
      return;
    }
    if (newPassword.length < 6) {
      this.passwordMessage.set('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      this.passwordMessage.set('Les mots de passe ne correspondent pas');
      return;
    }
    this.loadingPassword.set(true);
    this.passwordMessage.set('');
    this.auth.changePassword({ currentPassword, newPassword, confirmPassword }).subscribe({
      next: res => {
        this.loadingPassword.set(false);
        this.passwordMessage.set(res.message);
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
      },
      error: e => {
        this.loadingPassword.set(false);
        this.passwordMessage.set(e?.error?.message || 'Erreur lors du changement de mot de passe');
      }
    });
  }

  roleLabel(role?: string): string {
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super administrateur',
      ADMIN_AGENCE: 'Administrateur agence',
      AGENT: 'Agent collecteur',
      CAISSIER: 'Caissier',
      AUDITEUR: 'Auditeur'
    };
    return role ? (labels[role] ?? role) : '—';
  }
}
