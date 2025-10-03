import crypto from 'node:crypto';

export function hashIp(ip: string | undefined, salt: string): string | null {
  if (!ip) {
    return null;
  }

  const normalized = ip.trim();
  if (!normalized) {
    return null;
  }

  return crypto.createHash('sha256').update(normalized + salt, 'utf8').digest('hex');
}
