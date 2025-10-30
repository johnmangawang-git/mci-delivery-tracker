/**
 * CENTRALIZED SUPABASE CLIENT
 * Single source of truth for all Supabase operations
 * Prevents multiple client instances and ensures consistent schema usage
 */

console.log('🔧 Loading Centralized Supabase Client...');

// Supabase configuration
const SUPABASE_URL = 'https://ntyvrezyhrmflswxefbk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eXZyZXp5aHJtZmxzd3hlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjUzNTgsImV4cCI6MjA3MDY0MTM1OH0.JX0YP42_40lKQ1ghUmIA_Lu0YVZB_Ytl0EdQinU0Nm4';

// Global client instance - singleton pattern
l