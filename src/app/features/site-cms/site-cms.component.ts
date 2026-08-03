import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SiteContentService } from '../../core/services/site-content.service';
import {
  AboutContent,
  CMS_SECTIONS,
  CollecteurContent,
  CtaContent,
  DEFAULT_SITE_CONTENT,
  FeatureItem,
  HeroContent,
  LayoutContent,
  SectionKey,
  SiteSectionDto,
  StepsContent,
} from '../../core/models/site-content.model';

@Component({
  selector: 'app-site-cms',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './site-cms.component.html',
  styleUrl: './site-cms.component.scss',
})
export class SiteCmsComponent implements OnInit {
  readonly sections = CMS_SECTIONS;
  activeSection = signal<SectionKey>('layout');
  loading = signal(false);
  saving = signal(false);
  message = signal('');
  error = signal('');

  layout: LayoutContent = { ...DEFAULT_SITE_CONTENT.layout };
  hero: HeroContent = { ...DEFAULT_SITE_CONTENT.hero };
  features: FeatureItem[] = [...DEFAULT_SITE_CONTENT.features.items];
  about: AboutContent = { ...DEFAULT_SITE_CONTENT.about };
  steps: StepsContent = {
    label: DEFAULT_SITE_CONTENT.steps.label,
    title: DEFAULT_SITE_CONTENT.steps.title,
    items: [...DEFAULT_SITE_CONTENT.steps.items],
  };
  cta: CtaContent = { ...DEFAULT_SITE_CONTENT.cta };
  collecteur: CollecteurContent = {
    ...DEFAULT_SITE_CONTENT.collecteur,
    promos: [...DEFAULT_SITE_CONTENT.collecteur.promos],
    conduct: [...DEFAULT_SITE_CONTENT.collecteur.conduct],
  };

  private sectionMeta = new Map<string, SiteSectionDto>();

  constructor(public cms: SiteContentService) {}

  ngOnInit(): void {
    this.loadSections();
  }

  activeLabel(): string {
    return this.sections.find(s => s.key === this.activeSection())?.label ?? '';
  }

