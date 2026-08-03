import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, from, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DEFAULT_SITE_CONTENT,
  SiteContentMap,
  SiteSectionDto,
} from '../models/site-content.model';
import { ImageCompressService } from './image-compress.service';
import { formatUploadError } from '../utils/upload-error.util';

@Injectable({ providedIn: 'root' })
export class SiteContentService {
  private readonly cache = signal<SiteContentMap | null>(null);
  readonly content = computed(() => this.cache() ?? DEFAULT_SITE_CONTENT);

  constructor(
    private http: HttpClient,
    private imageCompress: ImageCompressService
  ) {}

  load(): Observable<SiteContentMap> {
    return this.http.get<Partial<SiteContentMap>>(`${environment.apiUrl}/public/content`).pipe(
      map(data => this.mergeWithDefaults(data)),
      tap(merged => this.cache.set(merged)),
      catchError(() => {
        this.cache.set(DEFAULT_SITE_CONTENT);
        return of(DEFAULT_SITE_CONTENT);
      })
    );
  }

  section<K extends keyof SiteContentMap>(key: K): SiteContentMap[K] {
    return this.content()[key];
  }

  resolveMediaUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/api/')) {
      const origin = environment.apiUrl.replace(/\/api\/?$/, '');
      return origin + url;
    }
    return url;
  }

  // Admin
  getAdminSections(): Observable<SiteSectionDto[]> {
    return this.http.get<SiteSectionDto[]>(`${environment.apiUrl}/admin/site-content`);
  }

  updateSection(sectionKey: string, content: Record<string, unknown>): Observable<SiteSectionDto> {
    return this.http.put<SiteSectionDto>(
      `${environment.apiUrl}/admin/site-content/${sectionKey}`,
      { content }
    );
  }

  uploadMedia(file: File): Observable<{ url: string }> {
    return from(this.imageCompress.compress(file)).pipe(
      switchMap(compressed => {
        const form = new FormData();
        form.append('file', compressed, compressed.name);
        return this.http.post<{ url: string }>(`${environment.apiUrl}/admin/media/upload`, form);
      }),
      catchError(err => throwError(() => ({
        status: (err as { status?: number })?.status,
        error: { message: formatUploadError(err) }
      })))
    );
  }

  invalidateCache(): void {
    this.load().subscribe();
  }

  private mergeWithDefaults(data: Partial<SiteContentMap>): SiteContentMap {
    return {
      layout: { ...DEFAULT_SITE_CONTENT.layout, ...data.layout },
      hero: { ...DEFAULT_SITE_CONTENT.hero, ...data.hero },
      features: {
        items: data.features?.items?.length ? data.features.items : DEFAULT_SITE_CONTENT.features.items,
      },
      about: { ...DEFAULT_SITE_CONTENT.about, ...data.about },
      steps: {
        label: data.steps?.label ?? DEFAULT_SITE_CONTENT.steps.label,
        title: data.steps?.title ?? DEFAULT_SITE_CONTENT.steps.title,
        items: data.steps?.items?.length ? data.steps.items : DEFAULT_SITE_CONTENT.steps.items,
      },
      cta: { ...DEFAULT_SITE_CONTENT.cta, ...data.cta },
      collecteur: {
        title: data.collecteur?.title ?? DEFAULT_SITE_CONTENT.collecteur.title,
        subtitle: data.collecteur?.subtitle ?? DEFAULT_SITE_CONTENT.collecteur.subtitle,
        formTitle: data.collecteur?.formTitle ?? DEFAULT_SITE_CONTENT.collecteur.formTitle,
        formSubtitle: data.collecteur?.formSubtitle ?? DEFAULT_SITE_CONTENT.collecteur.formSubtitle,
        conditionsUtilisation: data.collecteur?.conditionsUtilisation ?? DEFAULT_SITE_CONTENT.collecteur.conditionsUtilisation,
        promos: data.collecteur?.promos?.length ? data.collecteur.promos : DEFAULT_SITE_CONTENT.collecteur.promos,
        conduct: data.collecteur?.conduct?.length ? data.collecteur.conduct : DEFAULT_SITE_CONTENT.collecteur.conduct,
      },
    };
  }
}
