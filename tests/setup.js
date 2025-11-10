/**
 * Test Setup File
 * Configures the testing environment with necessary mocks and globals
 */

import { vi } from 'vitest';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  insert: vi.fn(() => mockSupabaseClient),
  update: vi.fn(() => mockSupabaseClient),
  delete: vi.fn(() => mockSupabaseClient),
  upsert: vi.fn(() => mockSupabaseClient),
  eq: vi.fn(() => mockSupabaseClient),
  in: vi.fn(() => mockSupabaseClient),
  order: vi.fn(() => mockSupabaseClient),
  range: vi.fn(() => mockSupabaseClient),
  maybeSingle: vi.fn(() => mockSupabaseClient),
  single: vi.fn(() => mockSupabaseClient)
};

// Setup global mocks
global.window = {
  supabaseClient: vi.fn(() => mockSupabaseClient),
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  },
  ErrorHandler: {
    handle: vi.fn()
  },
  networkStatusService: {
    getStatus: vi.fn(() => true)
  }
};

// Export mock for use in tests
export { mockSupabaseClient };
