import { Controller, Get, Post, Body, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiSecurity,
  ApiBody,
} from '@nestjs/swagger';
import { RequireApiKey } from '@src/auth/decorators/require-apikey.decorator';

// DTO untuk contoh data
class ExampleDataDto {
  id: number;
  name: string;
}

// DTO untuk request example
class CreateExampleDto {
  name: string;
  description?: string;
}

// Response untuk get data
class GetExampleResponseDto {
  message: string;
  companyId: number;
  timestamp: string;
  data: ExampleDataDto[];
}

// Response untuk create data
class CreateExampleResponseDto {
  message: string;
  companyId: number;
  timestamp: string;
  data: ExampleDataDto;
}

@ApiTags('api-examples')
@Controller('api/examples')
@ApiSecurity('api-key')
@ApiHeader({
  name: 'X-API-KEY',
  description: 'API key untuk autentikasi',
  required: true,
})
@RequireApiKey()
export class ExampleController {
  @Get()
  @ApiOperation({ summary: 'Mendapatkan contoh data' })
  @ApiResponse({
    status: 200,
    description: 'Data berhasil diambil',
    type: GetExampleResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'API key tidak valid atau tidak ditemukan',
  })
  getData(@Request() req) {
    // Mendapatkan info API key dari request (ditambahkan oleh ApiKeyGuard)
    const apiKey = req['apiKey'];

    return {
      message: 'Data berhasil diambil',
      companyId: apiKey.companyId,
      timestamp: new Date().toISOString(),
      data: [
        { id: 1, name: 'Contoh 1' },
        { id: 2, name: 'Contoh 2' },
        { id: 3, name: 'Contoh 3' },
      ],
    };
  }

  @Post()
  @ApiOperation({ summary: 'Membuat contoh data baru' })
  @ApiBody({ type: CreateExampleDto })
  @ApiResponse({
    status: 201,
    description: 'Data berhasil dibuat',
    type: CreateExampleResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'API key tidak valid atau tidak ditemukan',
  })
  createData(@Body() body: CreateExampleDto, @Request() req) {
    // Mendapatkan info API key dari request (ditambahkan oleh ApiKeyGuard)
    const apiKey = req['apiKey'];

    return {
      message: 'Data berhasil dibuat',
      companyId: apiKey.companyId,
      timestamp: new Date().toISOString(),
      data: {
        id: 4,
        ...body,
      },
    };
  }
}
