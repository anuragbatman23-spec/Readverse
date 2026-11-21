export type BrowserEngine = 'chromium' | 'webkit' | 'gecko' | 'unknown';

export function detectBrowserEngine(): BrowserEngine {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = navigator.userAgent;
  const vendor = navigator.vendor || '';

  // Check User-Agent Client Hints (Chromium modern standard)
  const userAgentData = (navigator as unknown as { userAgentData?: { brands?: Array<{ brand: string }> } }).userAgentData;
  if (userAgentData?.brands?.some(b => b.brand === 'Chromium' || b.brand === 'Google Chrome')) {
    return 'chromium';
  }

  // Check window.chrome and vendor string
  if (Boolean((window as unknown as { chrome?: unknown }).chrome) || (/Chrome/.test(userAgent) && /Google Inc/.test(vendor))) {
    return 'chromium';
  }

  // Check Chromium derivatives (Edge, Opera, Vivaldi, Brave, Arc)
  if (/Edg\//.test(userAgent) || /OPR\//.test(userAgent) || /Brave/.test(userAgent) || /Vivaldi/.test(userAgent)) {
    return 'chromium';
  }

  // Check Firefox (Gecko)
  if (/Firefox\//.test(userAgent)) {
    return 'gecko';
  }

  // Check Safari (WebKit)
  if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent) && /Apple Computer/.test(vendor)) {
    return 'webkit';
  }

  return 'unknown';
}
