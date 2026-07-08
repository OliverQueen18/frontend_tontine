import { Injectable, computed, signal } from '@angular/core';
import { TOUR_STEPS, TourStep } from '../data/tour-steps';

@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly _steps = signal<TourStep[]>([]);
  private context = 'app';

  readonly index = signal(0);
  readonly active = signal(false);

  readonly steps = this._steps.asReadonly();
  readonly total = computed(() => this._steps().length);
  readonly current = computed(() => this._steps()[this.index()] ?? null);
  readonly isFirst = computed(() => this.index() === 0);
  readonly isLast = computed(() => this.index() === this.total() - 1);

  hasSeen(context: string): boolean {
    try {
      return localStorage.getItem(this.storageKey(context)) === '1';
    } catch {
      return false;
    }
  }

  /**
   * Démarre le didacticiel pour un contexte donné.
   * Les étapes ciblant un élément absent du DOM (menu filtré par rôle) sont ignorées.
   */
  start(context: string): void {
    const all = TOUR_STEPS[context] ?? [];
    const steps = all.filter(s => !s.target || !!document.querySelector(s.target));
    if (!steps.length) return;
    this.context = context;
    this._steps.set(steps);
    this.index.set(0);
    this.active.set(true);
  }

  next(): void {
    if (this.index() < this.total() - 1) {
      this.index.update(i => i + 1);
    } else {
      this.finish();
    }
  }

  prev(): void {
    if (this.index() > 0) {
      this.index.update(i => i - 1);
    }
  }

  goTo(i: number): void {
    if (i >= 0 && i < this.total()) {
      this.index.set(i);
    }
  }

  skip(): void {
    this.finish();
  }

  finish(): void {
    this.markSeen(this.context);
    this.active.set(false);
    this._steps.set([]);
    this.index.set(0);
  }

  private markSeen(context: string): void {
    try {
      localStorage.setItem(this.storageKey(context), '1');
    } catch {
      /* ignore */
    }
  }

  private storageKey(context: string): string {
    return `tm_tour_seen_${context}`;
  }
}
