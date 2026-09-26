import { NotFoundException } from '@nestjs/common';
import {
  asPrismaService,
  createPrismaMock,
  PrismaMock,
} from '../../../test/prisma-mock';
import { TOUR_ID } from '../../../test/virtual-tour.fixtures';
import { FindVirtualTourService } from './find-virtual-tour.service';

/**
 * US05 — Como cliente, quero visitar o tour virtual do imóvel, começando pelo
 * panorama inicial e navegando pelos hotspots entre os cômodos.
 */
describe('FindVirtualTourService (US05 — visita ao tour virtual)', () => {
  let prisma: PrismaMock;
  let service: FindVirtualTourService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new FindVirtualTourService(asPrismaService(prisma));
  });

  it('CEN-19: devolve o tour completo, com panoramas ordenados e hotspots de navegação', async () => {
    // Dado um tour publicado com sala (inicial) e cozinha ligadas por um hotspot
    const tour = {
      id: TOUR_ID,
      status: 'PUBLISHED',
      panoramas: [
        {
          id: 'pano-sala',
          roomName: 'Sala',
          order: 0,
          initialPanorama: true,
          originHotspots: [{ id: 'h1', targetId: 'pano-cozinha' }],
          measurements: [],
        },
        {
          id: 'pano-cozinha',
          roomName: 'Cozinha',
          order: 1,
          initialPanorama: false,
          originHotspots: [],
          measurements: [],
        },
      ],
    };
    prisma.virtualTour.findUnique.mockResolvedValue(tour);

    // Quando o cliente abre o tour
    const resultado = await service.execute(TOUR_ID);

    // Então recebe o tour com os panoramas na ordem de exibição
    expect(resultado).toBe(tour);
    expect(resultado.panoramas.map((p) => p.roomName)).toEqual([
      'Sala',
      'Cozinha',
    ]);
    const [{ select }] = prisma.virtualTour.findUnique.mock.calls[0];
    expect(select.panoramas.orderBy).toEqual({ order: 'asc' });
  });

  it('CEN-19.1: inclui a imagem 360° de cada panorama, para renderizar a visita', async () => {
    // Dado um tour qualquer
    prisma.virtualTour.findUnique.mockResolvedValue({ id: TOUR_ID });

    // Quando o cliente abre o tour
    await service.execute(TOUR_ID);

    // Então a consulta traz a imagem de cada panorama
    const [{ select }] = prisma.virtualTour.findUnique.mock.calls[0];
    expect(select.panoramas.select.imageData).toBe(true);
  });

  it('CEN-25: recusa a visita a um tour que não existe', async () => {
    // Dado um id que não corresponde a nenhum tour
    prisma.virtualTour.findUnique.mockResolvedValue(null);

    // Quando o cliente tenta abrir o tour
    // Então a operação é recusada como tour não encontrado
    await expect(service.execute(TOUR_ID)).rejects.toThrow(NotFoundException);
    await expect(service.execute(TOUR_ID)).rejects.toThrow(
      'Virtual tour not found',
    );
  });
});
