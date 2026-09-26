import { NotFoundException } from '@nestjs/common';
import {
  asPrismaService,
  createPrismaMock,
  PrismaMock,
} from '../../../test/prisma-mock';
import {
  corretor,
  corretorDeOutraImobiliaria,
  PROPERTY_ID,
  TOUR_ID,
} from '../../../test/virtual-tour.fixtures';
import { UpdateVirtualTourService } from './update-virtual-tour.service';

/**
 * US04 — Como corretor, quero publicar o tour virtual quando ele estiver pronto
 * e arquivá-lo quando o imóvel sair da carteira, controlando o que o cliente vê.
 */
describe('UpdateVirtualTourService (US04 — publicação e arquivamento)', () => {
  let prisma: PrismaMock;
  let service: UpdateVirtualTourService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new UpdateVirtualTourService(asPrismaService(prisma));
    prisma.virtualTour.findFirst.mockResolvedValue({
      id: TOUR_ID,
      status: 'DRAFT',
    });
  });

  it('CEN-14: publica o tour virtual do imóvel', async () => {
    // Dado um tour em rascunho da imobiliária do corretor
    const publicado = {
      id: TOUR_ID,
      status: 'PUBLISHED',
      propertyId: PROPERTY_ID,
      updatedAt: new Date('2026-09-26T12:00:00Z'),
    };
    prisma.virtualTour.update.mockResolvedValue(publicado);

    // Quando o corretor publica o tour
    const resultado = await service.execute(
      TOUR_ID,
      { status: 'PUBLISHED' },
      corretor,
    );

    // Então o status passa a PUBLISHED e o tour atualizado é devolvido
    expect(prisma.virtualTour.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: TOUR_ID },
        data: { status: 'PUBLISHED' },
      }),
    );
    expect(resultado).toBe(publicado);
  });

  it('CEN-17: arquiva um tour publicado', async () => {
    // Dado um tour publicado
    prisma.virtualTour.findFirst.mockResolvedValue({
      id: TOUR_ID,
      status: 'PUBLISHED',
    });
    prisma.virtualTour.update.mockResolvedValue({
      id: TOUR_ID,
      status: 'ARCHIVED',
    });

    // Quando o corretor arquiva o tour
    const resultado = await service.execute(
      TOUR_ID,
      { status: 'ARCHIVED' },
      corretor,
    );

    // Então o tour fica arquivado
    expect(resultado.status).toBe('ARCHIVED');
  });

  it('CEN-23: recusa a alteração de tour que não existe', async () => {
    // Dado um id que não corresponde a nenhum tour
    prisma.virtualTour.findFirst.mockResolvedValue(null);

    // Quando o corretor tenta publicar
    // Então a operação é recusada e nada é atualizado
    await expect(
      service.execute(TOUR_ID, { status: 'PUBLISHED' }, corretor),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.virtualTour.update).not.toHaveBeenCalled();
  });

  it('CEN-24: recusa a alteração de tour de outra imobiliária', async () => {
    // Dado um corretor de outra imobiliária
    prisma.virtualTour.findFirst.mockResolvedValue(null);

    // Quando ele tenta arquivar o tour
    await expect(
      service.execute(
        TOUR_ID,
        { status: 'ARCHIVED' },
        corretorDeOutraImobiliaria,
      ),
    ).rejects.toThrow('Virtual tour not found');

    // Então o tour é procurado apenas entre os imóveis da imobiliária dele
    expect(prisma.virtualTour.findFirst).toHaveBeenCalledWith({
      where: {
        id: TOUR_ID,
        property: { agencyId: corretorDeOutraImobiliaria.agencyId },
      },
    });
  });
});
