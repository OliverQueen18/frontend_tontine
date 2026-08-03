import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Agence, AppUser, RolePermission, RoleType, StatutEntity } from '../../core/models/models';

const ALL_ROLES: RoleType[] = ['SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT', 'CAISSIER', 'AUDITEUR'];
const ADMIN_ROLES: RoleType[] = ['ADMIN_AGENCE', 'AGENT', 'CAISSIER', 'AUDITEUR'];

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './utilisateurs.component.html',
  styleUrl: './utilisateurs.component.scss'
})
export class UtilisateursComponent implements OnInit {
  users = signal<AppUser[]>([]);
  agences = signal<Agence[]>([]);
  rolePermissions = signal<RolePermission[]>([]);
  assignableRoles = signal<RoleType[]>([]);

  filterAgenceId: number | null = null;
  filterRole: RoleType | '' = '';
  showForm = false;
  editingId: number | null = null;
  message = signal('');

  form: AppUser = this.emptyForm();
  readonly statuts: StatutEntity[] = ['ACTIF', 'INACTIF', 'SUSPENDU'];

  readonly roles = computed(() =>
    this.auth.hasRole('SUPER_ADMIN') ? ALL_ROLES : this.assignableRoles()
  );

  constructor(private api: ApiService, public auth: AuthService) {}

  get isSuperAdmin(): boolean {
    return this.auth.hasRole('SUPER_ADMIN');
  }

  get isAdminAgence(): boolean {
    return this.auth.hasRole('ADMIN_AGENCE');
  }

  get pageTitle(): string {
    return this.isAdminAgence && !this.isSuperAdmin ? 'Équipe de l\'agence' : 'Utilisateurs & rôles';
  }

  ngOnInit(): void {
    if (this.isSuperAdmin) {
      this.api.getAgences().subscribe(a => this.agences.set(a.filter(x => x.statut === 'ACTIF')));
    } else if (this.isAdminAgence) {
      this.filterAgenceId = this.auth.agenceId();
      const nom = this.auth.user()?.agenceNom;
      if (this.filterAgenceId && nom) {
        this.agences.set([{ id: this.filterAgenceId, nom }]);
      }
    }

    this.api.getRolePermissions().subscribe(r => {
      this.rolePermissions.set(r.roles);
      if (r.assignableRoles?.length) {
        this.assignableRoles.set(r.assignableRoles as RoleType[]);
      } else if (this.isAdminAgence) {
        this.assignableRoles.set(ADMIN_ROLES);
      }
    });

    this.load();
  }

  load(): void {
    const agenceId = this.isSuperAdmin ? (this.filterAgenceId || null) : this.auth.agenceId();
    this.api.getUtilisateurs(agenceId, this.filterRole || null).subscribe({
      next: u => this.users.set(u),
      error: e => this.message.set(e?.error?.message || 'Erreur chargement')
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    if (this.isAdminAgence) {
      this.form.agenceId = this.auth.agenceId();
      this.form.role = 'AGENT';
    }
    this.showForm = true;
  }

  openEdit(u: AppUser): void {
    this.editingId = u.id ?? null;
    this.form = {
      username: u.username,
      nomComplet: u.nomComplet,
      email: u.email ?? '',
      telephone: u.telephone ?? '',
      photoUrl: u.photoUrl ?? '',
      role: u.role,
      agenceId: u.agenceId ?? null,
      statut: u.statut ?? 'ACTIF',
      password: ''
    };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingId = null;
  }

  needsAgence(role: RoleType): boolean {
    return role !== 'SUPER_ADMIN';
  }

  canDeactivate(u: AppUser): boolean {
    if (u.statut !== 'ACTIF' || u.role === 'SUPER_ADMIN') return false;
    if (u.id === this.auth.user()?.id) return false;
    return true;
  }

  save(): void {
    if (!this.form.nomComplet.trim()) {
      this.message.set('Le nom complet est obligatoire');
      return;
    }
    if (!this.editingId && !this.form.username.trim()) {
      this.message.set("L'identifiant est obligatoire");
      return;
    }
    if (!this.editingId && (!this.form.password || this.form.password.length < 6)) {
      this.message.set('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    const agenceId = this.isAdminAgence
      ? this.auth.agenceId()
      : (this.needsAgence(this.form.role) ? this.form.agenceId : null);

    if (this.needsAgence(this.form.role) && !agenceId) {
      this.message.set("L'agence est obligatoire pour ce rôle");
      return;
    }

    const payload = {
      nomComplet: this.form.nomComplet.trim(),
      email: this.form.email?.trim() || undefined,
      telephone: this.form.telephone?.trim() || undefined,
      photoUrl: this.form.photoUrl?.trim() || undefined,
      role: this.form.role,
      agenceId: this.needsAgence(this.form.role) ? agenceId : null,
      statut: this.form.statut ?? 'ACTIF',
      password: this.form.password?.trim() || undefined
    };

    const req = this.editingId
      ? this.api.updateUtilisateur(this.editingId, payload)
      : this.api.createUtilisateur({ ...payload, username: this.form.username.trim(), password: this.form.password! });

    req.subscribe({
      next: () => {
        this.closeForm();
        this.message.set(this.editingId ? 'Utilisateur mis à jour' : 'Utilisateur créé');
        this.load();
      },
      error: e => this.message.set(e?.error?.message || 'Erreur')
    });
  }

  desactiver(u: AppUser): void {
    if (!u.id || !this.canDeactivate(u)) return;
    if (!confirm(`Retirer l'utilisateur « ${u.nomComplet} » de l'agence ?`)) return;
    this.api.desactiverUtilisateur(u.id).subscribe({
      next: () => {
        this.message.set('Utilisateur désactivé');
        this.load();
      },
      error: e => this.message.set(e?.error?.message || 'Erreur')
    });
  }

  roleLabel(role: RoleType): string {
    const map: Record<RoleType, string> = {
      SUPER_ADMIN: 'Super admin',
      ADMIN_AGENCE: 'Admin agence',
      AGENT: 'Agent',
      CAISSIER: 'Caissier',
      AUDITEUR: 'Auditeur'
    };
    return map[role] ?? role;
  }

  statutClass(statut?: StatutEntity): string {
    return statut === 'ACTIF' ? 'badge-success' : 'badge-danger';
  }

  private emptyForm(): AppUser {
    return {
      username: '',
      nomComplet: '',
      email: '',
      telephone: '',
      role: 'AGENT',
      agenceId: null,
      statut: 'ACTIF',
      password: ''
    };
  }
}
