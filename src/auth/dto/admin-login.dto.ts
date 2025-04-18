import { PickType } from '@nestjs/swagger';
import { LoginDto } from './login.dto';

// Jika field sama persis dengan LoginDto (email, password), gunakan PickType
export class AdminLoginDto extends PickType(LoginDto, [
  'email',
  'password',
] as const) {}
