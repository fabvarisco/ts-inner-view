import { NotFoundException } from '@nestjs/common';
import {
  asPrismaService,
  createPrismaMock,
  PrismaMock,
} from '../../../test/prisma-mock';
import { TOUR_ID } from '../../../test/virtual-tour.fixtures';
import { GetThumbnailService } from './get-thumbnail.service';

const BASE64_OLA = Buffer.from('ola').toString('base64');

/**
 * US07 — Como cliente, quero ver uma miniatura do tour na listagem de imóveis,
 * para reconhecer o imóvel antes de abrir a visita.
 */
describe('GetThumbnailService (US07 — miniatura do tour)', () => {
  let prisma: PrismaMock;
  let service: GetThumbnailService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new GetThumbnailService(asPrismaService(prisma));
  });

  it('CEN-29: usa o panorama inicial do tour como miniatura', async () => {
    // Dado um tour com panoramas cadastrados
    prisma.panorama.findFirst.mockResolvedValue({ imageData: BASE64_OLA });

    // Quando a miniatura do tour é pedida
    await service.execute(TOUR_ID);

    // Então o panorama inicial é preferido e, no empate, vale a ordem de exibição
    expect(prisma.panorama.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { virtualTourId: TOUR_ID },
        orderBy: [{ initialPanorama: 'desc' }, { order: 'asc' }],
      }),
    );
  });

  it('CEN-30: converte a imagem em data URL para os bytes da imagem', async () => {
    // Dado um panorama cuja imagem está gravada como data URL (base64 com prefixo)
    prisma.panorama.findFirst.mockResolvedValue({
      imageData: `data:image/jpeg;base64,${BASE64_OLA}`,
    });

    // Quando a miniatura é pedida
    const buffer = await service.execute(TOUR_ID);

    // Então o prefixo é descartado e só o conteúdo da imagem é devolvido
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.toString('utf8')).toBe('ola');
  });

  it('CEN-30.1: aceita imagem gravada como base64 puro, sem prefixo', async () => {
    // Dado um panorama cuja imagem está gravada sem o prefixo de data URL
    prisma.panorama.findFirst.mockResolvedValue({ imageData: BASE64_OLA });

    // Quando a miniatura é pedida
    const buffer = await service.execute(TOUR_ID);

    // Então os bytes da imagem são devolvidos do mesmo jeito
    expect(buffer.toString('utf8')).toBe('ola');
  });

  it('CEN-31: recusa a miniatura quando o tour não tem nenhum panorama', async () => {
    // Dado um tour sem panoramas
    prisma.panorama.findFirst.mockResolvedValue(null);

    // Quando a miniatura é pedida
    // Então a operação é recusada informando que não há miniatura
    await expect(service.execute(TOUR_ID)).rejects.toThrow(NotFoundException);
    await expect(service.execute(TOUR_ID)).rejects.toThrow(
      'No thumbnail available',
    );
  });
});
