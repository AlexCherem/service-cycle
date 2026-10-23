import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';

import { configureApiRouting } from '../api-routing.config';
import { ACCESS_TOKEN_COOKIE_NAME } from '../auth/auth.constants';
import { PrismaService } from '../database/prisma/prisma.service';
import { EquipmentServiceStatus } from '../equipment/dto/equipment-service-status.enum';
import { Prisma } from '../generated/prisma/client';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

jest.mock('@nestjs/jwt', () => ({
  JwtService: class JwtService {},
}));

const companyId = '7cfad2ad-8c32-4614-bd68-4882d7998655';
const clientId = '8810c8d6-67ee-49bd-82c8-4cd4865e9ac5';
const path = `/api/v1/clients/${clientId}`;
const authCookie = `${ACCESS_TOKEN_COOKIE_NAME}=test-access-token`;

// Exercise routing, the actual guard, DTO validation and service; replace only
// token verification and database I/O. JWT cryptography is outside this suite.
describe('ClientsController (HTTP)', () => {
  let app: INestApplication<App>;
  const prisma = {
    company: { findUnique: jest.fn() },
    client: { create: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
  };
  const jwt = { verifyAsync: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    app = module.createNestApplication();
    configureApiRouting(app);
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    jwt.verifyAsync.mockResolvedValue({
      sub: 'user-a',
      companyId,
      type: 'access',
    });
    prisma.client.update.mockResolvedValue({ id: clientId });
    prisma.client.findFirst.mockResolvedValue({
      id: clientId,
      name: 'Иван',
      phone: null,
      email: null,
      notes: 'Существующее примечание',
      equipment: [
        {
          id: '960ae682-3486-4fd5-8709-76b650582f84',
          name: 'Котёл',
          installationDate: null,
          lastServiceDate: null,
          nextServiceDate: null,
        },
      ],
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('POST /api/v1/clients', () => {
    const createPath = '/api/v1/clients';
    const valid = { name: 'Иван', phone: '+375291234567' };

    beforeEach(() => {
      prisma.company.findUnique.mockResolvedValue({ id: companyId });
      prisma.client.create.mockResolvedValue({ id: clientId });
      prisma.client.findFirst.mockResolvedValue({
        id: clientId,
        ...valid,
        email: null,
        notes: null,
        equipment: [],
      });
    });

    it('returns 201 and uses the token company instead of query parameters', async () => {
      await request(app.getHttpServer())
        .post(`${createPath}?companyId=another-company`)
        .set('Cookie', authCookie)
        .send({ name: '  Иван  ', phone: '8 029 123-45-67' })
        .expect(201)
        .expect({
          id: clientId,
          ...valid,
          email: null,
          notes: null,
          equipment: [],
        });

      expect(prisma.client.create).toHaveBeenCalledWith({
        data: { companyId, ...valid, email: undefined, notes: undefined },
        select: { id: true },
      });
      expect(prisma.client.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: clientId, companyId } }),
      );
    });

    it('normalizes optional contact and note fields before saving', async () => {
      await request(app.getHttpServer())
        .post(createPath)
        .set('Cookie', authCookie)
        .send({
          ...valid,
          email: ' IVAN@Example.com ',
          notes: '  Позвонить за час.  ',
        })
        .expect(201);

      expect(prisma.client.create).toHaveBeenCalledWith({
        data: {
          companyId,
          ...valid,
          email: 'ivan@example.com',
          notes: 'Позвонить за час.',
        },
        select: { id: true },
      });
    });

    it('allows explicit null optional fields', async () => {
      await request(app.getHttpServer())
        .post(createPath)
        .set('Cookie', authCookie)
        .send({ ...valid, email: null, notes: null })
        .expect(201);

      expect(prisma.client.create).toHaveBeenCalledWith({
        data: { companyId, ...valid, email: null, notes: null },
        select: { id: true },
      });
    });

    it.each([
      {},
      { phone: valid.phone },
      { name: valid.name },
      { ...valid, name: null },
      { ...valid, name: '   ' },
      { ...valid, phone: null },
      { ...valid, phone: '' },
      { ...valid, phone: '123' },
      { ...valid, email: 'incorrect-email' },
      { ...valid, notes: 'а'.repeat(301) },
      { ...valid, companyId: 'another-company' },
      { ...valid, id: clientId },
      { ...valid, equipment: [] },
    ])(
      'rejects invalid or forbidden input before accessing the database: %j',
      async (body) => {
        await request(app.getHttpServer())
          .post(createPath)
          .set('Cookie', authCookie)
          .send(body)
          .expect(400);

        expect(prisma.company.findUnique).not.toHaveBeenCalled();
        expect(prisma.client.create).not.toHaveBeenCalled();
      },
    );

    it.each(['missing', 'invalid', 'refresh'])(
      'rejects %s access credentials',
      async (credentials) => {
        if (credentials === 'invalid')
          jwt.verifyAsync.mockRejectedValue(new Error('Invalid token'));
        if (credentials === 'refresh')
          jwt.verifyAsync.mockResolvedValue({
            sub: 'user-a',
            companyId,
            type: 'refresh',
          });

        const req = request(app.getHttpServer()).post(createPath);
        if (credentials !== 'missing') req.set('Cookie', authCookie);
        await req.send(valid).expect(401);

        expect(prisma.company.findUnique).not.toHaveBeenCalled();
        expect(prisma.client.create).not.toHaveBeenCalled();
      },
    );

    it('returns 404 without creating a client when the company is missing', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post(createPath)
        .set('Cookie', authCookie)
        .send(valid)
        .expect(404);

      expect(prisma.client.create).not.toHaveBeenCalled();
    });

    it('returns 409 without updating a client when the phone already exists', async () => {
      prisma.client.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Duplicate phone', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await request(app.getHttpServer())
        .post(createPath)
        .set('Cookie', authCookie)
        .send(valid)
        .expect(409)
        .expect(({ body }: { body: { message: string } }) => {
          expect(body.message).toBe(
            'Клиент с таким телефоном уже существует в компании',
          );
        });

      expect(prisma.client.update).not.toHaveBeenCalled();
      expect(prisma.client.findFirst).not.toHaveBeenCalled();
    });

    it('documents authentication, statuses and required fields in OpenAPI', () => {
      const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
          .addCookieAuth(
            ACCESS_TOKEN_COOKIE_NAME,
            { type: 'apiKey' },
            ACCESS_TOKEN_COOKIE_NAME,
          )
          .build(),
      );
      const operation = document.paths[createPath].post;

      expect(operation?.security).toEqual([{ [ACCESS_TOKEN_COOKIE_NAME]: [] }]);
      for (const status of ['201', '400', '401', '404', '409']) {
        expect(operation?.responses).toHaveProperty(status);
      }
      expect(operation?.responses).not.toHaveProperty('200');
      expect(operation?.responses['201']).toHaveProperty(
        'content.application/json.schema.$ref',
        '#/components/schemas/ClientListItemDto',
      );

      const schema = document.components?.schemas?.CreateClientDto;
      expect(schema).toHaveProperty('required', ['name', 'phone']);
      expect(schema).not.toHaveProperty('properties.phone.nullable', true);
      expect(schema).toHaveProperty('properties.email.nullable', true);
      expect(schema).toHaveProperty('properties.notes.maxLength', 300);
      expect(schema).not.toHaveProperty('properties.companyId');
      expect(schema).not.toHaveProperty('properties.equipment');
    });
  });

  it('normalizes changes and uses companyId from the token instead of query', async () => {
    await request(app.getHttpServer())
      .patch(`${path}?companyId=company-b`)
      .set('Cookie', authCookie)
      .send({
        name: ' Иван ',
        phone: '8 029 123-45-67',
        email: ' IVAN@example.com ',
      })
      .expect(200)
      .expect(({ body }: { body: { equipment: { status: string }[] } }) => {
        expect(body.equipment[0].status).toBe(
          EquipmentServiceStatus.UNSCHEDULED,
        );
      });
    expect(prisma.client.update).toHaveBeenCalledWith({
      where: { id: clientId, companyId },
      data: { name: 'Иван', phone: '+375291234567', email: 'ivan@example.com' },
      select: { id: true },
    });
    expect(prisma.client.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: clientId, companyId },
      }),
    );
  });

  it('clears email without changing omitted name and phone', async () => {
    await request(app.getHttpServer())
      .patch(path)
      .set('Cookie', authCookie)
      .send({ email: null })
      .expect(200);

    expect(prisma.client.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: undefined, phone: undefined, email: null },
      }),
    );
  });

  it('returns notes in the client details', async () => {
    await request(app.getHttpServer())
      .get(path)
      .set('Cookie', authCookie)
      .expect(200)
      .expect(({ body }: { body: { notes: string } }) => {
        expect(body.notes).toBe('Существующее примечание');
      });

    expect(prisma.client.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: clientId, companyId },
      }),
    );
    expect(prisma.client.findFirst.mock.calls[0]).toHaveProperty(
      '0.select.notes',
      true,
    );
  });

  it.each([
    {
      input: '  Перед визитом позвонить.\nКод: AbC.  ',
      notes: 'Перед визитом позвонить.\nКод: AbC.',
    },
    { input: 'а'.repeat(300), notes: 'а'.repeat(300) },
    { input: null, notes: null },
  ])('saves and returns notes: %j', async ({ input, notes }) => {
    prisma.client.findFirst.mockResolvedValueOnce({
      id: clientId,
      name: 'Иван',
      phone: '+375291234567',
      email: null,
      notes,
      equipment: [],
    });

    await request(app.getHttpServer())
      .patch(path)
      .set('Cookie', authCookie)
      .send({ notes: input })
      .expect(200)
      .expect(({ body }: { body: { notes: string | null } }) => {
        expect(body.notes).toBe(notes);
      });

    expect(prisma.client.update).toHaveBeenCalledWith({
      where: { id: clientId, companyId },
      data: { name: undefined, phone: undefined, email: undefined, notes },
      select: { id: true },
    });
  });

  it('does not write notes when omitted from PATCH', async () => {
    await request(app.getHttpServer())
      .patch(path)
      .set('Cookie', authCookie)
      .send({ name: 'Новое имя' })
      .expect(200)
      .expect(({ body }: { body: { notes: string } }) => {
        expect(body.notes).toBe('Существующее примечание');
      });

    expect(prisma.client.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: clientId, companyId },
      }),
    );
    expect(prisma.client.update.mock.calls[0]).toHaveProperty(
      '0.data.notes',
      undefined,
    );
  });

  it('rejects unauthenticated requests before touching the database', async () => {
    await request(app.getHttpServer())
      .patch(path)
      .send({ name: 'Иван' })
      .expect(401);
    expect(prisma.client.update).not.toHaveBeenCalled();
  });

  it('rejects invalid access tokens', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('Invalid token'));
    await request(app.getHttpServer())
      .patch(path)
      .set('Cookie', authCookie)
      .send({ name: 'Иван' })
      .expect(401);
    expect(prisma.client.update).not.toHaveBeenCalled();
  });

  it('rejects a refresh token used as an access token', async () => {
    jwt.verifyAsync.mockResolvedValue({
      sub: 'user-a',
      companyId,
      type: 'refresh',
    });
    await request(app.getHttpServer())
      .patch(path)
      .set('Cookie', authCookie)
      .send({ name: 'Иван' })
      .expect(401);
    expect(prisma.client.update).not.toHaveBeenCalled();
  });

  it.each([
    { name: null },
    { phone: '123' },
    { phone: null },
    { phone: '' },
    { phone: '   ' },
    { email: '' },
    { companyId: 'company-b' },
    { notes: 'а'.repeat(301) },
    { notes: 123 },
    { notes: {} },
  ])(
    'rejects invalid or forbidden body before touching the database: %j',
    async (body) => {
      await request(app.getHttpServer())
        .patch(path)
        .set('Cookie', authCookie)
        .send(body)
        .expect(400);
      expect(prisma.client.update).not.toHaveBeenCalled();
    },
  );

  it('rejects invalid client UUIDs', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/clients/not-a-uuid')
      .set('Cookie', authCookie)
      .send({ name: 'Иван' })
      .expect(400);
    expect(prisma.client.update).not.toHaveBeenCalled();
  });

  it.each([
    { code: 'P2025', status: 404, message: 'Клиент не найден' },
    {
      code: 'P2002',
      status: 409,
      message: 'Клиент с таким телефоном уже существует в компании',
    },
  ])(
    'returns $status for Prisma error $code',
    async ({ code, status, message }) => {
      prisma.client.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Database error', {
          code,
          clientVersion: 'test',
        }),
      );
      await request(app.getHttpServer())
        .patch(path)
        .set('Cookie', authCookie)
        .send({ phone: '+375291234567' })
        .expect(status)
        .expect(({ body }: { body: { message: string } }) => {
          expect(body.message).toBe(message);
        });
      expect(prisma.client.findFirst).not.toHaveBeenCalled();
      expect(prisma.client.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: clientId, companyId },
        }),
      );
    },
  );

  it('publishes a protected PATCH route with optional fields and nullable email', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .addCookieAuth(
          ACCESS_TOKEN_COOKIE_NAME,
          { type: 'apiKey' },
          ACCESS_TOKEN_COOKIE_NAME,
        )
        .build(),
    );
    const operation = document.paths['/api/v1/clients/{clientId}'].patch;
    expect(operation?.security).toEqual([{ [ACCESS_TOKEN_COOKIE_NAME]: [] }]);
    for (const status of ['200', '400', '401', '404', '409']) {
      expect(operation?.responses).toHaveProperty(status);
    }
    const schema = document.components?.schemas?.UpdateClientDto;
    expect(schema).not.toHaveProperty('properties.phone.nullable', true);
    expect(schema).toHaveProperty('properties.email.nullable', true);
    expect(schema).toHaveProperty('properties.notes.nullable', true);
    expect(schema).toHaveProperty('properties.notes.maxLength', 300);
    expect(schema).not.toHaveProperty('required');
    const responseSchema = document.components?.schemas?.ClientListItemDto;
    expect(responseSchema).toHaveProperty('properties.notes.nullable', true);
    expect(responseSchema).toHaveProperty('properties.notes.maxLength', 300);
    expect(responseSchema).toHaveProperty(
      'required',
      expect.arrayContaining(['notes']),
    );
  });
});
