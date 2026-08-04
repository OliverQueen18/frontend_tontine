import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/** Après un déploiement, un onglet ouvert peut référencer d'anciens chunks hashés. */
function isChunkLoadError(reason: unknown): boolean {
  const msg = String(
    (reason as { message?: string })?.message ?? reason ?? ''
  );
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('ChunkLoadError') ||
    msg.includes('error loading dynamically imported module')
  );
}

function reloadOnceOnStaleChunk(): void {
  const key = 'tontine-chunk-reload';
  if (sessionStorage.getItem(key)) {
    return;
  }
  sessionStorage.setItem(key, '1');
  window.location.reload();
}

window.addEventListener('unhandledrejection', (event) => {
  if (isChunkLoadError(event.reason)) {
    event.preventDefault();
    reloadOnceOnStaleChunk();
  }
});

window.addEventListener('error', (event) => {
  if (isChunkLoadError(event.error) || isChunkLoadError(event.message)) {
    reloadOnceOnStaleChunk();
  }
});

bootstrapApplication(AppComponent, appConfig)
  .then(() => sessionStorage.removeItem('tontine-chunk-reload'))
  .catch((err) => {
    console.error(err);
    if (isChunkLoadError(err)) {
      reloadOnceOnStaleChunk();
    }
  });
