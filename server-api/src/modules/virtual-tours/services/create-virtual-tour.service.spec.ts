import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  asPrismaService,
  createPrismaMock,
  PrismaMock,
} from '../../../test/prisma-mock';
import {
  corretor,
  corretorDeOutraImobiliaria,
  createTourDto,
  panoramaInput,
  PROPERTY_ID,
  TOUR_ID,
} from '../../../test/virtual-tour.fixtures';
import { CreateVirtualTourService } from './create-virtual-tour.service';

/**
 * US01 — Como corretor, quero criar o tour virtual de um imóvel e adicionar os
 * panoramas de cada cômodo, para que o cliente possa visitar o imóvel a distância.
 */
describe('CreateVirtualTourService (US01 — criação do tour virtual)', () => {
  let prisma: PrismaMock;
  let service: CreateVirtualTourService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new CreateVirtualTourService(asPrismaService(prisma));

    // Por padrão o imóvel existe, é da imobiliária do corretor e não tem tour.
    prisma.property.findFirst.mockResolvedValue({
      id: PROPERTY_ID,
      agencyId: corretor.agencyId,
    });
    prisma.virtualTour.findUnique.mockResolvedValue(null);
    prisma.virtualTour.create.mockResolvedValue({ id: TOUR_ID });
    prisma.panorama.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: `pano-${data.roomName}` }),
    );
    prisma.measurement.createMany.mockResolvedValue({ count: 0 });
    prisma.hotspot.create.mockResolvedValue({ id: 'hotspot-1' });
  });

  it('CEN-01: cria o tour virtual de um imóvel que ainda não possui tour', async () => {
    // Dado um imóvel cadastrado, sem tour virtual, e o tour montado pelo corretor
    const dto = createTourDto();
    const tourPersistido = { id: TOUR_ID, status: 'PUBLISHED', panoramas: [] };
    prisma.virtualTour.findUnique.mockResolvedValueOnce(null); // checagem de duplicidade
    prisma.virtualTour.findUnique.mockResolvedValueOnce(tourPersistido); // leitura final

    // Quando o corretor cria o tour virtual do imóvel
    const resultado = await service.execute(dto, corretor);

    // Então o tour é criado para aquele imóvel, já publicado, e devolvido completo
    expect(prisma.virtualTour.create).toHaveBeenCalledWith({
      data: { propertyId: PROPERTY_ID, status: 'PUBLISHED' },
    });
    expect(resultado).toBe(tourPersistido);
  });

  it('CEN-01.1: grava tudo dentro de uma única transação', async () => {
    // Dado o tour montado pelo corretor
    // Quando o tour é criado
    await service.execute(createTourDto(), corretor);

    // Então panoramas, medidas e hotspots são gravados em uma só transação
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('CEN-03: persiste um panorama por cômodo, preservando ordem e panorama inicial', async () => {
    // Dado um tour com a sala (inicial, ordem 0) e a cozinha (ordem 1)
    // Quando o tour é criado
    await service.execute(createTourDto(), corretor);

    // Então cada cômodo vira um panorama vinculado ao tour, na ordem informada
    expect(prisma.panorama.create).toHaveBeenCalledTimes(2);
    const criados = prisma.panorama.create.mock.calls.map(([arg]) => arg.data);
    expect(criados).toEqual([
      expect.objectContaining({
        roomName: 'Sala',
        order: 0,
        initialPanorama: true,
        virtualTourId: TOUR_ID,
      }),
      expect.objectContaining({
        roomName: 'Cozinha',
        order: 1,
        initialPanorama: false,
        virtualTourId: TOUR_ID,
      }),
    ]);
  });

  it('CEN-06: cria os hotspots resolvendo os tempIds para os ids dos panoramas gravados', async () => {
    // Dado um tour em que a sala aponta para a cozinha e a cozinha para a sala
    // Quando o tour é criado
    await service.execute(createTourDto(), corretor);

    // Então cada hotspot é gravado com a origem e o destino já resolvidos
    expect(prisma.hotspot.create).toHaveBeenCalledTimes(2);
    const hotspots = prisma.hotspot.create.mock.calls.map(([arg]) => arg.data);
    expect(hotspots).toEqual([
      {
        label: 'Ir para a cozinha',
        positionX: 0.5,
        positionY: 0.2,
        originId: 'pano-Sala',
        targetId: 'pano-Cozinha',
      },
      {
        label: undefined,
        positionX: -0.3,
        positionY: 0.1,
        originId: 'pano-Cozinha',
        targetId: 'pano-Sala',
      },
    ]);
  });

  it('CEN-07: recusa hotspot cujo destino não está na lista de panoramas enviada', async () => {
    // Dado um tour em que a sala aponta para um cômodo que não foi enviado
    const dto = createTourDto({
      panoramas: [
        panoramaInput({
          tempId: 'temp-sala',
          roomName: 'Sala',
          hotspots: [
            { positionX: 0, positionY: 0, targetTempId: 'temp-inexistente' },
          ],
        }),
      ],
    });

    // Quando o corretor tenta criar o tour
    // Então a operação é recusada apontando o destino inválido
    await expect(service.execute(dto, corretor)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.execute(dto, corretor)).rejects.toThrow(
      'targetTempId "temp-inexistente" not found in panoramas list',
    );
    expect(prisma.hotspot.create).not.toHaveBeenCalled();
  });

  it('CEN-12: registra as medidas informadas para cada cômodo', async () => {
    // Dado um tour em que a sala tem uma medida de largura
    // Quando o tour é criado
    await service.execute(createTourDto(), corretor);

    // Então a medida é gravada vinculada ao panorama da sala
    expect(prisma.measurement.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.measurement.createMany).toHaveBeenCalledWith({
      data: [
        {
          description: 'Largura',
          value: 4.5,
          unit: 'm',
          panoramaId: 'pano-Sala',
        },
      ],
    });
  });

  it('CEN-12.1: não chama o banco quando o cômodo não tem medidas', async () => {
    // Dado um tour com um único cômodo, sem medidas e sem hotspots
    const dto = createTourDto({
      panoramas: [panoramaInput({ tempId: 'temp-sala', roomName: 'Sala' })],
    });

    // Quando o tour é criado
    await service.execute(dto, corretor);

    // Então nenhuma gravação de medida é disparada
    expect(prisma.measurement.createMany).not.toHaveBeenCalled();
  });

  it('CEN-02: impede a criação de um segundo tour virtual para o mesmo imóvel', async () => {
    // Dado um imóvel que já possui um tour virtual
    prisma.virtualTour.findUnique.mockResolvedValue({ id: TOUR_ID });

    // Quando o corretor tenta criar outro tour para o mesmo imóvel
    // Então a operação é recusada informando que o imóvel já possui tour
    await expect(service.execute(createTourDto(), corretor)).rejects.toThrow(
      ConflictException,
    );
    await expect(service.execute(createTourDto(), corretor)).rejects.toThrow(
      'Virtual tour already exists for this property',
    );
    expect(prisma.virtualTour.create).not.toHaveBeenCalled();
  });

  it('CEN-21: recusa a criação quando o imóvel não existe', async () => {
    // Dado um propertyId que não corresponde a nenhum imóvel
    prisma.property.findFirst.mockResolvedValue(null);

    // Quando o corretor tenta criar o tour
    // Então a operação é recusada como imóvel não encontrado
    await expect(service.execute(createTourDto(), corretor)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('CEN-22: recusa a criação de tour para imóvel de outra imobiliária', async () => {
    // Dado um corretor de outra imobiliária (a busca é filtrada pela agencyId dele)
    prisma.property.findFirst.mockResolvedValue(null);

    // Quando ele tenta criar o tour do imóvel
    await expect(
      service.execute(createTourDto(), corretorDeOutraImobiliaria),
    ).rejects.toThrow('Property not found');

    // Então o imóvel é procurado apenas dentro da imobiliária do usuário logado
    expect(prisma.property.findFirst).toHaveBeenCalledWith({
      where: {
        id: PROPERTY_ID,
        agencyId: corretorDeOutraImobiliaria.agencyId,
      },
    });
  });
});
