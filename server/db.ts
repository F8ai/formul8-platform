import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// In development mode, allow server to start without database
const isDevelopment = process.env.NODE_ENV === 'development';
const hasDatabaseUrl = process.env.DATABASE_URL && process.env.DATABASE_URL !== 'postgresql://placeholder:placeholder@localhost:5432/formul8_placeholder';

if (!hasDatabaseUrl && !isDevelopment) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create mock database for development
let pool: Pool | null = null;
let db: any = null;

if (hasDatabaseUrl) {
  // Create pool with proper error handling
  pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 10
  });

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Database pool error:', err);
  });

  db = drizzle({ client: pool, schema });
} else {
  // Mock database for development
  console.log('⚠️  Running in development mode without database connection');
  console.log('📊 API endpoints will return mock data');
  
  db = {
    // Mock database methods
    query: async () => ({ rows: [] }),
    execute: async () => ({ rows: [] }),
    select: () => ({ from: () => ({ where: () => ({ execute: async () => ({ rows: [] }) }) }) }),
    insert: () => ({ values: () => ({ execute: async () => ({ rows: [] }) }) }),
    update: () => ({ set: () => ({ where: () => ({ execute: async () => ({ rows: [] }) }) }) }),
    delete: () => ({ where: () => ({ execute: async () => ({ rows: [] }) }) })
  };
}

export { pool, db };