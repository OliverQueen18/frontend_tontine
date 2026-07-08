import { Component, ElementRef, Input, OnChanges, AfterViewInit, ViewChild } from '@angular/core';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  template: `
    <div class="qr-wrap">
      @if (value) {
        <canvas #canvas></canvas>
        <p class="qr-label">{{ value }}</p>
      } @else {
        <div class="qr-empty">Code client requis</div>
      }
    </div>
  `,
  styles: [`
    .qr-wrap {
      display: grid;
      justify-items: center;
      gap: 0.5rem;
    }
    canvas {
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 8px;
      padding: 0.5rem;
      background: #fff;
    }
    .qr-label {
      margin: 0;
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      color: var(--text-muted, #64748b);
    }
    .qr-empty {
      padding: 1rem;
      color: #94a3b8;
      font-size: 0.9rem;
    }
  `]
})
export class QrCodeComponent implements OnChanges, AfterViewInit {
  @Input() value = '';
  @Input() size = 160;

  @ViewChild('canvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(): void {
    setTimeout(() => this.render(), 0);
  }

  private render(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.value) return;
    QRCode.toCanvas(canvas, this.value, {
      width: this.size,
      margin: 1,
      errorCorrectionLevel: 'M'
    }).catch(() => {});
  }
}
