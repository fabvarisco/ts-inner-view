import { NotFoundException } from '@nestjs/common';
import {
  asPrismaService,
  createPrismaMock,
  PrismaMock,
} from '../../../test/prisma-mock';
import { TOUR_ID } from '../../../test/virtual-tour.fixtures';
import { RecordShareService } from './record-share.service';

/**
 * US09 — Como corretor, quero saber quando um cliente compartilha o tour e por
 * qual canal, para medir o alcance do anúncio.
 */
describe('RecordShareService (US09 — registro de compartilhamentos)', () => {
  let prisma: PrismaMock;
  let service: RecordShareService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new RecordShareService(asPrismaService(prisma));
    prisma.virtualTour.findUnique.mockResolvedValue({ id: TOUR_ID });
    prisma.visitor.upsert.mockResolvedValue({ id: 'visitor-1' });
    prisma.share.create.mockResolvedValue({ id: 'share-1' });
  });

  it('CEN-35: registra o compartilhamento com o canal utilizado', async () => {
    // Dado um tour existente e um visitante identificado pela sessão
    const share = {
      id: 'share-1',
      sharedAt: new Date('2026-09-26T12:00:00Z'),
      channel: 'whatsapp',
    };
    prisma.share.create.mockResolvedValue(share);

    // Quando o compartilhamento por WhatsApp é registrado
    const resultado = await service.execute(TOUR_ID, {
      sessionId: 'sessao-abc',
      channel: 'whatsapp',
    });

    // Então o compartilhamento é gravado para aquele tour, visitante e canal
    expect(prisma.share.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          virtualTourId: TOUR_ID,
          visitorId: 'visitor-1',
          channel: 'whatsapp',
        },
      }),
    );
    expect(resultado).toBe(share);
  });

  it('CEN-36: reaproveita o visitante quando a sessão já é conhecida', async () => {
    // Dado um visitante que já interagiu com tours antes (mesmo sessionId)
    // Quando um novo compartilhamento é registrado
    await service.execute(TOUR_ID, {
      sessionId: 'sessao-abc',
      channel: 'email',
    });

    // Então o visitante é reaproveitado pela sessão
    expect(prisma.visitor.upsert).toHaveBeenCalledWith({
      where: { sessionId: 'sessao-abc' },
      create: { sessionId: 'sessao-abc' },
      update: {},
    });
  });

  it('CEN-37: não registra compartilhamento de um tour que não existe', async () => {
    // Dado um id que não corresponde a nenhum tour
    prisma.virtualTour.findUnique.mockResolvedValue(null);

    // Quando se tenta registrar o compartilhamento
    // Então a operação é recusada e nada é gravado
    await expect(
      service.execute(TOUR_ID, { sessionId: 'sessao-abc', channel: 'whatsapp' }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.visitor.upsert).not.toHaveBeenCalled();
    expect(prisma.share.create).not.toHaveBeenCalled();
  });
});
