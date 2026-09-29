/**
 * Turns user-entered links into safe hrefs. Only http(s) is allowed, so a value like
 * "javascript:alert(1)" can never become a clickable link. Bare domains get https://.
 */
export function safeHref(value: string | undefined | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
