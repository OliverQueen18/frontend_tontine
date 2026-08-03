import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SiteContentService } from '../../../core/services/site-content.service';
import { InscriptionCollecteurConfig, MoyenPaiementMobile } from '../../../core/models/models';
import { FcfaPipe } from '../../../shared/pipes/fcfa.pipe';
import { OsmMapPickerComponent } from '../../../shared/components/osm-map-picker/osm-map-picker.component';

@Component({
  selector: 'app-devenez-collecteur',
  standalone: true,
  imports: [FormsModule, FcfaPipe, OsmMapPickerComponent],
  templateUrl: './devenez-collecteur.component.html',
  styleUrl: './devenez-collecteur.component.scss'
})
export class DevenezCollecteurComponent implements OnInit {
  readonly content = computed(() => this.cms.section('collecteur'));

  config = signal<InscriptionCollecteurConfig | null>(null);
  conditionsText = computed(() => this.config()?.conditionsUtilisation || this.content().conditionsUtilisation);

  form = {
    agenceNom: '',
    responsable: '',
    agenceTelephone: '',
    agenceEmail: '',
    adresse: '',
    ville: '',
    latitude: null as number | null,
    longitude: null as number | null,
    logoUrl: '',
    username: '',
    password: '',
    confirmPassword: '',
    nomComplet: '',
    email: '',
    telephone: '',
    pieceIdentiteUrl: '',
    moyenPaiement: 'ORANGE_MONEY' as MoyenPaiementMobile,
    referencePaiement: '',
    accepteConditions: false
  };

  otpCode = '';
  verificationToken = '';
  emailVerified = signal(false);
  otpSent = signal(false);
  otpMasked = '';
  sendingOtp = signal(false);
  verifyingOtp = signal(false);
  phoneCopied = signal(false);

  logoPreview = '';
  idDocName = '';
  uploading = signal(false);
  uploadingDoc = signal(false);
  submitting = signal(false);
  message = signal('');
  error = signal('');
  success = signal(false);

  constructor(
    public cms: SiteContentService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.cms.load().subscribe();
    this.api.getInscriptionCollecteurConfig().subscribe({
      next: c => this.config.set(c),
      error: () => this.config.set({
        fraisCreationAgence: 50000,
        telephonePaiementMobile: '',
        conditionsUtilisation: this.content().conditionsUtilisation
      })
    });
  }

  get mapAddress(): string {
    return [this.form.ville, this.form.adresse].filter(v => v?.trim()).join(', ');
  }

  stepAgenceDone(): boolean {
    return !!this.form.agenceNom.trim() && this.form.latitude != null && this.form.longitude != null;
  }

  stepAdminDone(): boolean {
    return !!this.form.nomComplet.trim()
      && !!this.form.username.trim()
      && this.emailVerified()
      && this.form.password.length >= 6
      && this.form.password === this.form.confirmPassword;
  }

  stepDocsDone(): boolean {
    return !!this.form.pieceIdentiteUrl && !!this.form.referencePaiement.trim();
  }

  canSubmit(): boolean {
    return this.stepAgenceDone()
      && this.stepAdminDone()
      && this.stepDocsDone()
      && this.form.accepteConditions;
  }

  selectPayment(moyen: MoyenPaiementMobile): void {
    this.form.moyenPaiement = moyen;
  }

  copyPayPhone(phone: string): void {
    navigator.clipboard?.writeText(phone).then(() => {
      this.phoneCopied.set(true);
      setTimeout(() => this.phoneCopied.set(false), 2000);
    });
  }

  onLocationPicked(event: { latitude: number; longitude: number; adresse?: string }): void {
    this.form.latitude = event.latitude;
    this.form.longitude = event.longitude;
    if (event.adresse && !this.form.adresse?.trim()) {
      this.form.adresse = event.adresse;
    }
  }

