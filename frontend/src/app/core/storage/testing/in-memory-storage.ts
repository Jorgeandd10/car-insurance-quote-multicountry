/** In-memory `Storage` for `WIZARD_STORAGE` in unit tests (ADR-0007). Test-only. */
export class InMemoryStorage implements Storage {
  private readonly items = new Map<string, string>();

  get length(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.items.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }

  setItem(key: string, value: string): void {
    this.items.set(key, String(value));
  }

  /** Snapshot of all keys, to assert what is (not) stored. */
  keys(): string[] {
    return [...this.items.keys()];
  }
}
