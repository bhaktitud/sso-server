import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
