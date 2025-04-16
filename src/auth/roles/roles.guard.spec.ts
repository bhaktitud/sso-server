import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { Role } from './roles.enum';
import { ROLES_KEY } from './roles.decorator';

// Mock Reflector
const mockReflector = {
  getAllAndOverride: jest.fn(),
};

// Helper untuk membuat mock ExecutionContext
const createMockExecutionContext = (
  user: any,
  requiredRoles?: Role[],
): ExecutionContext => {
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => ({ user })),
    })),
  } as any;

  // Setup mockReflector.getAllAndOverride berdasarkan context ini
  mockReflector.getAllAndOverride.mockImplementation((key, targets) => {
    if (key === ROLES_KEY) {
      // Periksa apakah target yang diberikan cocok (meskipun tidak kritikal untuk test ini)
      // console.log('Targets:', targets, [context.getHandler(), context.getClass()]);
      return requiredRoles;
    }
    return undefined;
  });

  return context;
};

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: typeof mockReflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if no roles are required', () => {
    // Buat mock context tanpa requiredRoles
    const mockContext = createMockExecutionContext(
      { id: 1, role: Role.USER },
      undefined,
    );
    // reflector.getAllAndOverride akan di-mock untuk mengembalikan undefined oleh helper

    const canActivate = guard.canActivate(mockContext);

    expect(canActivate).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      mockContext.getHandler(),
      mockContext.getClass(),
    ]);
  });

  it('should allow access if user has the required role', () => {
    const requiredRoles = [Role.ADMIN];
    const user = { id: 1, role: Role.ADMIN };
    const mockContext = createMockExecutionContext(user, requiredRoles);

    const canActivate = guard.canActivate(mockContext);

    expect(canActivate).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      mockContext.getHandler(),
      mockContext.getClass(),
    ]);
  });

  it('should deny access if user does not have the required role', () => {
    const requiredRoles = [Role.ADMIN];
    const user = { id: 1, role: Role.USER }; // User adalah USER, butuh ADMIN
    const mockContext = createMockExecutionContext(user, requiredRoles);

    const canActivate = guard.canActivate(mockContext);

    expect(canActivate).toBe(false);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      mockContext.getHandler(),
      mockContext.getClass(),
    ]);
  });

  it('should deny access if user is not present in request', () => {
    const requiredRoles = [Role.USER];
    // User adalah null atau undefined
    const mockContext = createMockExecutionContext(null, requiredRoles);

    const canActivate = guard.canActivate(mockContext);

    expect(canActivate).toBe(false);
    // reflector masih dipanggil, tapi pengecekan user akan gagal
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      mockContext.getHandler(),
      mockContext.getClass(),
    ]);
  });

  it('should deny access if user object does not have a role', () => {
    const requiredRoles = [Role.USER];
    // User ada, tapi tidak punya properti role
    const userWithoutRole = { id: 1 };
    const mockContext = createMockExecutionContext(
      userWithoutRole,
      requiredRoles,
    );

    const canActivate = guard.canActivate(mockContext);

    expect(canActivate).toBe(false);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      mockContext.getHandler(),
      mockContext.getClass(),
    ]);
  });

  // --- Test cases lainnya akan ditambahkan di sini ---
});
