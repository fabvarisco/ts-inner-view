import { NotFoundException } from '@nestjs/common';
import {
  asPrismaService,
  createPrismaMock,
  PrismaMock,
} from '../../../test/prisma-mock';
import {
  corretor,
  corretorDeOutraImobiliaria,
  TOUR_ID,
} from '../../../test/virtual-tour.fixtures';
import { DeleteVirtualTourService } from './delete-virtual-tour.service';

/**
 * US06 — Como corretor, quero remover o tour virtual de um imóvel, junto com
 * seus panoramas, quando o material não servir mais.
 */
describe('DeleteVirtualTourService (US06 — remoção do tour virtual)', () => {
  let prisma: PrismaMock;
  let service: DeleteVirtualTourService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new DeleteVirtualTourService(asPrismaService(prisma));
  });

  it('CEN-26: remove o tour virtual da própria imobiliária', async () => {
    // Dado um tour existente da imobiliária do corretor
    prisma.virtualTour.findFirst.mockResolvedValue({ id: TOUR_ID });
    prisma.virtualTour.delete.mockResolvedValue({ id: TOUR_ID });

    // Quando o corretor remove o tour
    const resultado = await service.execute(TOUR_ID, corretor);

    // Então o tour é excluído (panoramas caem em cascata) e nada é devolvido
    expect(prisma.virtualTour.delete).toHaveBeenCalledWith({
      where: { id: TOUR_ID },
    });
    expect(resultado).toBeUndefined();
  });

  it('CEN-27: recusa a remoção de um tour que não existe', async () => {
    // Dado um id que não corresponde a nenhum tour
    prisma.virtualTour.findFirst.mockResolvedValue(null);

    // Quando o corretor tenta remover
    // Então a operação é recusada e nada é excluído
    await expect(service.execute(TOUR_ID, corretor)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.virtualTour.delete).not.toHaveBeenCalled();
  });

  it('CEN-28: recusa a remoção de tour de outra imobiliária', async () => {
    // Dado um corretor de outra imobiliária
    prisma.virtualTour.findFirst.mockResolvedValue(null);

    // Quando ele tenta remover o tour
    await expect(
      service.execute(TOUR_ID, corretorDeOutraImobiliaria),
    ).rejects.toThrow('Virtual tour not found');

    // Então o tour é procurado apenas entre os imóveis da imobiliária dele
    expect(prisma.virtualTour.findFirst).toHaveBeenCalledWith({
      where: {
        id: TOUR_ID,
        property: { agencyId: corretorDeOutraImobiliaria.agencyId },
      },
    });
    expect(prisma.virtualTour.delete).not.toHaveBeenCalled();
  });
});
