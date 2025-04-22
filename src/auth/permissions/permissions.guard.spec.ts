import { PermissionsGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PERMISSIONS_KEY } from './permissions.decorator';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);

    // Mock ExecutionContext
    mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
      }),
    } as unknown as ExecutionContext;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    
    const result = guard.canActivate(mockContext);
    
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when no user object is found', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read:feature']);
    
    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user has no permissions property', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read:feature']);
    
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: { userId: 1 },
    });
    
    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should allow access when user has all required permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read:feature']);
    
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: { userId: 1, permissions: ['read:feature', 'create:feature'] },
    });
    
    const result = guard.canActivate(mockContext);
    
    expect(result).toBe(true);
  });

  it('should deny access when user does not have required permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['update:feature']);
    
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: { userId: 1, permissions: ['read:feature', 'create:feature'] },
    });
    
    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should allow access for superuser with manage:all permission regardless of required permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['update:feature', 'delete:feature']);
    
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: { userId: 1, permissions: ['read:feature', 'manage:all'] },
    });
    
    const result = guard.canActivate(mockContext);
    
    expect(result).toBe(true);
  });
}); 