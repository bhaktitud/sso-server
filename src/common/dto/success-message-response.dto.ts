import { ApiProperty } from '@nestjs/swagger';

/**
 * Generic success response with a message.
 */
export class SuccessMessageResponseDto {
  @ApiProperty({
    example: 'Operation successful',
    description: 'Success message',
  })
  message: string;
}
