import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { EquipmentDetailsResponseDto } from './dto/equipment-details-response.dto';
import { ListEquipmentQueryDto } from './dto/list-equipment-query.dto';
import { ListEquipmentResponseDto } from './dto/list-equipment-response.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
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

  @Get(':equipmentId')
  @ApiOperation({
    summary: 'Получить детальную карточку оборудования',
  })
  @ApiOkResponse({
    description: 'Оборудование с техническими полями, датами и клиентом',
    type: EquipmentDetailsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Некорректный идентификатор оборудования',
  })
  @ApiUnauthorizedResponse({
    description: 'Access token отсутствует или недействителен',
  })
  @ApiNotFoundResponse({
    description: 'Оборудование не найдено',
  })
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('equipmentId', ParseUUIDPipe) equipmentId: string,
  ): Promise<EquipmentDetailsResponseDto> {
    return this.equipmentService.findOne(request.user.companyId, equipmentId);
  }

  @Patch(':equipmentId')
  @ApiOperation({
    summary: 'Частично обновить оборудование',
  })
  @ApiOkResponse({
    description: 'Обновлённая карточка оборудования',
    type: EquipmentDetailsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Некорректный идентификатор или данные оборудования',
  })
  @ApiUnauthorizedResponse({
    description: 'Access token отсутствует или недействителен',
  })
  @ApiNotFoundResponse({
    description: 'Оборудование не найдено',
  })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('equipmentId', ParseUUIDPipe) equipmentId: string,
    @Body() dto: UpdateEquipmentDto,
  ): Promise<EquipmentDetailsResponseDto> {
    return this.equipmentService.update(
      request.user.companyId,
      equipmentId,
      dto,
    );
  }
}
