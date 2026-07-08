import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-chart',
  standalone: true,
  template: `<div class="chart-wrap"><canvas #canvas></canvas></div>`,
  styles: [`
    .chart-wrap {
      position: relative;
      width: 100%;
      height: 260px;
    }
    canvas {
      max-width: 100%;
    }
  `]
})
export class DashboardChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input({ required: true }) config!: ChartConfiguration;
  @Input() height = 260;

  private chart?: Chart;
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.viewReady) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.config) return;

    const wrap = canvas.parentElement;
    if (wrap) wrap.style.height = `${this.height}px`;

    this.chart?.destroy();
    this.chart = new Chart(canvas, this.config);
  }
}
