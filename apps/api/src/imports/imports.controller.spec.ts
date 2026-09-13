import { StreamableFile } from '@nestjs/common';

import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';

type ImportsServiceMock = {
  createTemplate: jest.Mock;
};

describe('ImportsController', () => {
  let importsController: ImportsController;
  let importsService: ImportsServiceMock;

  beforeEach(() => {
    importsService = {
      createTemplate: jest.fn(),
    };

    importsController = new ImportsController(
      importsService as unknown as ImportsService,
    );
  });

  describe('downloadTemplate', () => {
    it('returns generated Excel template', async () => {
      const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
      const template = Buffer.from('excel template');

      importsService.createTemplate.mockResolvedValue(template);

      const result = await importsController.downloadTemplate(companyId);

      expect(importsService.createTemplate).toHaveBeenCalledWith(companyId);
      expect(result).toBeInstanceOf(StreamableFile);

      expect(result.getHeaders()).toEqual({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        disposition:
          'attachment; filename="service-cycle-client-import-template.xlsx"',
        length: template.length,
      });
    });
  });
});
