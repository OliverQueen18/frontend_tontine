import {
  AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild
} from '@angular/core';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  template: `
    <div class="signature-wrap">
      <canvas #canvas class="signature-canvas" (mousedown)="start($event)" (mousemove)="draw($event)"
              (mouseup)="stop()" (mouseleave)="stop()"
              (touchstart)="startTouch($event)" (touchmove)="drawTouch($event)" (touchend)="stop()"></canvas>
      <div class="signature-actions">
        <button type="button" class="btn btn-secondary" (click)="clear()">Effacer</button>
        <button type="button" class="btn btn-primary" (click)="validate()">Valider</button>
        <button type="button" class="btn btn-ghost" (click)="cancel.emit()">Annuler</button>
      </div>
    </div>
  `,
  styles: [`
    .signature-wrap { display: flex; flex-direction: column; gap: 1rem; }
    .signature-canvas {
      width: 100%; height: 220px; background: #fff; border: 2px dashed #94a3b8;
      border-radius: 12px; touch-action: none; cursor: crosshair;
    }
    .signature-actions { display: flex; gap: .75rem; flex-wrap: wrap; }
  `]
})
export class SignaturePadComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() signed = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  private ctx!: CanvasRenderingContext2D;
  private drawing = false;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.scale(2, 2);
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = '#0f172a';
  }

  start(e: MouseEvent): void {
    this.drawing = true;
    this.ctx.beginPath();
    this.ctx.moveTo(e.offsetX, e.offsetY);
  }

  draw(e: MouseEvent): void {
    if (!this.drawing) return;
    this.ctx.lineTo(e.offsetX, e.offsetY);
    this.ctx.stroke();
  }

  startTouch(e: TouchEvent): void {
    e.preventDefault();
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const t = e.touches[0];
    this.drawing = true;
    this.ctx.beginPath();
    this.ctx.moveTo(t.clientX - rect.left, t.clientY - rect.top);
  }

  drawTouch(e: TouchEvent): void {
    e.preventDefault();
    if (!this.drawing) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const t = e.touches[0];
    this.ctx.lineTo(t.clientX - rect.left, t.clientY - rect.top);
    this.ctx.stroke();
  }

  stop(): void {
    this.drawing = false;
  }

  clear(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  validate(): void {
    this.signed.emit(this.canvasRef.nativeElement.toDataURL('image/png'));
  }
}
