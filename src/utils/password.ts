const PBKDF2_ITERATIONS = 100_000;
const HASH_ALGORITHM = 'SHA-256';
const KEY_LENGTH_BITS = 256;

export interface HashedPassword {
  salt: string;
  hash: string;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

async function deriveHash(password: string, salt: Uint8Array): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: HASH_ALGORITHM },
    keyMaterial,
    KEY_LENGTH_BITS,
  );
  return toHex(new Uint8Array(derivedBits));
}

export async function hashPassword(password: string): Promise<HashedPassword> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveHash(password, salt);
  return { salt: toHex(salt), hash };
}

export async function verifyPassword(password: string, stored: HashedPassword): Promise<boolean> {
  const salt = fromHex(stored.salt);
  const hash = await deriveHash(password, salt);
  return hash === stored.hash;
}
