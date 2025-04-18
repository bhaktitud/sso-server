import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../../generated/mysql';

// Pilih field yang ingin diekspos
export class CompanyResponseDto implements Omit<Company, 'admins'> {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  description: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Kita sengaja tidak memasukkan 'admins' di sini
}
