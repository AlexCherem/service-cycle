import type { AuthenticatedRequest } from '../auth/authenticated-user.type';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';

jest.mock('@nestjs/jwt', () => ({
  JwtService: class JwtService {},
}));

type EquipmentServiceMock = {
  findAll: jest.Mock;
};

describe('EquipmentController', () => {
  let equipmentController: EquipmentController;
  let equipmentService: EquipmentServiceMock;

  beforeEach(() => {
    equipmentService = {
      findAll: jest.fn(),
    };

    equipmentController = new EquipmentController(
      equipmentService as unknown as EquipmentService,
    );
  });

  it('gets companyId from authenticated user and passes it to service', async () => {
    const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';

    const request = {
      user: {
        userId: '33acfe7d-09e8-44d5-8f73-f7311fcb5fd4',
        companyId,
      },
    } as unknown as AuthenticatedRequest;

    const query = {
      page: 2,
      limit: 10,
    };

    const serviceResult = {
      items: [],
      total: 0,
      page: 2,
      limit: 10,
    };

    equipmentService.findAll.mockResolvedValue(serviceResult);

    const result = await equipmentController.findAll(request, query);

    expect(equipmentService.findAll).toHaveBeenCalledWith(companyId, query);

    expect(result).toBe(serviceResult);
  });
});
