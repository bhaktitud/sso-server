import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  action: string; // e.g., read, create, manage

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  subject: string; // e.g., Order, User, Product
}

// Tambahkan ini untuk mencoba mengatasi error 'is not a module'
export {};
