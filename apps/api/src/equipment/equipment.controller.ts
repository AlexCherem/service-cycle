import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/access-token.guard';
import { ACCESS_TOKEN_COOKIE_NAME } from '../auth/auth.constants';
import type { AuthenticatedRequest } from '../auth/authenticated-user.type';
import { ListEquipmentQueryDto } from './dto/list-equipment-query.dto';
import { ListEquipmentResponseDto } from './dto/list-equipment-response.dto';
import { EquipmentService } from './equipment.service';

@ApiTags('equipment')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
@UseGuards(AccessTokenGuard)
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  @ApiOperation({
    summary: 'Получить список оборудования компании',
  })
  @ApiOkResponse({
    description: 'Список оборудования с клиентами и сервисными статусами',
    type: ListEquipmentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Некорректные параметры пагинации или фильтрации',
  })
  @ApiUnauthorizedResponse({
    description: 'Access token отсутствует или недействителен',
  })
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListEquipmentQueryDto,
  ): Promise<ListEquipmentResponseDto> {
    return this.equipmentService.findAll(request.user.companyId, query);
  }
}
