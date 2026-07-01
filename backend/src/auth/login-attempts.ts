import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

/**
 * Per-phone failed-login lockout: PINs are low-entropy (4–6 digits), so brute force
 * must be throttled per account, not just per IP. In-memory is acceptable for the
 * single-instance v1 deployment; revisit if the API ever runs more than one replica.
 */
@Injectable()
export class LoginAttempts {
  private readonly failures = new Map<string, number[]>();

  constructor() {
    // Hourly sweep so phones that failed once and never returned don't accumulate
    // (entries are otherwise only pruned on re-access). unref: never keeps the process alive.
    setInterval(() => this.sweep(), 60 * 60 * 1000).unref();
  }

  assertNotLocked(phone: string): void {
    const recent = this.recentFailures(phone);
    if (recent.length >= MAX_FAILURES) {
      throw new HttpException(
        'Too many failed attempts — try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  registerFailure(phone: string): void {
    const recent = this.recentFailures(phone);
    recent.push(Date.now());
    this.failures.set(phone, recent);
  }

  clear(phone: string): void {
    this.failures.delete(phone);
  }

  private recentFailures(phone: string): number[] {
    const cutoff = Date.now() - WINDOW_MS;
    const recent = (this.failures.get(phone) ?? []).filter((t) => t > cutoff);
    if (recent.length === 0) this.failures.delete(phone);
    return recent;
  }

  private sweep(): void {
    const cutoff = Date.now() - WINDOW_MS;
    for (const [phone, times] of this.failures) {
      const recent = times.filter((t) => t > cutoff);
      if (recent.length === 0) this.failures.delete(phone);
      else this.failures.set(phone, recent);
    }
  }
}
