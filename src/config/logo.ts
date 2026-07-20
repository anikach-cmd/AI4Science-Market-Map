// ---------------------------------------------------------------------------
// EDIT ME: your logo.dev API token. Get a free publishable key at
// https://logo.dev — without a real token these requests will 401/404 and
// the app will silently fall through to the favicon service, then the
// monogram, so nothing ever breaks — but a real token gives sharper logos.
// ---------------------------------------------------------------------------
export const LOGO_DEV_API_TOKEN = "YOUR_LOGO_DEV_API_TOKEN";

export function logoDevUrl(domain: string): string {
  return `https://img.logo.dev/${domain}?token=${LOGO_DEV_API_TOKEN}&size=128&format=png`;
}

export function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

/** Strip protocol/path/query from a user-entered URL to get a bare domain. */
export function extractDomain(websiteUrl: string): string {
  if (!websiteUrl) return "";
  let url = websiteUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const host = new URL(url).hostname;
    return host.replace(/^www\./i, "");
  } catch {
    return websiteUrl.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
  }
}
