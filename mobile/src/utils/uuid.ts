/**
 * Pure-JS UUID v4 — used for offline-queue event/ping ids (the server dedupes on these).
 * These are idempotency keys, not security tokens, so Math.random is fine and it avoids a
 * native module (expo-crypto) that must be compiled into the dev/preview build.
 */
export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
