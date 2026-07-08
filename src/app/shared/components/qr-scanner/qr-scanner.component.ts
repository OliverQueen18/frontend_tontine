import {
  Component,
  EventEmitter,
  OnDestroy,
  Output,
  signal,
  AfterViewInit,
  ElementRef,
  ViewChild
} from '@angular/core';
import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  template: `
    <div class="qr-scanner">
      @if (error()) {
        <div class="alert alert-info">{{ error() }}</div>
      }
      <div #readerHost [id]="readerId" class="qr-scanner__reader"></div>
      @if (scanning()) {
        <p class="qr-scanner__hint">Cadrez le QR code de la carte client</p>
      }
      <div class="qr-scanner__actions">
        <button type="button" class="btn btn-secondary btn-sm" (click)="cancel()">Annuler</button>
      </div>
    </div>
  `,
  styles: [`
    .qr-scanner {
      display: grid;
      gap: 0.75rem;
    }
    .qr-scanner__reader {
      width: 100%;
      min-height: 280px;
      border-radius: 12px;
      overflow: hidden;
      background: #0f172a;
    }
    .qr-scanner__reader video {
      border-radius: 12px;
    }
    .qr-scanner__hint {
      margin: 0;
      text-align: center;
      font-size: 0.88rem;
      color: #64748b;
    }
    .qr-scanner__actions {
      display: flex;
      justify-content: center;
    }
  `]
})
export class QrScannerComponent implements AfterViewInit, OnDestroy {
  readonly readerId = `qr-reader-${Math.random().toString(36).slice(2, 9)}`;

  @Output() scanned = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('readerHost') readerHost?: ElementRef<HTMLElement>;

  scanning = signal(false);
  error = signal('');

  private scanner?: Html5Qrcode;
  private started = false;

  ngAfterViewInit(): void {
    setTimeout(() => this.start(), 100);
  }

  ngOnDestroy(): void {
    this.stop();
  }

  cancel(): void {
    this.stop();
    this.cancelled.emit();
  }

  private async start(): Promise<void> {
    if (!this.readerHost?.nativeElement) return;

    try {
      this.scanner = new Html5Qrcode(this.readerId);
      await this.scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => this.onDecoded(decoded),
        () => {}
      );
      this.started = true;
      this.scanning.set(true);
    } catch {
      this.error.set('Caméra indisponible. Autorisez l\'accès ou utilisez la recherche par code.');
      this.scanning.set(false);
    }
  }

  private onDecoded(value: string): void {
    const code = value.trim();
    if (!code) return;
    this.stop();
    this.scanned.emit(code);
  }

  private stop(): void {
    if (!this.scanner || !this.started) return;
    this.scanner.stop().then(() => this.scanner?.clear()).catch(() => {});
    this.started = false;
    this.scanning.set(false);
  }
}
