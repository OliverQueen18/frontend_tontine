import { Component, HostListener, computed, effect, signal } from '@angular/core';
import { NgStyle } from '@angular/common';
import { TourService } from '../../../core/services/tour.service';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-product-tour',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './product-tour.component.html',
  styleUrl: './product-tour.component.scss'
})
export class ProductTourComponent {
  readonly targetRect = signal<Rect | null>(null);

  private static readonly TOOLTIP_WIDTH = 360;
  private static readonly TOOLTIP_HEIGHT = 230;

  constructor(public tour: TourService) {
    effect(() => {
      const active = this.tour.active();
      const step = this.tour.current();
      if (!active || !step) {
        this.targetRect.set(null);
        return;
      }
      // Deferred so the DOM is ready and the step change is applied.
      setTimeout(() => this.locate(step.target), 30);
    });
  }

  readonly spotlightStyle = computed(() => {
    const r = this.targetRect();
    if (!r) return null;
    const pad = 8;
    return {
      top: `${r.top - pad}px`,
      left: `${r.left - pad}px`,
      width: `${r.width + pad * 2}px`,
      height: `${r.height + pad * 2}px`
    };
  });

  readonly tooltipStyle = computed(() => {
    const r = this.targetRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tw = Math.min(ProductTourComponent.TOOLTIP_WIDTH, vw - 24);
    const th = ProductTourComponent.TOOLTIP_HEIGHT;

    if (!r) {
      return {
        top: `${Math.max(16, (vh - th) / 2)}px`,
        left: `${(vw - tw) / 2}px`,
        width: `${tw}px`
      };
    }

    const gap = 14;
    let top = r.top + r.height + gap;
    if (top + th > vh - 12) {
      const above = r.top - th - gap;
      top = above >= 12 ? above : Math.max(12, vh - th - 12);
    }
    top = Math.max(12, top);

    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(12, Math.min(left, vw - tw - 12));

    return { top: `${top}px`, left: `${left}px`, width: `${tw}px` };
  });

  private locate(target?: string): void {
    if (!target) {
      this.targetRect.set(null);
      return;
    }
    const el = document.querySelector(target) as HTMLElement | null;
    if (!el) {
      this.targetRect.set(null);
      return;
    }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        this.targetRect.set(null);
        return;
      }
      this.targetRect.set({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    }, 220);
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  onViewportChange(): void {
    if (this.tour.active()) {
      this.locate(this.tour.current()?.target);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.tour.active()) return;
    if (event.key === 'Escape') {
      this.tour.skip();
    } else if (event.key === 'ArrowRight') {
      this.tour.next();
    } else if (event.key === 'ArrowLeft') {
      this.tour.prev();
    }
  }
}
