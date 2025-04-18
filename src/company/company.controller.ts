// src/company/company.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Company } from '../../generated/mysql';

@ApiTags('Companies Management')
@Controller('companies')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new company' })
  @ApiBody({ type: CreateCompanyDto })
  @ApiResponse({
    status: 201,
    description: 'Company created successfully.',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  // TODO: Tambahkan Guard jika perlu (misal hanya Super Admin boleh buat company)
  create(@Body() createCompanyDto: CreateCompanyDto): Promise<Company> {
    return this.companyService.create(createCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of all companies' })
  @ApiResponse({
    status: 200,
    description: 'List of companies.',
    type: [CompanyResponseDto],
  })
  // TODO: Tambahkan Guard jika perlu
  findAll(): Promise<Company[]> {
    return this.companyService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific company by ID' })
  @ApiParam({ name: 'id', description: 'Company ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Company details.',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  // TODO: Tambahkan Guard jika perlu
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Company> {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a company' })
  @ApiParam({ name: 'id', description: 'Company ID', type: Number })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiResponse({
    status: 200,
    description: 'Company updated successfully.',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  // TODO: Tambahkan Guard jika perlu
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    return this.companyService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a company' })
  @ApiParam({ name: 'id', description: 'Company ID', type: Number })
  @ApiResponse({ status: 204, description: 'Company deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict (e.g., company still has admins).',
  })
  // TODO: Tambahkan Guard jika perlu
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.companyService.remove(id);
  }
}
