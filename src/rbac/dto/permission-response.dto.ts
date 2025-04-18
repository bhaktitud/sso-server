import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '../../../generated/mysql';

export class PermissionResponseDto implements Omit<Permission, 'roles'> {
  @ApiProperty()
  id: number;

  @ApiProperty()
  action: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
