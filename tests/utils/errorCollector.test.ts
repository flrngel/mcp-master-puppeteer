import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ErrorCollector } from '../../src/utils/errorCollector';
import { PageError } from '../../src/types';

describe('ErrorCollector', () => {
  let mockPage: any;
  let errorCollector: ErrorCollector;
  let eventHandlers: Map<string, Function>;

  beforeEach(() => {
    eventHandlers = new Map();
    mockPage = {
      on: jest.fn((event: string, handler: Function) => {
        eventHandlers.set(event, handler);
      }),
      off: jest.fn()
    };
    errorCollector = new ErrorCollector(mockPage);
  });

  describe('start', () => {
    it('should register event handlers', async () => {
      await errorCollector.start();
      
      expect(mockPage.on).toHaveBeenCalledWith('pageerror', expect.any(Function));
      expect(mockPage.on).toHaveBeenCalledWith('console', expect.any(Function));
      expect(mockPage.on).toHaveBeenCalledWith('response', expect.any(Function));
      expect(mockPage.on).toHaveBeenCalledWith('requestfailed', expect.any(Function));
    });
  });

  describe('error collection', () => {
    beforeEach(async () => {
      await errorCollector.start();
    });

    it('should collect JavaScript errors', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:10:5';
      
      const handler = eventHandlers.get('pageerror');
      handler?.(error);
      
      const errors = errorCollector.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        type: 'javascript',
        level: 'error',
        message: 'Test error'
      });
    });

    it('should collect console messages', () => {
      const mockMsg = {
        type: () => 'error',
        text: () => 'Console error message',
        location: () => ({
          url: 'https://example.com/script.js',
          lineNumber: 42,
          columnNumber: 15
        })
      };
      
      const handler = eventHandlers.get('console');
      handler?.(mockMsg);
      
      const errors = errorCollector.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        type: 'console',
        level: 'error',
        message: 'Console error message',
        source: 'https://example.com/script.js',
        line: 42,
        column: 15
      });
    });

    it('should collect network failures', () => {
      const mockResponse = {
        ok: () => false,
        status: () => 404,
        statusText: () => 'Not Found',
        url: () => 'https://example.com/missing.jpg'
      };
      
      const handler = eventHandlers.get('response');
      handler?.(mockResponse);
      
      const errors = errorCollector.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        type: 'network',
        level: 'warning',
        message: 'HTTP 404 Not Found',
        url: 'https://example.com/missing.jpg',
        statusCode: 404
      });
    });

    it('should mark 5xx errors as errors', () => {
      const mockResponse = {
        ok: () => false,
        status: () => 500,
        statusText: () => 'Internal Server Error',
        url: () => 'https://example.com/error'
      };
      
      const handler = eventHandlers.get('response');
      handler?.(mockResponse);
      
      const errors = errorCollector.getErrors();
      expect(errors[0].level).toBe('error');
    });

    it('should collect request failures', () => {
      const mockRequest = {
        failure: () => ({
          errorText: 'net::ERR_CORS_FAILED'
        }),
        url: () => 'https://example.com/api'
      };
      
      const handler = eventHandlers.get('requestfailed');
      handler?.(mockRequest);
      
      const errors = errorCollector.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        type: 'security',
        level: 'error',
        message: 'net::ERR_CORS_FAILED',
        url: 'https://example.com/api'
      });
    });
  });

  describe('getSummary', () => {
    beforeEach(async () => {
      await errorCollector.start();
    });

    it('should return correct summary', () => {
      // Add various types of errors
      const handlers = {
        pageerror: eventHandlers.get('pageerror'),
        console: eventHandlers.get('console')
      };
      
      // JavaScript error
      handlers.pageerror?.(new Error('JS Error'));
      
      // Console messages
      handlers.console?.({
        type: () => 'error',
        text: () => 'Console error',
        location: () => ({})
      });
      
      handlers.console?.({
        type: () => 'warning',
        text: () => 'Console warning',
        location: () => ({})
      });
      
      handlers.console?.({
        type: () => 'log',
        text: () => 'Console log',
        location: () => ({})
      });
      
      const summary = errorCollector.getSummary();
      expect(summary).toEqual({
        totalErrors: 2, // JS error + console error
        totalWarnings: 1,
        totalLogs: 1,
        hasJavaScriptErrors: true,
        hasNetworkErrors: false,
        hasConsoleLogs: true
      });
    });
  });

  describe('stop', () => {
    it('should remove all event handlers', async () => {
      await errorCollector.start();
      errorCollector.stop();
      
      expect(mockPage.off).toHaveBeenCalledTimes(4);
      expect(mockPage.off).toHaveBeenCalledWith('pageerror', expect.any(Function));
      expect(mockPage.off).toHaveBeenCalledWith('console', expect.any(Function));
      expect(mockPage.off).toHaveBeenCalledWith('response', expect.any(Function));
      expect(mockPage.off).toHaveBeenCalledWith('requestfailed', expect.any(Function));
    });
  });

  describe('clear', () => {
    it('should clear all collected errors', async () => {
      await errorCollector.start();
      
      // Add an error
      const handler = eventHandlers.get('pageerror');
      handler?.(new Error('Test'));
      
      expect(errorCollector.getErrors()).toHaveLength(1);
      
      errorCollector.clear();
      expect(errorCollector.getErrors()).toHaveLength(0);
    });
  });
});