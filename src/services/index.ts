import type { DataService } from './dataService';
import { mockService } from './mockData';

// Swap this to a real implementation when the backend is ready.
// No component should import from mockData or civicApi directly.
export const service: DataService = mockService;
