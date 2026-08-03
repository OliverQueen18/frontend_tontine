import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { SiteContentService } from '../../../core/services/site-content.service';
import { formatUploadError } from '../../../core/utils/upload-error.util';

@Component({
  selector: 'app-photo-capture',
  standalone: true,
  template: `
    <div class="photo-capture">
      <div class="photo-preview">
        @if (preview()) {
          <img [src]="preview()!" alt="Photo" />
        } @else {
          <div class="photo-placeholder"><i class="pi pi-user"></i></div>
        }
      </div>
      <div class="photo-actions">
        <label class="btn btn-secondary btn-sm" [class.disabled]="uploading()">
          <i class="pi pi-image"></i> {{ uploading() ? 'Envoi…' : 'Choisir' }}
          <input type="file" accept="image/*" hidden (change)="onFileSelected($event)" [disabled]="uploading()" />
        </label>
        @if (cameraSupported()) {
          @if (!cameraActive()) {
            <button type="button" class="btn btn-secondary btn-sm" (click)="startCamera()" [disabled]="uploading()">
              <i class="pi pi-camera"></i> Capturer
            </button>
          } @else {
            <button type="button" class="btn btn-primary btn-sm" (click)="capturePhoto()">
              <i class="pi pi-check"></i> Prendre la photo
            </button>
            <button type="button" class="btn btn-secondary btn-sm" (click)="stopCamera()">Annuler</button>
          }
        }
        @if (preview()) {
          <button type="button" class="btn btn-danger btn-sm" (click)="clearPhoto()" [disabled]="uploading()">Supprimer</button>
        }
      </div>
      @if (uploading()) {
        <small class="upload-hint"><i class="pi pi-spin pi-spinner"></i> Téléversement de la photo…</small>
      }
      @if (error()) {
        <div class="error-hint" role="alert">{{ error() }}</div>
      }
      <small class="size-hint">Taille max. : 15 Mo (compressée automatiquement avant envoi)</small>
      @if (cameraActive()) {
        <video #videoEl autoplay playsinline muted class="camera-feed"></video>
      }
      <canvas #canvasEl hidden></canvas>
    </div>
  `,
  styles: [`
    .photo-capture { display: grid; gap: 0.75rem; }
    .photo-preview {
      width: 120px;
      height: 120px;
      border-radius: 12px;
      overflow: hidden;
      border: 2px dashed var(--border, #e2e8f0);
      background: #f8fafc;
    }
    .photo-preview img { width: 100%; height: 100%; object-fit: cover; }
    .photo-placeholder {
      width: 100%; height: 100%;
      display: grid; place-items: center;
      color: #94a3b8; font-size: 2rem;
    }
    .photo-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .camera-feed {
      width: 100%;
      max-width: 320px;
      border-radius: 10px;
      background: #000;
    }
    .upload-hint { color: #64748b; }
    .size-hint { color: #94a3b8; font-size: 0.75rem; }
    .error-hint {
      color: #b91c1c;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 0.5rem 0.65rem;
      font-size: 0.85rem;
      line-height: 1.35;
    }
    .disabled { opacity: 0.6; pointer-events: none; }
  `]
})
export class PhotoCaptureComponent {
  private api = inject(ApiService);
  private cms = inject(SiteContentService);

  @Input() set photoUrl(value: string | undefined) {
    if (value?.startsWith('data:')) {
      this.preview.set(value);
    } else if (value) {
      this.preview.set(this.cms.resolveMediaUrl(value));
    } else {
      this.preview.set(null);
    }
    this.storedUrl = value?.startsWith('data:') ? '' : (value ?? '');
  }
  @Output() photoUrlChange = new EventEmitter<string>();

  preview = signal<string | null>(null);
  uploading = signal(false);
  error = signal('');
  cameraActive = signal(false);
  cameraSupported = signal(typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia);

  private stream: MediaStream | null = null;
  private storedUrl = '';

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadFile(file);
    (event.target as HTMLInputElement).value = '';
  }

  async startCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }, audio: false
      });
      this.cameraActive.set(true);
      setTimeout(() => this.attachStream(), 50);
    } catch {
      this.cameraSupported.set(false);
    }
  }

  capturePhoto(): void {
    const video = document.querySelector('.camera-feed') as HTMLVideoElement | null;
    const canvas = document.querySelector('app-photo-capture canvas') as HTMLCanvasElement | null;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      this.uploadFile(new File([blob], 'capture.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.85);
    this.stopCamera();
  }

  stopCamera(): void {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    this.cameraActive.set(false);
  }

  clearPhoto(): void {
    this.preview.set(null);
    this.storedUrl = '';
    this.photoUrlChange.emit('');
    this.stopCamera();
  }

  private uploadFile(file: File): void {
    this.uploading.set(true);
    this.error.set('');
    this.api.uploadPublicMedia(file).subscribe({
      next: res => {
        this.storedUrl = res.url;
        this.preview.set(this.cms.resolveMediaUrl(res.url));
        this.photoUrlChange.emit(res.url);
        this.uploading.set(false);
      },
      error: err => {
        this.uploading.set(false);
        this.error.set(formatUploadError(err, 'Erreur lors du téléversement de la photo'));
      }
    });
  }

  private attachStream(): void {
    const video = document.querySelector('.camera-feed') as HTMLVideoElement | null;
    if (video && this.stream) {
      video.srcObject = this.stream;
    }
  }
}
