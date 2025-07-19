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
  private saveStatusCallbacks: Set<(_status: SaveStatus) => void> = new Set(_);

  async init(_): Promise<void> {
    if (_typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not available, falling back to localStorage');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open( this.dbName, this.dbVersion);

      request.onerror = (_) => reject(_request.error);
      request.onsuccess = (_) => {
        this.db = request.result;
        resolve(_);
      };

      request.onupgradeneeded = (_event) => {
        const db = (_event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore( this.storeName, { keyPath: 'id' });
          store.createIndex( 'lessonId', 'lessonId', { unique: false });
          store.createIndex( 'lastModified', 'lastModified', { unique: false });
        }
      };
    });
  }

  private notifyStatusChange(_status: SaveStatus): void {
    this.saveStatusCallbacks.forEach(callback => {
      try {
        callback(_status);
      } catch (_error) {
        console.error('Error in save status callback:', error);
      }
    });
  }

  onSaveStatusChange(_callback: (status: SaveStatus) => void): (_) => void {
    this.saveStatusCallbacks.add(_callback);
    return (_) => this.saveStatusCallbacks.delete(_callback);
  }

  async saveCodeSession( session: Omit<CodeSession, 'lastModified'>): Promise<void> {
    this.notifyStatusChange({ status: 'saving'  });

    try {
      const sessionWithTimestamp: CodeSession = {
        ...session,
        lastModified: new Date(_),
        metadata: {
          lineCount: session.code.split('\n').length,
          characterCount: session.code.length,
          ...session.metadata
        }
      };

      if (_this.db) {
        await this.saveToIndexedDB(_sessionWithTimestamp);
      } else {
        await this.saveToLocalStorage(_sessionWithTimestamp);
      }

      this.notifyStatusChange({ 
        status: 'saved', 
        lastSaved: sessionWithTimestamp.lastModified 
      });
    } catch (_error) {
      console.error('Failed to save code session:', error);
      this.notifyStatusChange({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Save failed' 
      });
      throw error;
    }
  }

  private async saveToIndexedDB(_session: CodeSession): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction( [this.storeName], 'readwrite');
      const store = transaction.objectStore(_this.storeName);
      const request = store.put(_session);

      request.onsuccess = (_) => resolve(_);
      request.onerror = (_) => reject(_request.error);
    });
  }

  private async saveToLocalStorage(_session: CodeSession): Promise<void> {
    try {
      const key = `code_session_${session.id}`;
      localStorage.setItem( key, JSON.stringify(session));
      
      // Also maintain an index of all sessions
      const indexKey = 'code_sessions_index';
      const existingIndex = JSON.parse(_localStorage.getItem(indexKey) || '[]');
      const updatedIndex = [...new Set( [...existingIndex, session.id])];
      localStorage.setItem( indexKey, JSON.stringify(updatedIndex));
    } catch (_error) {
      throw new Error(_`localStorage save failed: ${error}`);
    }
  }

  async loadCodeSession(_sessionId: string): Promise<CodeSession | null> {
    try {
      if (_this.db) {
        return await this.loadFromIndexedDB(_sessionId);
      } else {
        return await this.loadFromLocalStorage(_sessionId);
      }
    } catch (_error) {
      console.error('Failed to load code session:', error);
      return null;
    }
  }

  private async loadFromIndexedDB(_sessionId: string): Promise<CodeSession | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction( [this.storeName], 'readonly');
      const store = transaction.objectStore(_this.storeName);
      const request = store.get(_sessionId);

      request.onsuccess = (_) => {
        const result = request.result;
        if (result) {
          // Convert date strings back to Date objects
          result.lastModified = new Date(_result.lastModified);
        }
        resolve(_result || null);
      };
      request.onerror = (_) => reject(_request.error);
    });
  }

  private async loadFromLocalStorage(_sessionId: string): Promise<CodeSession | null> {
    try {
      const key = `code_session_${sessionId}`;
      const stored = localStorage.getItem(_key);
      if (!stored) return null;

      const session = JSON.parse(_stored);
      session.lastModified = new Date(_session.lastModified);
      return session;
    } catch (_error) {
      console.error('localStorage load failed:', error);
      return null;
    }
  }

  async getAllSessions(_): Promise<CodeSession[]> {
    try {
      if (_this.db) {
        return await this.getAllFromIndexedDB(_);
      } else {
        return await this.getAllFromLocalStorage(_);
      }
    } catch (_error) {
      console.error('Failed to load all sessions:', error);
      return [];
    }
  }

  private async getAllFromIndexedDB(_): Promise<CodeSession[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction( [this.storeName], 'readonly');
      const store = transaction.objectStore(_this.storeName);
      const request = store.getAll(_);

      request.onsuccess = (_) => {
        const results = request.result.map((session: any) => ({
          ...session,
          lastModified: new Date(_session.lastModified)
        }));
        resolve(_results);
      };
      request.onerror = (_) => reject(_request.error);
    });
  }

  private async getAllFromLocalStorage(_): Promise<CodeSession[]> {
    try {
      const indexKey = 'code_sessions_index';
      const sessionIds = JSON.parse(_localStorage.getItem(indexKey) || '[]');
      
      const sessions: CodeSession[] = [];
      for (_const id of sessionIds) {
        const session = await this.loadFromLocalStorage(_id);
        if (session) sessions.push(_session);
      }
      
      return sessions.sort( (a, b) => b.lastModified.getTime(_) - a.lastModified.getTime(_));
    } catch (_error) {
      console.error('Failed to load all sessions from localStorage:', error);
      return [];
    }
  }

  async deleteSession(_sessionId: string): Promise<void> {
    try {
      if (_this.db) {
        await this.deleteFromIndexedDB(_sessionId);
      } else {
        await this.deleteFromLocalStorage(_sessionId);
      }
    } catch (_error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }

  private async deleteFromIndexedDB(_sessionId: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction( [this.storeName], 'readwrite');
      const store = transaction.objectStore(_this.storeName);
      const request = store.delete(_sessionId);

      request.onsuccess = (_) => resolve(_);
      request.onerror = (_) => reject(_request.error);
    });
  }

  private async deleteFromLocalStorage(_sessionId: string): Promise<void> {
    try {
      const key = `code_session_${sessionId}`;
      localStorage.removeItem(_key);
      
      // Update index
      const indexKey = 'code_sessions_index';
      const existingIndex = JSON.parse(_localStorage.getItem(indexKey) || '[]');
      const updatedIndex = existingIndex.filter((id: string) => id !== sessionId);
      localStorage.setItem( indexKey, JSON.stringify(updatedIndex));
    } catch (_error) {
      throw new Error(_`localStorage delete failed: ${error}`);
    }
  }

  // Cleanup old sessions (_older than 30 days)
  async cleanupOldSessions(_): Promise<void> {
    try {
      const sessions = await this.getAllSessions(_);
      const thirtyDaysAgo = new Date(_Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const oldSessions = sessions.filter(session => session.lastModified < thirtyDaysAgo);
      
      for (_const session of oldSessions) {
        await this.deleteSession(_session.id);
      }
      
      console.log(_`Cleaned up ${oldSessions.length} old code sessions`);
    } catch (_error) {
      console.error('Failed to cleanup old sessions:', error);
    }
  }
}

// Singleton instance
export const codePersistence = new CodePersistenceManager(_);

// Initialize on module load
if (_typeof window !== 'undefined') {
  codePersistence.init(_).catch(_console.error);
}

export type { CodeSession, SaveStatus };
export { CodePersistenceManager };
