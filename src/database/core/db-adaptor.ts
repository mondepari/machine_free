// import { isDesktop } from '@/const/version';
import { getDBInstance } from './web-server';

// import { getPgliteInstance } from './electron';

export class DBAdaptor {
  private db: ReturnType<typeof getDBInstance>;

  constructor() {
    this.db = getDBInstance();
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    return this.db.get<T>(storeName, key);
  }

  async set<T>(storeName: string, key: string, value: T): Promise<void> {
    return this.db.set(storeName, key, value);
  }

  async delete(storeName: string, key: string): Promise<void> {
    return this.db.delete(storeName, key);
  }

  async clear(storeName: string): Promise<void> {
    return this.db.clear(storeName);
  }

  async connect(): Promise<void> {
    // Implement connection logic if needed
  }

  async disconnect(): Promise<void> {
    // Implement disconnection logic if needed
  }
}