  envoyerOtp(): void {
    const email = this.form.email.trim();
    if (!email) {
      this.error.set('Saisissez votre e-mail pour recevoir le code OTP.');
      return;
    }
    this.error.set('');
    this.sendingOtp.set(true);
    this.api.envoyerOtpInscription(email, this.form.nomComplet, this.form.telephone).subscribe({
      next: res => {
        this.sendingOtp.set(false);
        this.otpSent.set(true);
        const parts = [res.maskedEmail || email];
        if (res.smsSent && res.maskedPhone) {
          parts.push(res.maskedPhone);
        }
        this.otpMasked = parts.join(' / ');
        this.emailVerified.set(false);
        this.verificationToken = '';
      },
      error: err => {
        this.sendingOtp.set(false);
        this.error.set(err?.error?.message || 'Erreur envoi OTP');
      }
    });
  }

  verifierOtp(): void {
    if (!this.otpCode.trim()) {
      this.error.set('Saisissez le code reçu par e-mail.');
      return;
    }
    this.error.set('');
    this.verifyingOtp.set(true);
    this.api.verifierOtpInscription(this.form.email.trim(), this.otpCode.trim()).subscribe({
      next: res => {
        this.verifyingOtp.set(false);
        this.verificationToken = res.resetToken || '';
        this.emailVerified.set(!!this.verificationToken);
        this.message.set('E-mail vérifié. Vous pouvez finaliser votre demande.');
      },
      error: err => {
        this.verifyingOtp.set(false);
        this.error.set(err?.error?.message || 'Code OTP invalide');
      }
    });
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.error.set('');
    this.api.uploadPublicMedia(file).subscribe({
      next: res => {
        this.form.logoUrl = res.url;
        this.logoPreview = this.cms.resolveMediaUrl(res.url);
        this.uploading.set(false);
      },
      error: err => {
        this.uploading.set(false);
        this.error.set(err?.error?.message || 'Erreur logo');
      }
    });
  }

  onIdDocSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingDoc.set(true);
    this.error.set('');
    this.api.uploadPublicDocument(file).subscribe({
      next: res => {
        this.form.pieceIdentiteUrl = res.url;
        this.idDocName = file.name;
        this.uploadingDoc.set(false);
      },
      error: err => {
        this.uploadingDoc.set(false);
        this.error.set(err?.error?.message || 'Erreur pièce d\'identité');
      }
    });
  }

  submit(): void {
    this.error.set('');
    this.message.set('');

    if (!this.emailVerified()) {
      this.error.set('Vérifiez votre e-mail avec le code OTP avant de soumettre.');
      return;
    }
    if (!this.form.agenceNom.trim() || !this.form.username.trim() || !this.form.nomComplet.trim() || !this.form.email.trim()) {
      this.error.set('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (this.form.latitude == null || this.form.longitude == null) {
      this.error.set('Positionnez votre agence sur la carte.');
      return;
    }
    if (!this.form.pieceIdentiteUrl) {
      this.error.set('Joignez une pièce d\'identité.');
      return;
    }
    if (!this.form.referencePaiement.trim()) {
      this.error.set('Indiquez la référence de votre paiement mobile.');
      return;
    }
    if (!this.form.accepteConditions) {
      this.error.set('Vous devez accepter les conditions d\'utilisation.');
      return;
    }
    if (this.form.password.length < 6) {
      this.error.set('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (this.form.password !== this.form.confirmPassword) {
      this.error.set('Les mots de passe ne correspondent pas.');
      return;
    }

    this.submitting.set(true);
    this.api.soumettreInscriptionCollecteur({
      ...this.form,
      agenceNom: this.form.agenceNom.trim(),
      username: this.form.username.trim(),
      nomComplet: this.form.nomComplet.trim(),
      email: this.form.email.trim(),
      referencePaiement: this.form.referencePaiement.trim(),
      verificationToken: this.verificationToken,
      logoUrl: this.form.logoUrl || undefined,
      latitude: this.form.latitude,
      longitude: this.form.longitude
    }).subscribe({
      next: res => {
        this.submitting.set(false);
        this.success.set(true);
        this.message.set(res.message);
      },
      error: err => {
        this.submitting.set(false);
        this.error.set(err?.error?.message || 'Erreur lors de la soumission');
      }
    });
  }
}
