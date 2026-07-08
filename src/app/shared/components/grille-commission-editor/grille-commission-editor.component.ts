import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { GrilleCommissionLigne } from '../../../core/models/models';

@Component({
  selector: 'app-grille-commission-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './grille-commission-editor.component.html',
  styleUrl: './grille-commission-editor.component.scss'
})
export class GrilleCommissionEditorComponent implements OnChanges {
  @Input({ required: true }) agenceId!: number;
  @Input() agenceNom = '';
  @Output() saved = new EventEmitter<void>();

  lignes = signal<GrilleCommissionLigne[]>([]);
  loading = signal(false);
  saving = signal(false);
  message = signal('');

  constructor(private api: ApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['agenceId'] && this.agenceId) {
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);
    this.message.set('');
    this.api.getGrilleCommission(this.agenceId).subscribe({
      next: (rows: GrilleCommissionLigne[]) => {
        this.lignes.set(rows.length ? rows : [this.emptyRow(0)]);
        this.loading.set(false);
      },
      error: (e: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.message.set(e?.error?.message || 'Impossible de charger la grille');
      }
    });
  }

  addRow(): void {
    const rows = this.lignes();
    const last = rows[rows.length - 1];
    const nextMin = last?.montantMax != null ? last.montantMax + 1 : 0;
    this.lignes.set([...rows, this.emptyRow(nextMin)]);
  }

  removeRow(index: number): void {
    const rows = [...this.lignes()];
    if (rows.length <= 1) return;
    rows.splice(index, 1);
    this.lignes.set(rows);
  }

  onMaxChange(index: number): void {
    const rows = [...this.lignes()];
    const current = rows[index];
    const next = rows[index + 1];
    if (next && current.montantMax != null) {
      next.montantMin = current.montantMax + 1;
      this.lignes.set(rows);
    }
  }

  save(): void {
    const payload = this.lignes().map((l, i) => ({
      montantMin: Number(l.montantMin) || 0,
      montantMax: l.montantMax == null || l.montantMax === ('' as unknown as number) ? null : Number(l.montantMax),
      montantCommission: Number(l.montantCommission) || 0,
      ordre: i
    }));

    if (payload.some(l => l.montantCommission <= 0)) {
      this.message.set('Chaque tranche doit avoir une commission positive');
      return;
    }

    this.saving.set(true);
    this.message.set('');
    this.api.saveGrilleCommission(this.agenceId, payload).subscribe({
      next: (rows: GrilleCommissionLigne[]) => {
        this.lignes.set(rows);
        this.saving.set(false);
        this.message.set('Grille enregistrée');
        this.saved.emit();
      },
      error: (e: { error?: { message?: string } }) => {
        this.saving.set(false);
        this.message.set(e?.error?.message || 'Erreur enregistrement');
      }
    });
  }

  isLastOpen(index: number): boolean {
    return index === this.lignes().length - 1;
  }

  private emptyRow(montantMin = 0): GrilleCommissionLigne {
    return { montantMin, montantMax: null, montantCommission: 0, ordre: 0 };
  }
}
