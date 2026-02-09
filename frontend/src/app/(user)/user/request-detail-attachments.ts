const DEFAULT_API_BASE = 'http://localhost:3001/api';

export const buildAttachmentUrl = (filePath: string, apiBase?: string): string => {
  const base = (apiBase ?? process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE).replace(/\/api\/?$/, '');
  const normalized = filePath.includes('uploads/')
    ? filePath.slice(filePath.indexOf('uploads/'))
    : filePath.replace(/^\/+/, '');
  return `${base}/${normalized}`;
};

export const isPreviewableFile = (fileName?: string | null): boolean => {
  if (!fileName) return false;
  const lower = fileName.toLowerCase();
  return ['.pdf', '.png', '.jpg', '.jpeg'].some((ext) => lower.endsWith(ext));
};
