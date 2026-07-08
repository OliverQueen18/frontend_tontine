import { DatePipe } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Client } from '../../../core/models/models';
import { FcfaPipe } from '../../pipes/fcfa.pipe';
import { QrCodeComponent } from '../qr-code/qr-code.component';

@Component({
  selector: 'app-client-membership-card',
  standalone: true,
  imports: [QrCodeComponent, FcfaPipe, DatePipe],
  templateUrl: './client-membership-card.component.html',
  styleUrl: './client-membership-card.component.scss'
})
export class ClientMembershipCardComponent {
  @Input({ required: true }) client!: Client;
  @Input() photoSrc = '';

  @ViewChild('cardRoot') cardRoot?: ElementRef<HTMLElement>;

  agenceAdresse(): string {
    const parts = [this.client.agenceAdresse, this.client.agenceVille].filter(Boolean);
    return parts.join(', ');
  }

  print(): void {
    const el = this.cardRoot?.nativeElement;
    if (!el) return;
    ClientMembershipCardComponent.printElements([el], 'Carte client');
  }

  static printElements(elements: HTMLElement[], title = 'Cartes clients'): void {
    if (!elements.length) return;

    const win = window.open('', '_blank', 'width=900,height=720');
    if (!win) return;

    const cardsHtml = elements.map(el => {
      const canvas = el.querySelector('canvas');
      const canvasData = canvas?.toDataURL('image/png') ?? '';
      let html = el.outerHTML;
      if (canvas && canvasData) {
        html = html.replace(canvas.outerHTML, `<img src="${canvasData}" alt="QR" style="width:140px;height:140px" />`);
      }
      return `<div class="print-page">${html}</div>`;
    }).join('');

    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
      <style>
        body{margin:0;padding:1rem;font-family:Inter,Arial,sans-serif;background:#fff}
        .print-page{page-break-after:always;margin-bottom:1.5rem}
        .print-page:last-child{page-break-after:auto}
        .membership-card{width:400px;margin:0 auto;border-radius:18px;overflow:hidden;border:2px solid #0b1f3a;background:#fff}
        .membership-card__header{display:flex;justify-content:space-between;padding:1rem;background:#0b1f3a;color:#fff}
        .membership-card__brand{display:flex;gap:.65rem;align-items:center}
        .membership-card__brand-icon{width:2.4rem;height:2.4rem;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.12)}
        .membership-card__agence{text-align:right}.label{font-size:.68rem;text-transform:uppercase;opacity:.75;display:block}
        .membership-card__identity{display:grid;grid-template-columns:88px 1fr;gap:.85rem;padding:1rem}
        .membership-card__photo{width:88px;height:88px;border-radius:14px;overflow:hidden;border:2px solid #e2e8f0}
        .membership-card__photo img{width:100%;height:100%;object-fit:cover}
        .membership-card__client h2{margin:0 0 .5rem;font-size:1.05rem;color:#0b1f3a}
        .membership-card__client dl{margin:0;font-size:.8rem}
        .membership-card__client div{display:grid;grid-template-columns:auto 1fr;gap:.45rem}
        .membership-card__meta{padding:.65rem 1rem;border-top:1px dashed #cbd5e1}
        .membership-card__agent{padding:.55rem;border-radius:10px;background:#f0fdf4;border:1px solid #bbf7d0;margin-bottom:.5rem}
        .membership-card__qr{padding:.75rem 1rem;text-align:center;border-top:1px solid #e2e8f0}
        .membership-card__hint{font-size:.75rem;color:#64748b}
        @page{margin:10mm}
      </style></head><body>${cardsHtml}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  }
}
