'use client';

interface CodeSession {
  id: string;
  lessonId?: string;
  code: string;
  language: string;
  lastModified: Date;
  autoSaveEnabled: boolean;
  compilationResult?: any;
  metadata?: {
    lineCount: number;
    characterCount: number;
    lastCursorPosition?: { line: number; column: number };
  };
}

interface SaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  error?: string;
}

class CodePersistenceManager {
  private dbName = 'SolidityLearningPlatform';
  private dbVersion = 1;
  private storeName = 'codeSessions';
  private db: IDBDatabase | null = null;
  private saveStatusCallbacks: Set<(status: SaveStatus) => void> = new Set();

  async init(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not available, falling back to localStorage');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('lessonId', 'lessonId', { unique: false });
          store.createIndex('lastModified', 'lastModified', { unique: false });
        }
      };
    });
  }

  private notifyStatusChange(status: SaveStatus): void {
    this.saveStatusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in save status callback:', error);
      }
    });
  }

  onSaveStatusChange(callback: (status: SaveStatus) => void): () => void {
    this.saveStatusCallbacks.add(callback);
    return () => this.saveStatusCallbacks.delete(callback);
  }

  async saveCodeSession(session: Omit<CodeSession, 'lastModified'>): Promise<void> {
    this.notifyStatusChange({ status: 'saving' });

    try {
      const sessionWithTimestamp: CodeSession = {
        ...session,
        lastModified: new Date(),
        metadata: {
          lineCount: session.code.split('\n').length,
          characterCount: session.code.length,
          ...session.metadata
        }
      };

      if (this.db) {
        await this.saveToIndexedDB(sessionWithTimestamp);
      } else {
        await this.saveToLocalStorage(sessionWithTimestamp);
      }

      this.notifyStatusChange({ 
        status: 'saved', 
        lastSaved: sessionWithTimestamp.lastModified 
      });
    } catch (error) {
      console.error('Failed to save code session:', error);
      this.notifyStatusChange({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Save failed' 
      });
      throw error;
    }
  }

  private async saveToIndexedDB(session: CodeSession): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(session);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async saveToLocalStorage(session: CodeSession): Promise<void> {
    try {
      const key = `code_session_${session.id}`;
      localStorage.setItem(key, JSON.stringify(session));
      
      // Also maintain an index of all sessions
      const indexKey = 'code_sessions_index';
      const existingIndex = JSON.parse(localStorage.getItem(indexKey) || '[]');
      const updatedIndex = [...new Set([...existingIndex, session.id])];
      localStorage.setItem(indexKey, JSON.stringify(updatedIndex));
    } catch (error) {
      throw new Error(`localStorage save failed: ${error}`);
    }
  }

  async loadCodeSession(sessionId: string): Promise<CodeSession | null> {
    try {
      if (this.db) {
        return await this.loadFromIndexedDB(sessionId);
      } else {
        return await this.loadFromLocalStorage(sessionId);
      }
    } catch (error) {
      console.error('Failed to load code session:', error);
      return null;
    }
  }

  private async loadFromIndexedDB(sessionId: string): Promise<CodeSession | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(sessionId);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Convert date strings back to Date objects
          result.lastModified = new Date(result.lastModified);
        }
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async loadFromLocalStorage(sessionId: string): Promise<CodeSession | null> {
    try {
      const key = `code_session_${sessionId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const session = JSON.parse(stored);
      session.lastModified = new Date(session.lastModified);
      return session;
    } catch (error) {
      console.error('localStorage load failed:', error);
      return null;
    }
  }

  async getAllSessions(): Promise<CodeSession[]> {
    try {
      if (this.db) {
        return await this.getAllFromIndexedDB();
      } else {
        return await this.getAllFromLocalStorage();
      }
    } catch (error) {
      console.error('Failed to load all sessions:', error);
      return [];
    }
  }

  private async getAllFromIndexedDB(): Promise<CodeSession[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result.map((session: any) => ({
          ...session,
          lastModified: new Date(session.lastModified)
        }));
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllFromLocalStorage(): Promise<CodeSession[]> {
    try {
      const indexKey = 'code_sessions_index';
      const sessionIds = JSON.parse(localStorage.getItem(indexKey) || '[]');
      
      const sessions: CodeSession[] = [];
      for (const id of sessionIds) {
        const session = await this.loadFromLocalStorage(id);
        if (session) sessions.push(session);
      }
      
      return sessions.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    } catch (error) {
      console.error('Failed to load all sessions from localStorage:', error);
      return [];
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      if (this.db) {
        await this.deleteFromIndexedDB(sessionId);
      } else {
        await this.deleteFromLocalStorage(sessionId);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }

  private async deleteFromIndexedDB(sessionId: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(sessionId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteFromLocalStorage(sessionId: string): Promise<void> {
    try {
      const key = `code_session_${sessionId}`;
      localStorage.removeItem(key);
      
      // Update index
      const indexKey = 'code_sessions_index';
      const existingIndex = JSON.parse(localStorage.getItem(indexKey) || '[]');
      const updatedIndex = existingIndex.filter((id: string) => id !== sessionId);
      localStorage.setItem(indexKey, JSON.stringify(updatedIndex));
    } catch (error) {
      throw new Error(`localStorage delete failed: ${error}`);
    }
  }

  // Cleanup old sessions (older than 30 days)
  async cleanupOldSessions(): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const oldSessions = sessions.filter(session => session.lastModified < thirtyDaysAgo);
      
      for (const session of oldSessions) {
        await this.deleteSession(session.id);
      }
      
      console.log(`Cleaned up ${oldSessions.length} old code sessions`);
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error);
    }
  }
}

// Singleton instance
export const codePersistence = new CodePersistenceManager();

// Initialize on module load
if (typeof window !== 'undefined') {
  codePersistence.init().catch(console.error);
}

export type { CodeSession, SaveStatus };
export { CodePersistenceManager };
