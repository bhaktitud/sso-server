import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// Gunakan nama strategi yang sama seperti di RefreshTokenStrategy
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {}
