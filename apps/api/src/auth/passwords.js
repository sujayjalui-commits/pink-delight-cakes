const PBKDF2_ITERATIONS = 100000;
const PBKDF2_HASH_LENGTH = 32;

function bytesToBase64Url(bytes) {
  let binary = "";

  for (const value of bytes) {
    binary += String.fromCharCode(value);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function deriveHash(password, salt, iterations) {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256"
    },
    passwordKey,
    PBKDF2_HASH_LENGTH * 8
  );

  return new Uint8Array(derivedBits);
}

function secureCompare(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}

export async function hashAdminPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveHash(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2_sha256$${PBKDF2_ITERATIONS}$${bytesToBase64Url(salt)}$${bytesToBase64Url(hash)}`;
}

export async function verifyAdminPassword(password, storedHash) {
  if (!storedHash || !storedHash.startsWith("pbkdf2_sha256$")) {
    return false;
  }

  const [, iterationText, saltText, expectedHashText] = storedHash.split("$");
  const iterations = Number(iterationText);

  if (!Number.isInteger(iterations) || !saltText || !expectedHashText) {
    return false;
  }

  const salt = base64UrlToBytes(saltText);
  const derivedHash = await deriveHash(password, salt, iterations);
  const candidateHashText = bytesToBase64Url(derivedHash);

  return secureCompare(candidateHashText, expectedHashText);
}
