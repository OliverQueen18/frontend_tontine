/** Limite pratique après compression (sous le plafond nginx ~1 Mo). */
export const MAX_COMPRESSED_IMAGE_BYTES = 900_000;

/** Limite sur le fichier source avant compression. */
export const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function assertImageSourceSize(file: File, maxBytes = MAX_SOURCE_IMAGE_BYTES): void {
  if (file?.type?.startsWith('image/') && file.size > maxBytes) {
    throw new Error(
      `Image trop volumineuse (${formatBytes(file.size)}). Maximum autorisé : ${formatBytes(maxBytes)}. Choisissez une image plus légère.`
    );
  }
}

/** Message utilisateur pour les erreurs d'upload (taille, réseau, API). */
export function formatUploadError(err: unknown, fallback = 'Erreur lors du téléversement'): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  const e = err as { status?: number; error?: { message?: string } | string; message?: string } | null;
  if (!e) return fallback;

  if (e.status === 413) {
    return 'Image trop volumineuse même après compression. Choisissez une image plus légère.';
  }

  const apiMsg = typeof e.error === 'string'
    ? e.error
    : e.error?.message;

  if (apiMsg) {
    const lower = apiMsg.toLowerCase();
    if (
      lower.includes('trop volumineux')
      || lower.includes('size')
      || lower.includes('max upload')
      || lower.includes('payload too large')
    ) {
      return apiMsg.includes('Mo') || apiMsg.includes('Ko')
        ? apiMsg
        : 'Image trop volumineuse. Choisissez une image plus légère.';
    }
    return apiMsg;
  }

  return e.message || fallback;
}
