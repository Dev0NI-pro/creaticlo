export interface PendingImage {
  id: string;
  src: string;
  alt: string;
  description: string;
  featured: boolean;
  image?: string; // base64 si nouvelle photo
}

export interface PendingStore {
  added: PendingImage[];
  updated: PendingImage[];
  deleted: { id: string; src: string }[];
  originalGallery: { images: PendingImage[] } | null;
}

const STORAGE_KEY = 'creaticlo_pending';

export function getPending(): PendingStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    return JSON.parse(raw);
  } catch {
    return emptyStore();
  }
}

export function savePending(store: PendingStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function clearPending(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function emptyStore(): PendingStore {
  return { added: [], updated: [], deleted: [], originalGallery: null };
}

export function countPending(store: PendingStore): number {
  return store.added.length + store.updated.length + store.deleted.length;
}