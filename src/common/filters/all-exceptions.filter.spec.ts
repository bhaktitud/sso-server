import { Test, TestingModule } from '@nestjs/testing';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';

// Mock ArgumentsHost dan konteks HTTP
const mockArgumentsHost = {
  switchToHttp: jest.fn(),
  getArgByIndex: jest.fn(),
  getArgs: jest.fn(),
  getType: jest.fn(),
  switchToRpc: jest.fn(),
  switchToWs: jest.fn(),
};

const mockHttpResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};

const mockHttpRequest = {
  url: '/test-url',
};

// Setup switchToHttp untuk mengembalikan mock request/response
mockArgumentsHost.switchToHttp.mockReturnValue({
  getResponse: () => mockHttpResponse,
  getRequest: () => mockHttpRequest,
});

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(async () => {
    // Tidak ada provider eksternal
    const module: TestingModule = await Test.createTestingModule({
      providers: [AllExceptionsFilter],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);

    // Reset mocks
    jest.clearAllMocks();
    // Re-setup mock switchToHttp (karena clearAllMocks)
    mockArgumentsHost.switchToHttp.mockReturnValue({
      getResponse: () => mockHttpResponse,
      getRequest: () => mockHttpRequest,
    });
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    it('should handle HttpException correctly', () => {
      const message = 'Forbidden resource';
      const status = HttpStatus.FORBIDDEN;
      const exception = new HttpException(message, status);

      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      expect(mockHttpResponse.status).toHaveBeenCalledWith(status);
      expect(mockHttpResponse.json).toHaveBeenCalledWith({
        statusCode: status,
        timestamp: expect.any(String), // Cek tipe string
        path: mockHttpRequest.url,
        message: message,
      });
    });

    it('should handle HttpException with object response correctly', () => {
      const message = ['email must be an email'];
      const error = 'Bad Request';
      const status = HttpStatus.BAD_REQUEST;
      const exception = new HttpException(
        { statusCode: status, message, error },
        status,
      );

      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      expect(mockHttpResponse.status).toHaveBeenCalledWith(status);
      expect(mockHttpResponse.json).toHaveBeenCalledWith({
        statusCode: status,
        timestamp: expect.any(String),
        path: mockHttpRequest.url,
        message: message, // Ambil message dari object response
      });
    });

    it('should handle non-HttpException Error correctly', () => {
      const exception = new Error('Some unexpected error');
      const status = HttpStatus.INTERNAL_SERVER_ERROR;
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(); // Spy console.error

      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      expect(mockHttpResponse.status).toHaveBeenCalledWith(status);
      expect(mockHttpResponse.json).toHaveBeenCalledWith({
        statusCode: status,
        timestamp: expect.any(String),
        path: mockHttpRequest.url,
        message: 'Internal server error', // Pesan generik
      });
      // Pastikan error asli di-log
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Unhandled Exception:',
        exception,
      );

      consoleErrorSpy.mockRestore(); // Bersihkan spy
    });

    it('should handle non-Error exceptions correctly', () => {
      const exception = 'just a string error'; // Bukan instance Error
      const status = HttpStatus.INTERNAL_SERVER_ERROR;
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      filter.catch(exception, mockArgumentsHost as ArgumentsHost);

      expect(mockHttpResponse.status).toHaveBeenCalledWith(status);
      expect(mockHttpResponse.json).toHaveBeenCalledWith({
        statusCode: status,
        timestamp: expect.any(String),
        path: mockHttpRequest.url,
        message: 'Internal server error', // Pesan generik
      });
      // Pastikan error asli di-log
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Unhandled Exception:',
        exception,
      );
      consoleErrorSpy.mockRestore();
    });
  });
});
