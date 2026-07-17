import { DatePipe } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Restitution } from '../../../core/models/models';
import { FcfaPipe } from '../../pipes/fcfa.pipe';

@Component({
  selector: 'app-restitution-receipt',
  standalone: true,
  imports: [FcfaPipe, DatePipe],
  templateUrl: './restitution-receipt.component.html',
  styleUrl: './restitution-receipt.component.scss'
})
export class RestitutionReceiptComponent {
  @Input({ required: true }) restitution!: Restitution;

  @ViewChild('receiptRoot') receiptRoot?: ElementRef<HTMLElement>;

  exemplaires: Array<'client' | 'agence'> = ['client', 'agence'];

  labelExemplaire(ex: 'client' | 'agence'): string {
    return ex === 'client' ? 'Exemplaire client' : 'Exemplaire agence';
  }

  print(): void {
    const el = this.receiptRoot?.nativeElement;
    if (!el) return;
    RestitutionReceiptComponent.printElement(el, `Reçu ${this.restitution.numeroRecu || ''}`);
  }

  static printElement(el: HTMLElement, title = 'Reçu de restitution'): void {
    const win = window.open('', '_blank', 'width=900,height=1100');
    if (!win) return;

    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
      <style>
        @page { size: A4; margin: 8mm; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; background: #fff; }
        .receipt-sheet { width: 100%; }
        .receipt-slip {
          height: 132mm;
          padding: 8mm 10mm;
          border: 1.5px solid #0b1f3a;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .receipt-slip + .receipt-slip { margin-top: 6mm; }
        .receipt-cut {
          margin: 3mm 0;
          border: none;
          border-top: 1.5px dashed #94a3b8;
          position: relative;
        }
        .receipt-cut::after {
          content: "✂ Découper";
          position: absolute;
          top: -0.55rem;
          left: 50%;
          transform: translateX(-50%);
          background: #fff;
          color: #64748b;
          font-size: 10px;
          padding: 0 8px;
        }
        .receipt-slip__head {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding-bottom: 0.6rem;
          border-bottom: 2px solid #0b1f3a;
          margin-bottom: 0.75rem;
        }
        .brand-name { font-size: 1.05rem; font-weight: 700; color: #0b1f3a; margin: 0; }
        .brand-sub { font-size: 0.72rem; color: #64748b; margin: 0.15rem 0 0; }
        .exemplaire {
          align-self: flex-start;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          background: #0b1f3a;
          color: #fff;
          padding: 0.25rem 0.55rem;
          border-radius: 4px;
        }
        .receipt-slip__meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.35rem 1rem;
          font-size: 0.82rem;
          margin-bottom: 0.75rem;
        }
        .receipt-slip__meta span { color: #64748b; display: block; font-size: 0.68rem; text-transform: uppercase; }
        .receipt-slip__meta strong { font-weight: 600; }
        .amounts {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 0.55rem 0.75rem;
          margin-bottom: 0.75rem;
        }
        .amounts row, .amounts .row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          padding: 0.2rem 0;
        }
        .amounts .row.total {
          border-top: 1px solid #cbd5e1;
          margin-top: 0.35rem;
          padding-top: 0.45rem;
          font-weight: 700;
          color: #166534;
        }
        .receipt-slip__foot {
          margin-top: auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          font-size: 0.75rem;
        }
        .sig-box {
          border: 1px dashed #cbd5e1;
          border-radius: 6px;
          min-height: 52px;
          padding: 0.35rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sig-box img { max-height: 48px; max-width: 100%; }
        .sig-label { font-size: 0.65rem; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem; }
        .agency-block { color: #475569; line-height: 1.35; }
      </style>
    </head><body>${el.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }
}
