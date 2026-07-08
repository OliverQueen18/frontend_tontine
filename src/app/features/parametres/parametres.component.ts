import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { SiteContentService } from '../../core/services/site-content.service';
import { environment } from '../../../environments/environment';
import { Agence, PlatformSettings } from '../../core/models/models';
import { GrilleCommissionEditorComponent } from '../../shared/components/grille-commission-editor/grille-commission-editor.component';
import { OsmMapPickerComponent } from '../../shared/components/osm-map-picker/osm-map-picker.component';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [FormsModule, GrilleCommissionEditorComponent, OsmMapPickerComponent],
  templateUrl: './parametres.component.html',
  styleUrl: './parametres.component.scss'
})
export class ParametresComponent implements OnInit {
  version = environment.appVersion;
  agenceId: number | null = null;
  agenceNom = '';
  agenceForm: Agence | null = null;
  agenceMessage = signal('');
  savingAgence = signal(false);
  logoPreview = '';
  platformSettings: PlatformSettings | null = null;
  platformCommissionAdminPercent = 5;
  platformMessage = signal('');

  constructor(
    public auth: AuthService,
    private api: ApiService,
    private cms: SiteContentService
  ) {}

  ngOnInit(): void {
    this.agenceId = this.auth.agenceId();
    this.agenceNom = this.auth.user()?.agenceNom ?? '';
    if (this.canManageAgence && this.agenceId) {
      this.loadAgence();
    }
    if (this.auth.hasRole('SUPER_ADMIN')) {
      this.loadPlatformSettings();
    }
  }

  get isSuperAdmin(): boolean {
    return this.auth.hasRole('SUPER_ADMIN');
  }

  get canManageAgence(): boolean {
    return this.auth.hasRole('ADMIN_AGENCE') && !!this.auth.agenceId();
  }

  get canEditGrille(): boolean {
    return this.auth.hasRole('ADMIN_AGENCE', 'SUPER_ADMIN') && !!this.agenceId;
  }

  get mapAddress(): string {
    if (!this.agenceForm) return '';
    return [this.agenceForm.ville, this.agenceForm.adresse].filter(v => v?.trim()).join(', ');
  }

  loadAgence(): void {
    if (!this.agenceId) return;
    this.api.getAgence(this.agenceId).subscribe({
      next: a => {
        this.agenceForm = {
          ...a,
          latitude: a.latitude ?? null,
          longitude: a.longitude ?? null
        };
        this.agenceNom = a.nom;
        this.logoPreview = a.logoUrl ? this.cms.resolveMediaUrl(a.logoUrl) : '';
      },
      error: e => this.agenceMessage.set(e?.error?.message || 'Impossible de charger l\'agence')
    });
  }

  saveAgence(): void {
    if (!this.agenceId || !this.agenceForm?.nom?.trim()) {
      this.agenceMessage.set('Le nom de l\'agence est obligatoire');
      return;
    }
    if (this.agenceForm.latitude == null || this.agenceForm.longitude == null) {
      this.agenceMessage.set('Positionnez l\'agence sur la carte');
      return;
    }
    this.savingAgence.set(true);
    this.agenceMessage.set('');
    this.api.updateAgence(this.agenceId, this.agenceForm).subscribe({
      next: a => {
        this.agenceForm = { ...a };
        this.agenceNom = a.nom;
        this.savingAgence.set(false);
        this.agenceMessage.set('Agence mise à jour');
      },
      error: e => {
        this.savingAgence.set(false);
        this.agenceMessage.set(e?.error?.message || 'Erreur');
      }
    });
  }

  onLocationPicked(event: { latitude: number; longitude: number; adresse?: string }): void {
    if (!this.agenceForm) return;
    this.agenceForm.latitude = event.latitude;
    this.agenceForm.longitude = event.longitude;
    if (event.adresse && !this.agenceForm.adresse?.trim()) {
      this.agenceForm.adresse = event.adresse;
    }
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.agenceForm) return;
    this.api.uploadPublicMedia(file).subscribe({
      next: res => {
        this.agenceForm!.logoUrl = res.url;
        this.logoPreview = this.cms.resolveMediaUrl(res.url);
      },
      error: e => this.agenceMessage.set(e?.error?.message || 'Erreur upload logo')
    });
  }

  loadPlatformSettings(): void {
    this.api.getPlatformSettings().subscribe({
      next: s => {
        this.platformSettings = { ...s };
        this.platformCommissionAdminPercent = this.toPercent(s.tauxCommissionAdminDefaut ?? 0.05);
      },
      error: e => this.platformMessage.set(e?.error?.message || 'Erreur chargement paramètres')
    });
  }

  savePlatformSettings(): void {
    if (!this.platformSettings) return;
    if (this.platformCommissionAdminPercent < 0 || this.platformCommissionAdminPercent > 100) {
      this.platformMessage.set('Le taux de commission admin doit être entre 0 et 100 %');
      return;
    }
    this.platformSettings.tauxCommissionAdminDefaut = this.platformCommissionAdminPercent / 100;
    this.api.updatePlatformSettings(this.platformSettings).subscribe({
      next: s => {
        this.platformSettings = { ...s };
        this.platformMessage.set('Paramètres plateforme enregistrés');
      },
      error: e => this.platformMessage.set(e?.error?.message || 'Erreur')
    });
  }

  private toPercent(rate: number): number {
    return Math.round(rate * 10000) / 100;
  }
}
