import type { AuthenticatedRequest } from '../auth/authenticated-user.type';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';

jest.mock('@nestjs/jwt', () => ({
  JwtService: class JwtService {},
}));

type EquipmentServiceMock = {
  findAll: jest.Mock;
  findOne: jest.Mock;
  update: jest.Mock;
};

describe('EquipmentController', () => {
  let equipmentController: EquipmentController;
  let equipmentService: EquipmentServiceMock;

  beforeEach(() => {
    equipmentService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    equipmentController = new EquipmentController(
      equipmentService as unknown as EquipmentService,
    );
  });

  it('updates using the company from the authenticated user', async () => {
    const request = {
      user: { companyId: 'company-a' },
      query: { companyId: 'company-b' },
    } as unknown as AuthenticatedRequest;
    const dto = { notes: null };
    const updated = { id: 'equipment-a', notes: null };
    equipmentService.update.mockResolvedValue(updated);
    await expect(
      equipmentController.update(request, 'equipment-a', dto),
    ).resolves.toBe(updated);
    expect(equipmentService.update).toHaveBeenCalledWith(
      'company-a',
      'equipment-a',
      dto,
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

  it('gets equipment details using companyId from the authenticated user', async () => {
    const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
    const equipmentId = '960ae682-3486-4fd5-8709-76b650582f84';

    const request = {
      user: {
        userId: '33acfe7d-09e8-44d5-8f73-f7311fcb5fd4',
        companyId,
      },
      query: {
        companyId: '11111111-1111-4111-8111-111111111111',
      },
    } as unknown as AuthenticatedRequest;

    const serviceResult = { id: equipmentId };

    equipmentService.findOne.mockResolvedValue(serviceResult);

    const result = await equipmentController.findOne(request, equipmentId);

    expect(equipmentService.findOne).toHaveBeenCalledWith(
      companyId,
      equipmentId,
    );
    expect(result).toBe(serviceResult);
  });
});