  loadSections(): void {
    this.loading.set(true);
    this.cms.getAdminSections().subscribe({
      next: sections => {
        sections.forEach(s => this.sectionMeta.set(s.sectionKey, s));
        this.hydrateForms(sections);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message || 'Impossible de charger le contenu');
        this.loading.set(false);
      },
    });
  }

  selectSection(key: SectionKey): void {
    this.activeSection.set(key);
    this.message.set('');
    this.error.set('');
  }

  save(): void {
    const key = this.activeSection();
    const content = this.buildPayload(key);
    this.saving.set(true);
    this.message.set('');
    this.error.set('');

    this.cms.updateSection(key, content as unknown as Record<string, unknown>).subscribe({
      next: updated => {
        this.sectionMeta.set(key, updated);
        this.saving.set(false);
        this.message.set('Section enregistrée avec succès');
        this.cms.invalidateCache();
      },
      error: err => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Erreur lors de l\'enregistrement');
      },
    });
  }

  onFileSelected(event: Event, field: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.cms.uploadMedia(file).subscribe({
      next: res => {
        this.applyImageUrl(field, res.url);
        this.message.set('Image téléversée — pensez à enregistrer la section');
      },
      error: err => this.error.set(
        err?.error?.message || 'Erreur upload'
      ),
    });
    input.value = '';
  }

  addFeature(): void {
    this.features = [
      ...this.features,
      { icon: 'pi pi-star', title: 'Nouveau', desc: '', bg: '#dcfce7', color: '#166534' },
    ];
  }

  removeFeature(index: number): void {
    this.features = this.features.filter((_, i) => i !== index);
  }

  addStep(): void {
    const num = String(this.steps.items.length + 1).padStart(2, '0');
    this.steps = {
      ...this.steps,
      items: [...this.steps.items, { num, icon: 'pi pi-check', title: 'Nouvelle étape', desc: '', bg: '#dcfce7', color: '#166534' }],
    };
  }

  removeStep(index: number): void {
    this.steps = { ...this.steps, items: this.steps.items.filter((_, i) => i !== index) };
  }

  get avatarsText(): string {
    return this.hero.avatars?.join(', ') ?? '';
  }

  set avatarsText(value: string) {
    this.hero = {
      ...this.hero,
      avatars: value.split(',').map(v => v.trim()).filter(Boolean),
    };
  }

  previewUrl(url: string): string {
    return this.cms.resolveMediaUrl(url);
  }

  lastUpdated(key: SectionKey): string {
    const meta = this.sectionMeta.get(key);
    if (!meta?.updatedAt) return '';
    return new Date(meta.updatedAt).toLocaleString('fr-FR');
  }

  private hydrateForms(sections: SiteSectionDto[]): void {
    sections.forEach(s => {
      switch (s.sectionKey) {
        case 'layout':
          this.layout = { ...DEFAULT_SITE_CONTENT.layout, ...(s.content as unknown as LayoutContent) };
          break;
        case 'hero':
          this.hero = { ...DEFAULT_SITE_CONTENT.hero, ...(s.content as unknown as HeroContent) };
          break;
        case 'features':
          this.features = (s.content as { items?: FeatureItem[] }).items?.length
            ? [...(s.content as { items: FeatureItem[] }).items]
            : [...DEFAULT_SITE_CONTENT.features.items];
          break;
        case 'about':
          this.about = { ...DEFAULT_SITE_CONTENT.about, ...(s.content as unknown as AboutContent) };
          break;
        case 'steps':
          {
            const stepContent = s.content as unknown as StepsContent;
            this.steps = {
              label: stepContent.label ?? DEFAULT_SITE_CONTENT.steps.label,
              title: stepContent.title ?? DEFAULT_SITE_CONTENT.steps.title,
              items: stepContent.items?.length
                ? [...stepContent.items]
                : [...DEFAULT_SITE_CONTENT.steps.items],
            };
          }
          break;
        case 'cta':
          this.cta = { ...DEFAULT_SITE_CONTENT.cta, ...(s.content as unknown as CtaContent) };
          break;
        case 'collecteur': {
          const col = s.content as unknown as CollecteurContent;
          this.collecteur = {
            ...DEFAULT_SITE_CONTENT.collecteur,
            ...col,
            conditionsUtilisation: col.conditionsUtilisation ?? DEFAULT_SITE_CONTENT.collecteur.conditionsUtilisation,
            promos: col.promos?.length ? [...col.promos] : [...DEFAULT_SITE_CONTENT.collecteur.promos],
            conduct: col.conduct?.length ? [...col.conduct] : [...DEFAULT_SITE_CONTENT.collecteur.conduct],
          };
          break;
        }
      }
    });
  }

  private buildPayload(key: SectionKey): Record<string, unknown> {
    switch (key) {
      case 'layout':
        return { ...this.layout };
      case 'hero':
        return { ...this.hero };
      case 'features':
        return { items: this.features };
      case 'about':
        return { ...this.about };
      case 'steps':
        return { ...this.steps };
      case 'cta':
        return { ...this.cta };
      case 'collecteur':
        return { ...this.collecteur, promos: this.collecteur.promos, conduct: this.collecteur.conduct };
    }
  }

  private applyImageUrl(field: string, url: string): void {
    switch (field) {
      case 'hero.backgroundImageUrl':
        this.hero = { ...this.hero, backgroundImageUrl: url };
        break;
      case 'hero.personImageUrl':
        this.hero = { ...this.hero, personImageUrl: url };
        break;
      case 'about.imageUrl':
        this.about = { ...this.about, imageUrl: url };
        break;
      case 'layout.brandIconUrl':
        this.layout = { ...this.layout, brandIconUrl: url };
        break;
      case 'layout.footerLogoUrl':
        this.layout = { ...this.layout, footerLogoUrl: url };
        break;
    }
  }
}
