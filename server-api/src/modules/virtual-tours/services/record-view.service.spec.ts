import { NotFoundException } from '@nestjs/common';
import {
  asPrismaService,
  createPrismaMock,
  PrismaMock,
} from '../../../test/prisma-mock';
import { TOUR_ID } from '../../../test/virtual-tour.fixtures';
import { RecordViewService } from './record-view.service';

/**
 * US08 — Como corretor, quero que cada visita ao tour seja registrada, com
 * tempo de permanência e dispositivo, para acompanhar o interesse no imóvel.
 */
describe('RecordViewService (US08 — registro de visualizações)', () => {
  let prisma: PrismaMock;
  let service: RecordViewService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new RecordViewService(asPrismaService(prisma));
    prisma.virtualTour.findUnique.mockResolvedValue({ id: TOUR_ID });
    prisma.visitor.upsert.mockResolvedValue({ id: 'visitor-1' });
    prisma.view.create.mockResolvedValue({ id: 'view-1' });
  });

  it('CEN-32: registra a visualização vinculada ao visitante da sessão', async () => {
    // Dado um tour existente e um visitante identificado pela sessão
    const view = {
      id: 'view-1',
      viewedAt: new Date('2026-09-26T12:00:00Z'),
      durationSeconds: 120,
      device: 'mobile',
    };
    prisma.view.create.mockResolvedValue(view);

    // Quando a visualização é registrada com duração e dispositivo
    const resultado = await service.execute(TOUR_ID, {
      sessionId: 'sessao-abc',
      durationSeconds: 120,
      device: 'mobile',
    });

    // Então a visualização é gravada para aquele tour e visitante
    expect(prisma.view.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          virtualTourId: TOUR_ID,
          visitorId: 'visitor-1',
          durationSeconds: 120,
          device: 'mobile',
        },
      }),
    );
    expect(resultado).toBe(view);
  });

  it('CEN-33: reaproveita o visitante quando a sessão já foi vista antes', async () => {
    // Dado um visitante que já visitou tours antes (mesmo sessionId)
    // Quando uma nova visualização é registrada
    await service.execute(TOUR_ID, { sessionId: 'sessao-abc' });

    // Então o visitante é reaproveitado pela sessão, sem duplicar registro
    expect(prisma.visitor.upsert).toHaveBeenCalledWith({
      where: { sessionId: 'sessao-abc' },
      create: { sessionId: 'sessao-abc' },
      update: {},
    });
  });

  it('CEN-33.1: aceita visualização sem duração e sem dispositivo informados', async () => {
    // Dado um cliente que fechou o tour sem que a duração fosse medida
    // Quando a visualização é registrada apenas com a sessão
    await service.execute(TOUR_ID, { sessionId: 'sessao-abc' });

    // Então a visualização é gravada mesmo assim, sem esses dados
    expect(prisma.view.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          durationSeconds: undefined,
          device: undefined,
        }),
      }),
    );
  });

  it('CEN-34: não registra visualização de um tour que não existe', async () => {
    // Dado um id que não corresponde a nenhum tour
    prisma.virtualTour.findUnique.mockResolvedValue(null);

    // Quando se tenta registrar a visualização
    // Então a operação é recusada e nada é gravado
    await expect(
      service.execute(TOUR_ID, { sessionId: 'sessao-abc' }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.visitor.upsert).not.toHaveBeenCalled();
    expect(prisma.view.create).not.toHaveBeenCalled();
  });
});
