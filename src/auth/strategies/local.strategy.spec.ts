import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '@src/auth/auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '../roles/roles.enum';

// Mock AuthService
const mockAuthService = {
  validateUser: jest.fn(),
};

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: typeof mockAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const mockUser = {
      id: 1,
      email,
      name: 'Test User',
      role: Role.USER,
      // Properti lain yang mungkin dikembalikan oleh validateUser
    };

    it('should call authService.validateUser with email and password', async () => {
      authService.validateUser.mockResolvedValue(mockUser);
      await strategy.validate(email, password);
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should return the user if validation is successful', async () => {
      authService.validateUser.mockResolvedValue(mockUser);
      const result = await strategy.validate(email, password);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if validation fails', async () => {
      // Mock validateUser mengembalikan null
      authService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(email, password)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });
  });
});
