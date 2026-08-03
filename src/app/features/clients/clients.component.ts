import { Component, OnInit, signal, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Agent, Client, ClientHistorique, emptyMarcheForm, Marche, MarcheFormData } from '../../core/models/models';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { PhotoCaptureComponent } from '../../shared/components/photo-capture/photo-capture.component';
import { PhoneDigitsComponent } from '../../shared/components/phone-digits/phone-digits.component';
import { ClientMembershipCardComponent } from '../../shared/components/client-membership-card/client-membership-card.component';
import { FcfaAmountInputComponent } from '../../shared/components/fcfa-amount-input/fcfa-amount-input.component';
import { OsmMapPickerComponent } from '../../shared/components/osm-map-picker/osm-map-picker.component';
import { SiteContentService } from '../../core/services/site-content.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [FormsModule, RouterLink, FcfaPipe, PhotoCaptureComponent, PhoneDigitsComponent, ClientMembershipCardComponent, OsmMapPickerComponent, FcfaAmountInputComponent, DatePipe],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent implements OnInit {
  clients = signal<Client[]>([]);
  agents = signal<Agent[]>([]);
  marches = signal<Marche[]>([]);

  q = '';
  showForm = false;
  showEdit = false;
  showHistorique = false;
  showDesactiver = false;
  showDelete = false;
  showTransfer = false;
  showCreated = false;
  showCarte = false;
  showCartesBulk = false;
  selected: Client | null = null;
  selectedIds = signal<Set<number>>(new Set());
  carteClient = signal<Client | null>(null);
  cartesBulk = signal<Client[]>([]);
  createdClient = signal<Client | null>(null);
  historique = signal<ClientHistorique[]>([]);

  form: Client = this.empty();
  editForm: Client = this.empty();
  desactiverMotif = '';
  transferAgentId: number | null = null;
  transferMotif = '';

  phoneValid = false;
  phoneSecondaireValid = true;
  /** SMS disponibles (plateforme + passerelle). */
  smsDisponible = false;
  /** L'agence envoie déjà le SMS à tous ses clients. */
  smsAgenceTous = false;

  message = signal('');

  @ViewChild('phonePrimary') phonePrimary?: PhoneDigitsComponent;
  @ViewChild('phoneSecondary') phoneSecondary?: PhoneDigitsComponent;
  @ViewChild('membershipCard') membershipCard?: ClientMembershipCardComponent;
  @ViewChild('createdMembershipCard') createdMembershipCard?: ClientMembershipCardComponent;
  @ViewChildren(ClientMembershipCardComponent) bulkMembershipCards?: QueryList<ClientMembershipCardComponent>;

  constructor(private api: ApiService, public auth: AuthService, private cms: SiteContentService) {}

  ngOnInit(): void {
    this.load();
    const agenceId = this.auth.agenceId();
    this.api.getAgents(agenceId).subscribe(a => {
      this.agents.set(a);
      if (this.isAgent) {
        this.prefillAgentContext(a);
      }
    });
    this.loadMarches();
    this.loadSmsContext();
  }

  loadSmsContext(): void {
    const agenceId = this.auth.agenceId();
    if (agenceId) {
      this.api.getAgence(agenceId).subscribe({
        next: a => {
          this.smsDisponible = !!a.smsPlateformeActive && !!a.smsGatewayReady;
          this.smsAgenceTous = !!a.smsPourTousClients;
        },
        error: () => {
          this.smsDisponible = false;
          this.smsAgenceTous = false;
        }
      });
      return;
    }
    if (this.auth.hasRole('SUPER_ADMIN')) {
      this.api.getPlatformSettings().subscribe({
        next: s => {
          this.smsDisponible = !!s.smsNotificationsEnabled && !!s.smsGatewayReady;
        },
        error: () => {
          this.smsDisponible = false;
        }
      });
    }
  }

  loadMarches(): void {
    if (this.isCollecteur && this.auth.hasRole('AGENT')) {
      this.api.getMarches().subscribe(m => this.marches.set(m));
    } else if (this.auth.agenceId()) {
      this.api.getMarches(this.auth.agenceId()).subscribe(m => this.marches.set(m));
    }
  }

  get isCollecteur(): boolean {
    return this.auth.isCollecteur();
  }

  showMarcheForm = false;
  marcheForm: MarcheFormData = emptyMarcheForm();

  openMarcheForm(): void {
    this.marcheForm = emptyMarcheForm();
    this.showMarcheForm = true;
  }

  onMarcheLocationPicked(event: { latitude: number; longitude: number; adresse?: string }): void {
    this.marcheForm.latitude = event.latitude;
    this.marcheForm.longitude = event.longitude;
    if (event.adresse) {
      this.marcheForm.adresse = event.adresse;
    }
  }

  saveMarche(): void {
    if (!this.marcheForm.nom.trim()) {
      this.message.set('Le nom du marché est obligatoire');
      return;
    }
    if (!this.marcheForm.adresse.trim()) {
      this.message.set('La localisation est obligatoire');
      return;
    }
    if (this.marcheForm.latitude == null || this.marcheForm.longitude == null) {
      this.message.set('Placez le marché sur la carte');
      return;
    }
    this.api.createMarche({
      nom: this.marcheForm.nom.trim(),
      code: this.marcheForm.code.trim() || undefined,
      description: this.marcheForm.description.trim() || undefined,
      adresse: this.marcheForm.adresse.trim(),
      latitude: this.marcheForm.latitude,
      longitude: this.marcheForm.longitude
    }).subscribe({
      next: m => {
        this.showMarcheForm = false;
        this.loadMarches();
        if (m.id) this.form.marcheId = m.id;
        this.message.set('Marché ajouté');
      },
      error: err => this.message.set(err?.error?.message || 'Erreur')
    });
  }

  get isAgent(): boolean {
    return this.auth.hasRole('AGENT');
  }

  get canCreate(): boolean {
    return this.auth.hasRole('SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT');
  }

  get canManage(): boolean {
    return this.auth.hasRole('SUPER_ADMIN') || this.auth.isCollecteur();
  }

  canDelete(c: Client): boolean {
    return !c.soldeEpargne || c.soldeEpargne <= 0;
  }

  load(): void {
    const agenceId = this.auth.hasRole('SUPER_ADMIN') ? null : this.auth.agenceId();
    const agentId = this.auth.hasRole('AGENT') ? this.currentAgent()?.id ?? null : null;
    this.api.getClients(this.q, agenceId, agentId).subscribe(c => this.clients.set(c));
  }

  openCreate(): void {
    this.form = this.empty();
    if (this.auth.agenceId()) {
      this.form.agenceId = this.auth.agenceId()!;
    }
    this.phoneValid = false;
    this.phoneSecondaireValid = true;
    this.prefillAgentContext(this.agents());
    this.showForm = true;
  }

  onPhotoChange(url: string): void {
    this.form.photoUrl = url;
  }

  previewPhoto(url?: string): string {
    if (!url) return '';
    return this.cms.resolveMediaUrl(url);
  }

  save(): void {
    this.phonePrimary?.markAsTouched();
    if (!this.phoneValid) {
      this.message.set('Le téléphone doit contenir 8 chiffres');
      return;
    }
    if (this.form.telephoneSecondaire && !this.phoneSecondaireValid) {
      this.message.set('Le téléphone secondaire doit contenir 8 chiffres');
      return;
    }
    if (!this.form.marcheId) {
      this.message.set('Le marché est obligatoire');
      return;
    }
    if (!this.form.agentId) {
      this.message.set('L\'agent collecteur est obligatoire');
      return;
    }
    if (!this.form.montantJournalier || this.form.montantJournalier < 1) {
      this.message.set('Le montant journalier doit être supérieur à 0');
      return;
    }

    this.api.createClient(this.form).subscribe({
      next: client => {
        this.showForm = false;
        this.createdClient.set(client);
        this.showCreated = true;
        this.message.set(`Client créé : ${client.code}`);
        this.load();
      },
      error: err => this.message.set(err?.error?.message || 'Erreur')
    });
  }

  closeCreated(): void {
    this.showCreated = false;
    this.createdClient.set(null);
  }

  openCarte(c: Client): void {
    this.carteClient.set(c);
    this.showCarte = true;
  }

  closeCarte(): void {
    this.showCarte = false;
    this.carteClient.set(null);
  }

  printCarte(fromCreated = false): void {
    const card = fromCreated ? this.createdMembershipCard : this.membershipCard;
    card?.print();
  }

  cartePhoto(client: Client): string {
    return this.previewPhoto(client.photoUrl);
  }

  selectionCount(): number {
    return this.selectedIds().size;
  }

  isClientSelected(c: Client): boolean {
    return !!c.id && this.selectedIds().has(c.id);
  }

  allVisibleSelected(): boolean {
    const visible = this.clients().filter(c => c.id);
    return visible.length > 0 && visible.every(c => this.selectedIds().has(c.id!));
  }

  toggleSelectClient(c: Client): void {
    if (!c.id) return;
    const next = new Set(this.selectedIds());
    if (next.has(c.id)) next.delete(c.id);
    else next.add(c.id);
    this.selectedIds.set(next);
  }

  toggleSelectAll(): void {
    const visible = this.clients().filter(c => c.id);
    if (this.allVisibleSelected()) {
      this.selectedIds.set(new Set());
      return;
    }
    this.selectedIds.set(new Set(visible.map(c => c.id!)));
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  openCartesBulk(): void {
    const selected = this.clients().filter(c => c.id && this.selectedIds().has(c.id));
    if (!selected.length) return;
    this.cartesBulk.set(selected);
    this.showCartesBulk = true;
  }

  closeCartesBulk(): void {
    this.showCartesBulk = false;
    this.cartesBulk.set([]);
  }

  printCartesBulk(): void {
    setTimeout(() => {
      const elements = this.bulkMembershipCards
        ?.map(card => card.cardRoot?.nativeElement)
        .filter((el): el is HTMLElement => !!el) ?? [];
      ClientMembershipCardComponent.printElements(
        elements,
        `${elements.length} carte(s) client`
      );
    }, 700);
  }

  openTransfer(c: Client): void {
    this.selected = c;
    this.transferAgentId = null;
    this.transferMotif = '';
    this.showTransfer = true;
  }

  transferer(): void {
    if (!this.selected?.id || !this.transferAgentId) return;
    this.api.transfererClient(this.selected.id, {
      agentId: this.transferAgentId,
      motif: this.transferMotif || 'Transfert'
    }).subscribe({
      next: () => {
        this.showTransfer = false;
        this.message.set('Client transféré');
        this.load();
      },
      error: err => this.message.set(err?.error?.message || 'Erreur')
    });
  }

  openEdit(c: Client): void {
    this.selected = c;
    this.editForm = { ...c };
    this.phoneValid = !!c.telephone && c.telephone.length === 8;
    this.phoneSecondaireValid = !c.telephoneSecondaire || c.telephoneSecondaire.length === 8;
    this.showEdit = true;
  }

  saveEdit(): void {
    if (!this.selected?.id) return;
    if (!this.editForm.telephone || this.editForm.telephone.length !== 8) {
      this.message.set('Le téléphone doit contenir 8 chiffres');
      return;
    }
    if (this.editForm.telephoneSecondaire && this.editForm.telephoneSecondaire.length !== 8) {
      this.message.set('Le téléphone secondaire doit contenir 8 chiffres');
      return;
    }
    this.api.updateClient(this.selected.id, this.editForm).subscribe({
      next: () => {
        this.showEdit = false;
        this.message.set('Client modifié');
        this.load();
      },
      error: err => this.message.set(err?.error?.message || 'Erreur')
    });
  }

  openHistorique(c: Client): void {
    this.selected = c;
    if (!c.id) return;
    this.api.getClientHistorique(c.id).subscribe(h => {
      this.historique.set(h);
      this.showHistorique = true;
    });
  }

  openDesactiver(c: Client): void {
    this.selected = c;
    this.desactiverMotif = '';
    this.showDesactiver = true;
  }

  desactiver(): void {
    if (!this.selected?.id) return;
    this.api.desactiverClient(this.selected.id, this.desactiverMotif || undefined).subscribe({
      next: () => {
        this.showDesactiver = false;
        this.message.set('Client désactivé');
        this.load();
      },
      error: err => this.message.set(err?.error?.message || 'Erreur')
    });
  }

  openDelete(c: Client): void {
    this.selected = c;
    this.showDelete = true;
  }

  supprimer(): void {
    if (!this.selected?.id) return;
    this.api.deleteClient(this.selected.id).subscribe({
      next: () => {
        this.showDelete = false;
        this.message.set('Client supprimé');
        this.load();
      },
      error: err => this.message.set(err?.error?.message || 'Erreur')
    });
  }

  historiqueLabel(h: ClientHistorique): string {
    const labels: Record<string, string> = {
      CREATION: 'Création',
      MODIFICATION: 'Modification',
      DESACTIVATION: 'Désactivation',
      SUPPRESSION: 'Suppression',
      RESTITUTION: 'Restitution',
      RESTITUTION_COMMISSION: 'Commission restitution'
    };
    return labels[h.typeAction ?? ''] ?? h.typeAction ?? '—';
  }

  private currentAgent(): Agent | undefined {
    const userId = this.auth.user()?.id;
    const username = this.auth.user()?.username;
    return this.agents().find(a =>
      (userId != null && a.utilisateurId === userId) || a.username === username
    );
  }

  private prefillAgentContext(agents: Agent[]): void {
    const agent = agents.find(a =>
      (this.auth.user()?.id != null && a.utilisateurId === this.auth.user()!.id)
      || a.username === this.auth.user()?.username
    );
    if (!agent) return;
    this.form.agentId = agent.id;
    const marcheIds = agent.marcheIds?.length ? agent.marcheIds : (agent.marcheId ? [agent.marcheId] : []);
    if (marcheIds.length === 1) {
      this.form.marcheId = marcheIds[0];
    }
  }

  private empty(): Client {
    const today = new Date().toISOString().slice(0, 10);
    return {
      nomComplet: '',
      telephone: '',
      email: '',
      personneAContacter: '',
      telephoneSecondaire: '',
      agenceId: 0,
      montantJournalier: 1000,
      fraisAdhesion: 500,
      dateAdhesion: today,
      photoUrl: '',
      smsNotificationsEnabled: this.smsAgenceTous
    };
  }
}
