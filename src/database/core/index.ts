import { DBAdaptor } from './db-adaptor';

export class LocalDB {
  private static instance: LocalDB;
  private adaptor: DBAdaptor;

  private constructor() {
    this.adaptor = new DBAdaptor();
  }

  public static getInstance(): LocalDB {
    if (!LocalDB.instance) {
      LocalDB.instance = new LocalDB();
    }
    return LocalDB.instance;
  }

  async get<T>(key: string, storeName = 'settings'): Promise<T | null> {
    try {
      return await this.adaptor.get<T>(storeName, key);
    } catch (error) {
      console.error('Error getting data from LocalDB:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, storeName = 'settings'): Promise<void> {
    try {
      await this.adaptor.set(storeName, key, value);
    } catch (error) {
      console.error('Error setting data in LocalDB:', error);
    }
  }

  async remove(key: string, storeName = 'settings'): Promise<void> {
    try {
      await this.adaptor.delete(storeName, key);
    } catch (error) {
      console.error('Error removing data from LocalDB:', error);
    }
  }

  async clear(storeName = 'settings'): Promise<void> {
    try {
      await this.adaptor.clear(storeName);
    } catch (error) {
      console.error('Error clearing LocalDB:', error);
    }
  }

  async has(key: string, storeName = 'settings'): Promise<boolean> {
    try {
      const value = await this.adaptor.get(storeName, key);
      return value !== null;
    } catch (error) {
      console.error('Error checking key in LocalDB:', error);
      return false;
    }
  }
} 