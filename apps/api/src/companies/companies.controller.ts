import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CompaniesService } from './companies.service';
import { CompanyDto } from './dto/company.dto';
import { CreateCompanyDto } from './dto/create-company.dto';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'Создать компанию' })
  @ApiCreatedResponse({ type: CompanyDto })
  @ApiBadRequestResponse({ description: 'Некорректные входные данные' })
  create(@Body() createCompanyDto: CreateCompanyDto): Promise<CompanyDto> {
    return this.companiesService.create(createCompanyDto);
  }
}
