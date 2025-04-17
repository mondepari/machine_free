import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as nodeDrizzle } from 'drizzle-orm/node-postgres';
import { Pool as NodePool } from 'pg';
import ws from 'ws';

import { serverDBEnv } from '@/config/db';
import { isServerMode } from '@/const/version';
import * as schema from '@/database/schemas';

import { LobeChatDatabase } from '../type';

const DB_NAME = 'lobe-chat';
const DB_VERSION = 1;

class WebDBServer {
  private db: IDBDatabase | null = null;
  private static instance: WebDBServer;

  private constructor() {}

  static getInstance(): WebDBServer {
    if (!WebDBServer.instance) {
      WebDBServer.instance = new WebDBServer();
    }
    return WebDBServer.instance;
  }

  async connect(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('imageProvider')) {
          db.createObjectStore('imageProvider');
        }
      };
    });
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    await this.connect();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(new Error('Failed to read data'));
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async set(storeName: string, key: string, value: any): Promise<void> {
    await this.connect();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);

      request.onerror = () => reject(new Error('Failed to write data'));
      request.onsuccess = () => resolve();
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    await this.connect();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(new Error('Failed to delete data'));
      request.onsuccess = () => resolve();
    });
  }

  async clear(storeName: string): Promise<void> {
    await this.connect();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(new Error('Failed to clear data'));
      request.onsuccess = () => resolve();
    });
  }
}

export const getDBInstance = () => WebDBServer.getInstance();
