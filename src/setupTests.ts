// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Import test environment setup
import { testEnvironment, mockApiServer, testDataFactory } from './test/utils/testDatabaseSetup';
import { propertyTestResultTracker } from './test/config/propertyTestConfig';

// Global test setup
beforeAll(async () => {
  // Set up test environment
  await testEnvironment.setupTestEnvironment();
  
  // Reset test data factory
  testDataFactory.resetCounters();
  
  // Clear property test results
  propertyTestResultTracker.clear();
  
  console.log('🧪 Test environment initialized');
});

afterAll(async () => {
  // Clean up test environment
  await testEnvironment.cleanupTestEnvironment();
  
  // Reset mock API server
  mockApiServer.reset();
  
  // Log property test summary
  const summary = propertyTestResultTracker.getSummary();
  if (summary.total > 0) {
    console.log(`📊 Property Test Summary: ${summary.passed}/${summary.total} passed (${summary.passRate.toFixed(1)}%)`);
  }
  
  console.log('🧹 Test environment cleaned up');
});

beforeEach(() => {
  // Clear mock API server before each test
  mockApiServer.clearMocks();
  
  // Reset localStorage
  localStorage.clear();
  
  // Reset sessionStorage
  sessionStorage.clear();
});

afterEach(() => {
  // Clean up any test-specific state
  jest.clearAllMocks();
});

// Mock console methods to reduce test noise
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Restore console for specific test debugging
global.restoreConsole = () => {
  global.console = originalConsole;
};

// Mock WebSocket for tests
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: WebSocket.OPEN,
};

global.WebSocket = jest.fn(() => mockWebSocket) as any;

// Mock axios for consistent API testing
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
}));

// Extend Jest matchers for property testing
expect.extend({
  toSatisfyProperty(received: any, propertyName: string) {
    const pass = typeof received === 'boolean' && received === true;
    
    if (pass) {
      return {
        message: () => `Expected property "${propertyName}" to fail, but it passed`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected property "${propertyName}" to pass, but it failed`,
        pass: false,
      };
    }
  },
});

// Type declaration for custom matcher
declare global {
  namespace jest {
    interface Matchers<R> {
      toSatisfyProperty(propertyName: string): R;
    }
  }
  
  var restoreConsole: () => void;
}
