import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Basic test utilities
export const testUtils = {
  // Mock fetch
  mockFetch: (response: any, status = 200) => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(response),
        text: () => Promise.resolve(JSON.stringify(response)),
      } as Response)
    );
  },

  // Mock localStorage
  mockLocalStorage: () => {
    const store: Record<string, string> = {};
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
    };
  },

  // Wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Create mock user
  createMockUser: () => ({
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  }),

  // Create mock task
  createMockTask: () => ({
    id: '1',
    summary: 'Test Task',
    description: 'Test Description',
    priority: 'NORMAL',
    status: { id: '1', name: 'To Do', key: 'TODO' },
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
};

// Example test file structure
export const exampleTest = `
import { describe, it, expect } from '@jest/globals';
import { testUtils } from '@/lib/test-utils';

describe('Auth API', () => {
  beforeEach(() => {
    testUtils.mockFetch({ success: true });
  });

  it('should authenticate user', async () => {
    const response = await fetch('/api/auth/me');
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
`;

// Test configuration helper
export const testConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};
















