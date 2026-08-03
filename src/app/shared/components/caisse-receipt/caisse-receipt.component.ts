import { DatePipe } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Caisse } from '../../../core/models/models';
import { FcfaPipe } from '../../pipes/fcfa.pipe';

@Component({
  selector: 'app-caisse-receipt',
  standalone: true,
  imports: [FcfaPipe, DatePipe],
  templateUrl: './caisse-receipt.component.html',
  styleUrl: './caisse-receipt.component.scss'
})
export class CaisseReceiptComponent {
  @Input({ required: true }) caisse!: Caisse;

  @ViewChild('receiptRoot') receiptRoot?: ElementRef<HTMLElement>;

  print(): void {
    const el = this.receiptRoot?.nativeElement;
    if (!el) return;
    const date = this.caisse.dateCaisse || '';
    CaisseReceiptComponent.printElement(el, `Arrêté de caisse ${date}`);
  }

  static printElement(el: HTMLElement, title = 'Arrêté de caisse'): void {
    const win = window.open('', '_blank', 'width=900,height=1100');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
      <style>
        @page { size: A4; margin: 10mm; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; background: #fff; }
        .caisse-receipt {
          border: 1.5px solid #0b1f3a;
          border-radius: 8px;
          padding: 12mm 14mm;
        }
        .head {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #0b1f3a;
          margin-bottom: 1rem;
        }
        .brand-name { font-size: 1.2rem; font-weight: 700; color: #0b1f3a; margin: 0; }
        .brand-sub { font-size: 0.8rem; color: #64748b; margin: 0.2rem 0 0; }
        .doc-title {
          font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: #1a5632; background: #ecfdf5;
          border: 1px solid #86efac; border-radius: 999px; padding: 0.35rem 0.75rem;
          align-self: flex-start;
        }
        .meta {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.55rem 1.25rem;
          margin-bottom: 1rem; font-size: 0.85rem;
        }
        .meta span { display: block; color: #64748b; font-size: 0.72rem; }
        .kpi {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
          margin: 1rem 0; padding: 0.75rem; background: #f8fafc; border-radius: 8px;
        }
        .kpi div { display: flex; justify-content: space-between; gap: 0.75rem; font-size: 0.88rem; }
        .kpi strong { font-variant-numeric: tabular-nums; }
        .kpi .hl { grid-column: 1 / -1; padding-top: 0.35rem; border-top: 1px dashed #cbd5e1; font-weight: 700; }
        table { width: 100%; border-collapse: collapse; font-size: 0.78rem; margin-top: 0.75rem; }
        th, td { border-bottom: 1px solid #e2e8f0; padding: 0.35rem 0.4rem; text-align: left; }
        th { color: #64748b; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; }
        td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
        .sign {
          display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;
          margin-top: 1.75rem; padding-top: 1rem;
        }
        .sign p { margin: 0 0 2.5rem; font-size: 0.8rem; color: #64748b; }
        .sign .line { border-top: 1px solid #94a3b8; padding-top: 0.35rem; font-size: 0.78rem; }
        .obs { margin-top: 0.75rem; font-size: 0.82rem; }
        .warn { color: #b45309; }
      </style>
      </head><body>${el.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  }
}
