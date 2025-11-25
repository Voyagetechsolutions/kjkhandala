import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import type { 
  Shift, 
  Trip, 
  Manifest, 
  Issue, 
  TripLog, 
  SyncQueueItem 
} from '@/types';

// Storage keys
const STORAGE_KEYS = {
  DRIVER_PROFILE: '@driver_profile',
  SHIFTS: '@shifts',
  TRIPS: '@trips',
  MANIFEST: '@manifest',
  ISSUES: '@issues',
  TRIP_LOGS: '@trip_logs',
  SYNC_QUEUE: '@sync_queue',
  LAST_SYNC: '@last_sync',
};

// Initialize SQLite database for offline storage
let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async () => {
  if (db) return db;

  try {
    db = await SQLite.openDatabaseAsync('voyage_driver.db');
    console.log('✅ SQLite database opened successfully');
  } catch (error) {
    console.error('❌ Failed to open SQLite database:', error);
    throw error;
  }

  // Create tables
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      driver_id TEXT,
      bus_id TEXT,
      route_id TEXT,
      start_time TEXT,
      end_time TEXT,
      status TEXT,
      data TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      shift_id TEXT,
      trip_number TEXT,
      route_id TEXT,
      scheduled_departure TEXT,
      actual_departure TEXT,
      scheduled_arrival TEXT,
      actual_arrival TEXT,
      status TEXT,
      passengers_count INTEGER,
      data TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS manifest (
      id TEXT PRIMARY KEY,
      trip_id TEXT,
      passenger_name TEXT,
      seat_number TEXT,
      booking_reference TEXT,
      checked_in INTEGER,
      check_in_time TEXT,
      status TEXT,
      data TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      driver_id TEXT,
      trip_id TEXT,
      shift_id TEXT,
      type TEXT,
      description TEXT,
      photo_url TEXT,
      severity TEXT,
      status TEXT,
      data TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS trip_logs (
      id TEXT PRIMARY KEY,
      trip_id TEXT,
      event TEXT,
      timestamp TEXT,
      note TEXT,
      location TEXT,
      data TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      action TEXT,
      table_name TEXT,
      data TEXT,
      created_at TEXT,
      synced INTEGER DEFAULT 0,
      synced_at TEXT,
      error TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_shifts_driver ON shifts(driver_id);
    CREATE INDEX IF NOT EXISTS idx_trips_shift ON trips(shift_id);
    CREATE INDEX IF NOT EXISTS idx_manifest_trip ON manifest(trip_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);
  `);

  return db;
};

// AsyncStorage helpers
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

// SQLite helpers
export const offlineStorage = {
  // Shifts
  async saveShifts(shifts: Shift[]) {
    const database = await initDatabase();
    for (const shift of shifts) {
      await database.runAsync(
        `INSERT OR REPLACE INTO shifts 
        (id, driver_id, bus_id, route_id, start_time, end_time, status, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shift.id,
          shift.driver_id,
          shift.bus_id,
          shift.route_id,
          shift.start_time,
          shift.end_time,
          shift.status,
          JSON.stringify(shift),
          shift.created_at,
          shift.updated_at,
        ]
      );
    }
  },

  async getShifts(driverId: string): Promise<Shift[]> {
    const database = await initDatabase();
    const result = await database.getAllAsync<{ data: string }>(
      'SELECT data FROM shifts WHERE driver_id = ? ORDER BY start_time DESC',
      [driverId]
    );
    return result.map(row => JSON.parse(row.data));
  },

  // Trips
  async saveTrips(trips: Trip[]) {
    const database = await initDatabase();
    for (const trip of trips) {
      await database.runAsync(
        `INSERT OR REPLACE INTO trips 
        (id, shift_id, trip_number, route_id, scheduled_departure, actual_departure, 
         scheduled_arrival, actual_arrival, status, passengers_count, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          trip.id,
          trip.shift_id,
          trip.trip_number,
          trip.route_id,
          trip.scheduled_departure,
          trip.actual_departure || null,
          trip.scheduled_arrival || null,
          trip.actual_arrival || null,
          trip.status,
          trip.passengers_count,
          JSON.stringify(trip),
          trip.created_at,
          trip.updated_at,
        ]
      );
    }
  },

  async getTrips(shiftId: string): Promise<Trip[]> {
    const database = await initDatabase();
    const result = await database.getAllAsync<{ data: string }>(
      'SELECT data FROM trips WHERE shift_id = ? ORDER BY scheduled_departure',
      [shiftId]
    );
    return result.map(row => JSON.parse(row.data));
  },

  // Manifest
  async saveManifest(manifest: Manifest[]) {
    const database = await initDatabase();
    for (const item of manifest) {
      await database.runAsync(
        `INSERT OR REPLACE INTO manifest 
        (id, trip_id, passenger_name, seat_number, booking_reference, 
         checked_in, check_in_time, status, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.trip_id,
          item.passenger_name,
          item.seat_number,
          item.booking_reference || null,
          item.checked_in ? 1 : 0,
          item.check_in_time || null,
          item.status,
          JSON.stringify(item),
          item.created_at,
          item.updated_at,
        ]
      );
    }
  },

  async getManifest(tripId: string): Promise<Manifest[]> {
    const database = await initDatabase();
    const result = await database.getAllAsync<{ data: string }>(
      'SELECT data FROM manifest WHERE trip_id = ? ORDER BY seat_number',
      [tripId]
    );
    return result.map(row => JSON.parse(row.data));
  },

  // Sync Queue
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'created_at' | 'synced'>) {
    const database = await initDatabase();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await database.runAsync(
      `INSERT INTO sync_queue (id, action, table_name, data, created_at, synced)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [id, item.action, item.table, JSON.stringify(item.data), new Date().toISOString()]
    );
    return id;
  },

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const database = await initDatabase();
    const result = await database.getAllAsync<{
      id: string;
      action: string;
      table_name: string;
      data: string;
      created_at: string;
      synced: number;
      synced_at: string | null;
      error: string | null;
    }>('SELECT * FROM sync_queue WHERE synced = 0 ORDER BY created_at');
    
    return result.map(row => ({
      id: row.id,
      action: row.action as any,
      table: row.table_name,
      data: JSON.parse(row.data),
      created_at: row.created_at,
      synced: row.synced === 1,
      synced_at: row.synced_at || undefined,
      error: row.error || undefined,
    }));
  },

  async markSynced(id: string) {
    const database = await initDatabase();
    await database.runAsync(
      'UPDATE sync_queue SET synced = 1, synced_at = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );
  },

  async markSyncError(id: string, error: string) {
    const database = await initDatabase();
    await database.runAsync(
      'UPDATE sync_queue SET error = ? WHERE id = ?',
      [error, id]
    );
  },

  async clearSyncQueue() {
    const database = await initDatabase();
    await database.runAsync('DELETE FROM sync_queue WHERE synced = 1');
  },
};

export { STORAGE_KEYS };
