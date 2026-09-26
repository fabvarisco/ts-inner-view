import { NotFoundException } from '@nestjs/common';
import {
  asPrismaService,
  createPrismaMock,
  PrismaMock,
} from '../../../test/prisma-mock';
import {
  administrador,
  corretorDeOutraImobiliaria,
  TOUR_ID,
} from '../../../test/virtual-tour.fixtures';
import { GetAnalyticsService } from './get-analytics.service';

/**
 * US10 — Como administrador da imobiliária, quero ver os números do tour
 * (visualizações, compartilhamentos e tempo médio de visita) para avaliar o anúncio.
 */
describe('GetAnalyticsService (US10 — analytics do tour)', () => {
  let prisma: PrismaMock;
  let service: GetAnalyticsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new GetAnalyticsService(asPrismaService(prisma));
    prisma.virtualTour.findFirst.mockResolvedValue({ id: TOUR_ID });
  });

  it('CEN-38: consolida visualizações, compartilhamentos e tempo médio de visita', async () => {
    // Dado um tour com 10 visualizações, 3 compartilhamentos e média de 95,5s
    prisma.view.count.mockResolvedValue(10);
    prisma.share.count.mockResolvedValue(3);
    prisma.view.aggregate.mockResolvedValue({
      _avg: { durationSeconds: 95.5 },
    });

    // Quando o administrador consulta os analytics do tour
    const resultado = await service.execute(TOUR_ID, administrador);

    // Então recebe os três indicadores consolidados
    expect(resultado).toEqual({
      totalViews: 10,
      totalShares: 3,
      avgDurationSeconds: 95.5,
    });
    expect(prisma.view.count).toHaveBeenCalledWith({
      where: { virtualTourId: TOUR_ID },
    });
    expect(prisma.share.count).toHaveBeenCalledWith({
      where: { virtualTourId: TOUR_ID },
    });
  });

  it('CEN-39: ignora visualizações sem duração ao calcular o tempo médio', async () => {
    // Dado um tour em que só parte das visualizações tem duração medida
    prisma.view.count.mockResolvedValue(5);
    prisma.share.count.mockResolvedValue(0);
    prisma.view.aggregate.mockResolvedValue({ _avg: { durationSeconds: 60 } });

    // Quando o administrador consulta os analytics
    await service.execute(TOUR_ID, administrador);

    // Então a média considera apenas as visualizações com duração informada
    expect(prisma.view.aggregate).toHaveBeenCalledWith({
      where: { virtualTourId: TOUR_ID, durationSeconds: { not: null } },
      _avg: { durationSeconds: true },
    });
  });

  it('CEN-40: devolve tempo médio zero quando nenhuma visita teve duração medida', async () => {
    // Dado um tour sem nenhuma duração registrada (média nula no banco)
    prisma.view.count.mockResolvedValue(2);
    prisma.share.count.mockResolvedValue(0);
    prisma.view.aggregate.mockResolvedValue({
      _avg: { durationSeconds: null },
    });

    // Quando o administrador consulta os analytics
    const resultado = await service.execute(TOUR_ID, administrador);

    // Então o tempo médio é apresentado como zero, e não como nulo
    expect(resultado.avgDurationSeconds).toBe(0);
  });

  it('CEN-41: recusa analytics de tour que não existe', async () => {
    // Dado um id que não corresponde a nenhum tour
    prisma.virtualTour.findFirst.mockResolvedValue(null);

    // Quando o administrador consulta os analytics
    // Então a operação é recusada e nenhuma contagem é feita
    await expect(service.execute(TOUR_ID, administrador)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.view.count).not.toHaveBeenCalled();
    expect(prisma.share.count).not.toHaveBeenCalled();
  });

  it('CEN-42: recusa analytics de tour de outra imobiliária', async () => {
    // Dado um usuário de outra imobiliária
    prisma.virtualTour.findFirst.mockResolvedValue(null);

    // Quando ele consulta os analytics do tour
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
  });
});
