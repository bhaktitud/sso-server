import { PartialType } from '@nestjs/swagger';
import { CreateApikeyDto } from './create-apikey.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateApikeyDto extends PartialType(CreateApikeyDto) {
  @ApiPropertyOptional({
    description: 'Mengaktifkan atau menonaktifkan API key',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
