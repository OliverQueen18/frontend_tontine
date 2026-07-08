import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import * as L from 'leaflet';

const DEFAULT_LAT = 12.6392;
const DEFAULT_LNG = -7.9994;
const DEFAULT_ZOOM = 13;
const GEOCODE_DEBOUNCE_MS = 700;
const MIN_ADDRESS_LENGTH = 4;

@Component({
  selector: 'app-osm-map-picker',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="osm-map-picker">
      <div #mapHost class="map-host"></div>
      @if (!readonly) {
        <p class="map-hint">
          <i class="pi pi-map-marker"></i>
          {{ hint }}
        </p>
      }
      @if (latitude != null && longitude != null) {
        <p class="map-coords">{{ latitude | number:'1.5-5' }}, {{ longitude | number:'1.5-5' }}</p>
      }
    </div>
  `,
  styles: [`
    .osm-map-picker { display: grid; gap: 0.5rem; }
    .map-host {
      height: 260px;
      width: 100%;
      border-radius: 10px;
      border: 1px solid var(--border, #e2e8f0);
      overflow: hidden;
      z-index: 0;
    }
    .map-hint {
      margin: 0;
      font-size: 0.82rem;
      color: var(--muted, #64748b);
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .map-coords {
      margin: 0;
      font-size: 0.8rem;
      font-family: ui-monospace, monospace;
      color: var(--text, #0f172a);
    }
  `]
})
export class OsmMapPickerComponent implements AfterViewInit, OnDestroy {
  @Input() latitude: number | null | undefined = null;
  @Input() longitude: number | null | undefined = null;
  @Input() readonly = false;
  @Input() useCurrentLocation = false;
  @Input() hint = "Saisissez l'adresse ou cliquez sur la carte pour positionner le lieu";

  @Input() set address(value: string | null | undefined) {
    const next = (value ?? '').trim();
    if (next === this.currentAddress) {
      return;
    }
    this.currentAddress = next;
    if (this.skipAddressGeocode) {
      this.skipAddressGeocode = false;
      return;
    }
    if (this.readonly || !next) {
      return;
    }
    if (this.latitude != null && this.longitude != null && this.lastGeocodedAddress === '') {
      this.lastGeocodedAddress = next;
      return;
    }
    this.scheduleForwardGeocode(next);
  }

  @Output() latitudeChange = new EventEmitter<number | null>();
  @Output() longitudeChange = new EventEmitter<number | null>();
  @Output() locationPicked = new EventEmitter<{ latitude: number; longitude: number; adresse?: string }>();

  @ViewChild('mapHost', { static: true }) mapHost!: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private marker?: L.Marker;
  private initialized = false;
  private geocodeTimer?: ReturnType<typeof setTimeout>;
  private lastGeocodedAddress = '';
  private currentAddress = '';
  private skipAddressGeocode = false;
  private geocodeRequestId = 0;
  private geolocationAttempted = false;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.fixLeafletIcons();
    this.initMap();
  }

  ngOnDestroy(): void {
    clearTimeout(this.geocodeTimer);
    this.map?.remove();
  }

  @Input() set mapVisible(visible: boolean) {
    if (visible && this.map) {
      setTimeout(() => {
        this.map?.invalidateSize();
        if (this.latitude != null && this.longitude != null) {
          this.map?.setView([this.latitude, this.longitude], this.map.getZoom());
          this.updateMarker(this.latitude, this.longitude);
        }
      }, 250);
    }
  }

  updateMarker(lat: number, lng: number): void {
    if (!this.map) return;
    if (!this.marker) {
      this.marker = L.marker([lat, lng], { draggable: !this.readonly }).addTo(this.map);
      if (!this.readonly) {
        this.marker.on('dragend', () => {
          this.zone.run(() => {
            const pos = this.marker!.getLatLng();
            this.emitPosition(pos.lat, pos.lng, true);
          });
        });
      }
    } else {
      this.marker.setLatLng([lat, lng]);
    }
    this.map.setView([lat, lng], Math.max(this.map.getZoom(), 15));
  }

  private initMap(): void {
    if (this.initialized) return;
    const el = this.mapHost.nativeElement;
    const lat = this.latitude ?? DEFAULT_LAT;
    const lng = this.longitude ?? DEFAULT_LNG;

    this.map = L.map(el, {
      center: [lat, lng],
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.readonly) return;
      this.zone.run(() => {
        this.emitPosition(e.latlng.lat, e.latlng.lng, true);
      });
    });

    if (this.latitude != null && this.longitude != null) {
      this.updateMarker(this.latitude, this.longitude);
    } else if (this.useCurrentLocation && !this.readonly) {
      this.tryCurrentLocation();
    }

    this.initialized = true;
    setTimeout(() => this.map?.invalidateSize(), 100);
  }

  private tryCurrentLocation(): void {
    if (this.geolocationAttempted || typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }
    this.geolocationAttempted = true;

    navigator.geolocation.getCurrentPosition(
      pos => {
        this.zone.run(() => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (this.latitude == null && this.longitude == null) {
            void this.emitPosition(lat, lng, true);
          } else {
            this.map?.setView([lat, lng], DEFAULT_ZOOM);
          }
        });
      },
      () => {
        // Permission refusée ou indisponible : la carte reste centrée sur la position par défaut.
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  private scheduleForwardGeocode(query: string): void {
    clearTimeout(this.geocodeTimer);
    if (query.length < MIN_ADDRESS_LENGTH) {
      return;
    }
    this.geocodeTimer = setTimeout(() => {
      void this.forwardGeocode(query);
    }, GEOCODE_DEBOUNCE_MS);
  }

  private async forwardGeocode(query: string): Promise<void> {
    if (query === this.lastGeocodedAddress) {
      return;
    }
    const requestId = ++this.geocodeRequestId;
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'fr',
          'Accept': 'application/json'
        }
      });
      if (!res.ok || requestId !== this.geocodeRequestId) {
        return;
      }
      const data = await res.json() as { lat: string; lon: string }[];
      if (!data.length || requestId !== this.geocodeRequestId) {
        return;
      }
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return;
      }

      this.zone.run(() => {
        this.lastGeocodedAddress = query;
        this.latitudeChange.emit(lat);
        this.longitudeChange.emit(lng);
        this.updateMarker(lat, lng);
        this.locationPicked.emit({ latitude: lat, longitude: lng });
      });
    } catch {
      // ignore geocoding errors
    }
  }

  private async emitPosition(lat: number, lng: number, reverseGeocode: boolean): Promise<void> {
    this.latitudeChange.emit(lat);
    this.longitudeChange.emit(lng);
    this.updateMarker(lat, lng);

    let adresse: string | undefined;
    if (reverseGeocode) {
      adresse = await this.reverseGeocode(lat, lng) ?? undefined;
      if (adresse) {
        this.skipAddressGeocode = true;
        this.lastGeocodedAddress = adresse.trim();
        this.currentAddress = adresse.trim();
      }
    }
    this.locationPicked.emit({ latitude: lat, longitude: lng, adresse });
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'fr',
          'Accept': 'application/json'
        }
      });
      if (!res.ok) return null;
      const data = await res.json() as { display_name?: string };
      return data.display_name ?? null;
    } catch {
      return null;
    }
  }

  private fixLeafletIcons(): void {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });
  }
}
