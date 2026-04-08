import type { DataService } from './dataService';
import { supabaseService } from './supabaseService';

// Uses Supabase for reads, temporary client-side writes until Edge Functions (B3).
// To revert to mock data: import { mockService } from './mockData' and swap below.
export const service: DataService = supabaseService;
