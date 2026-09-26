import { PrismaService } from '../infra/prisma/prisma.service';

type Mock = jest.Mock;

/**
 * Mock do `PrismaService` com apenas os delegates usados pelo módulo
 * `virtual-tours`. Cada método é um `jest.fn()`, então o teste decide o retorno
 * de cada consulta e pode verificar os argumentos recebidos.
 */
export interface PrismaMock {
  property: { findFirst: Mock };
  virtualTour: {
    findUnique: Mock;
    findFirst: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
  };
  panorama: { create: Mock; findFirst: Mock };
  measurement: { createMany: Mock };
  hotspot: { create: Mock };
  visitor: { upsert: Mock };
  view: { create: Mock; count: Mock; aggregate: Mock };
  share: { create: Mock; count: Mock };
  $transaction: Mock;
}

/**
 * `$transaction` executa o callback recebendo o próprio mock como `tx`, de forma
 * que o corpo da transação roda de verdade no teste e as chamadas feitas dentro
 * dela podem ser inspecionadas nos mesmos delegates.
 */
export function createPrismaMock(): PrismaMock {
  const prisma: PrismaMock = {
    property: { findFirst: jest.fn() },
    virtualTour: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    panorama: { create: jest.fn(), findFirst: jest.fn() },
    measurement: { createMany: jest.fn() },
    hotspot: { create: jest.fn() },
    visitor: { upsert: jest.fn() },
    view: { create: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
    share: { create: jest.fn(), count: jest.fn() },
    $transaction: jest.fn(),
  };

  prisma.$transaction.mockImplementation((fn: (tx: PrismaMock) => unknown) =>
    fn(prisma),
  );

  return prisma;
}

/** Entrega o mock com o tipo esperado pelo construtor dos services. */
export function asPrismaService(prisma: PrismaMock): PrismaService {
  return prisma as unknown as PrismaService;
}
