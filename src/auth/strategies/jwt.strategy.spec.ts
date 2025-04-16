import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

// Mock ConfigService
const mockConfigService = {
  get: jest.fn(),
};

// Spy fs.readFileSync asli
const mockReadFileSync = jest.spyOn(fs, 'readFileSync');

// Definisikan nilai-nilai mock
const mockPublicKeyString = `-----BEGIN PUBLIC KEY-----
mockPublicKeyContent
-----END PUBLIC KEY-----`;
const mockPathFromConfig = 'mock/path/public.pem';
const mockAlgorithmFromConfig = 'RS256';

// Definisikan tipe payload langsung di sini
interface TestJwtPayload {
  sub: number;
  email: string;
  name?: string | null;
  role: string; // Gunakan string
  companyId: number | null; // Harus ada, tidak opsional
}

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  beforeEach(async () => {
    // Reset mocks
    jest.resetAllMocks();

    // Setup mock ConfigService.get (perbaiki formatting lagi)
    mockConfigService.get.mockImplementation(
      (key: string, defaultValue?: any) => {
        if (key === 'JWT_PUBLIC_KEY_PATH') {
          return mockPathFromConfig;
        }
        if (key === 'JWT_ACCESS_ALGORITHM') {
          return mockAlgorithmFromConfig;
        }
        return defaultValue;
      },
    );

    // Setup mock fs.readFileSync (perbaiki formatting)
    mockReadFileSync.mockImplementation((path, encoding) => {
      if (path === mockPathFromConfig && encoding === 'utf8') {
        return mockPublicKeyString;
      }
      throw new Error(
        `Unexpected fs.readFileSync call in test with path: ${path}`,
      );
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should read public key using path and algorithm from ConfigService', () => {
    expect(mockConfigService.get).toHaveBeenCalledWith('JWT_PUBLIC_KEY_PATH');
    expect(mockConfigService.get).toHaveBeenCalledWith(
      'JWT_ACCESS_ALGORITHM',
      'RS256',
    );
    expect(mockReadFileSync).toHaveBeenCalledWith(mockPathFromConfig, 'utf8');
    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
  });

  describe('validate', () => {
    it('should return the user info from payload', () => {
      const payload: TestJwtPayload = {
        sub: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        companyId: null,
      };
      const result = strategy.validate(payload);
      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        companyId: payload.companyId,
      });
    });
    it('should handle payload with null name', () => {
      const payload: TestJwtPayload = {
        sub: 2,
        email: 'test2@example.com',
        name: null,
        role: 'ADMIN',
        companyId: 123,
      };
      const result = strategy.validate(payload);
      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
        name: null,
        role: payload.role,
        companyId: payload.companyId,
      });
    });
  });
});
