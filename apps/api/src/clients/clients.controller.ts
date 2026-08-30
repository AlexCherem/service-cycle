import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ClientsService } from './clients.service';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import { ListClientsResponseDto } from './dto/list-clients-response.dto';

@ApiTags('clients')
@Controller('companies/:companyId/clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({
    summary: 'Получить список клиентов компании',
  })
  @ApiOkResponse({
    description: 'Список клиентов с оборудованием',
    type: ListClientsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Некорректный идентификатор компании или параметры пагинации',
  })
  @ApiNotFoundResponse({
    description: 'Компания не найдена',
  })
  findAll(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query() query: ListClientsQueryDto,
  ): Promise<ListClientsResponseDto> {
    return this.clientsService.findAll(companyId, query);
  }
}
