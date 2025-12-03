/**
 * Device Fingerprint Utility
 * 
 * Creates a unique fingerprint for the current device/browser
 * to track sessions across different devices
 */

export function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }

  const components: string[] = [];

  // User Agent
  components.push(navigator.userAgent || '');

  // Screen resolution
  components.push(`${screen.width}x${screen.height}`);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language || '');

  // Platform
  components.push(navigator.platform || '');

  // Hardware concurrency (CPU cores)
  components.push(String(navigator.hardwareConcurrency || 0));

  // Canvas fingerprint (basic)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch (e) {
    // Ignore canvas errors
  }

  // Combine and hash
  const combined = components.join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `device-${Math.abs(hash).toString(36)}`;
}

export function getDeviceInfo(): {
  fingerprint: string;
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
} {
  if (typeof window === 'undefined') {
    return {
      fingerprint: 'server',
      userAgent: 'server',
      platform: 'server',
      language: 'en',
      timezone: 'UTC',
    };
  }

  return {
    fingerprint: generateDeviceFingerprint(),
    userAgent: navigator.userAgent || '',
    platform: navigator.platform || '',
    language: navigator.language || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}










