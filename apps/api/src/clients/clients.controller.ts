import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/access-token.guard';
import { ACCESS_TOKEN_COOKIE_NAME } from '../auth/auth.constants';
import type { AuthenticatedRequest } from '../auth/authenticated-user.type';
import { ClientsService } from './clients.service';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import {
  ClientListItemDto,
  ListClientsResponseDto,
} from './dto/list-clients-response.dto';

@ApiTags('clients')
@Controller()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('companies/:companyId/clients')
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

  @Get('clients/:clientId')
  @UseGuards(AccessTokenGuard)
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({
    summary: 'Получить детальную карточку клиента',
  })
  @ApiOkResponse({
    description: 'Клиент с оборудованием',
    type: ClientListItemDto,
  })
  @ApiBadRequestResponse({
    description: 'Некорректный идентификатор клиента',
  })
  @ApiUnauthorizedResponse({
    description: 'Access token отсутствует или недействителен',
  })
  @ApiNotFoundResponse({
    description: 'Клиент не найден',
  })
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ): Promise<ClientListItemDto> {
    return this.clientsService.findOne(request.user.companyId, clientId);
  }
}
