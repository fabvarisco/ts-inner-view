import { Response } from 'express';
import {
  administrador,
  corretor,
  createTourDto,
  TOUR_ID,
} from '../../../test/virtual-tour.fixtures';
import { CreateVirtualTourController } from './create-virtual-tour.controller';
import { DeleteVirtualTourController } from './delete-virtual-tour.controller';
import { FindVirtualTourController } from './find-virtual-tour.controller';
import { GetAnalyticsController } from './get-analytics.controller';
import { GetThumbnailController } from './get-thumbnail.controller';
import { RecordShareController } from './record-share.controller';
import { RecordViewController } from './record-view.controller';
import { UpdateVirtualTourController } from './update-virtual-tour.controller';

/** Service dublê: só registra a chamada e devolve um resultado combinado. */
function serviceDublê<T>(retorno: T) {
  return { execute: jest.fn().mockResolvedValue(retorno) } as any;
}

/**
 * Contrato HTTP dos handlers de tour virtual: cada controller apenas repassa os
 * dados já validados (corpo, parâmetro de rota e usuário autenticado) para o
 * service do caso de uso e devolve a resposta esperada.
 */
describe('Controllers de Virtual Tours (contrato dos handlers)', () => {
  it('CEN-43: POST /virtual-tours repassa o corpo validado e o corretor autenticado', async () => {
    // Dado o corpo do tour já validado pelo ZodValidationPipe
    const service = serviceDublê({ id: TOUR_ID });
    const controller = new CreateVirtualTourController(service);
    const dto = createTourDto();

    // Quando o corretor chama o endpoint de criação
    const resultado = await controller.create(dto, corretor);

    // Então o caso de uso recebe o corpo e o usuário logado, e devolve o tour
    expect(service.execute).toHaveBeenCalledWith(dto, corretor);
    expect(resultado).toEqual({ id: TOUR_ID });
  });

  it('CEN-44: PATCH /virtual-tours/:id repassa id, novo status e corretor autenticado', async () => {
    // Dado um tour existente e o novo status desejado
    const service = serviceDublê({ id: TOUR_ID, status: 'PUBLISHED' });
    const controller = new UpdateVirtualTourController(service);

    // Quando o corretor publica o tour pelo endpoint
    const resultado = await controller.update(
      TOUR_ID,
      { status: 'PUBLISHED' },
      corretor,
    );

    // Então o caso de uso recebe os três dados e devolve o tour atualizado
    expect(service.execute).toHaveBeenCalledWith(
      TOUR_ID,
      { status: 'PUBLISHED' },
      corretor,
    );
    expect(resultado.status).toBe('PUBLISHED');
  });

  it('CEN-45: GET /virtual-tours/:id é público e repassa apenas o id do tour', async () => {
    // Dado um tour publicado
    const tour = { id: TOUR_ID, status: 'PUBLISHED' };
    const service = serviceDublê(tour);
    const controller = new FindVirtualTourController(service);

    // Quando o cliente (sem autenticação) abre o tour
    const resultado = await controller.findOne(TOUR_ID);

    // Então o caso de uso é chamado somente com o id do tour
    expect(service.execute).toHaveBeenCalledWith(TOUR_ID);
    expect(resultado).toBe(tour);
  });

  it('CEN-46: DELETE /virtual-tours/:id repassa id e corretor autenticado', async () => {
    // Dado um tour existente
    const service = serviceDublê(undefined);
    const controller = new DeleteVirtualTourController(service);

    // Quando o corretor remove o tour
    await controller.remove(TOUR_ID, corretor);

    // Então o caso de uso recebe o id e o usuário logado
    expect(service.execute).toHaveBeenCalledWith(TOUR_ID, corretor);
  });

  it('CEN-47: GET /virtual-tours/:id/thumbnail responde a imagem com cabeçalhos de cache', async () => {
    // Dado um tour cuja miniatura já está disponível em bytes
    const buffer = Buffer.from('imagem');
    const controller = new GetThumbnailController(serviceDublê(buffer));
    const res = { setHeader: jest.fn(), send: jest.fn() } as unknown as Response;

    // Quando o cliente pede a miniatura do tour
    await controller.getThumbnail(TOUR_ID, res);

    // Então a resposta é a imagem JPEG, com cache de 1 hora
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=3600',
    );
    expect(res.send).toHaveBeenCalledWith(buffer);
  });

  it('CEN-48: POST /virtual-tours/:id/views repassa id do tour e dados da sessão', async () => {
    // Dado uma visita do cliente ao tour
    const service = serviceDublê({ id: 'view-1' });
    const controller = new RecordViewController(service);
    const dto = { sessionId: 'sessao-abc', durationSeconds: 90 };

    // Quando a visualização é registrada
    await controller.record(TOUR_ID, dto);

    // Então o caso de uso recebe o tour e os dados da visualização
    expect(service.execute).toHaveBeenCalledWith(TOUR_ID, dto);
  });

  it('CEN-49: POST /virtual-tours/:id/shares repassa id do tour e canal', async () => {
    // Dado um compartilhamento do tour pelo cliente
    const service = serviceDublê({ id: 'share-1' });
    const controller = new RecordShareController(service);
    const dto = { sessionId: 'sessao-abc', channel: 'whatsapp' };

    // Quando o compartilhamento é registrado
    await controller.record(TOUR_ID, dto);

    // Então o caso de uso recebe o tour e os dados do compartilhamento
    expect(service.execute).toHaveBeenCalledWith(TOUR_ID, dto);
  });

  it('CEN-50: GET /virtual-tours/:id/analytics repassa id e usuário administrador', async () => {
    // Dado um administrador consultando os números do tour
    const analytics = {
      totalViews: 10,
      totalShares: 3,
      avgDurationSeconds: 95.5,
    };
    const service = serviceDublê(analytics);
    const controller = new GetAnalyticsController(service);

    // Quando ele chama o endpoint de analytics
    const resultado = await controller.analytics(TOUR_ID, administrador);

    // Então o caso de uso recebe o id e o usuário logado, e devolve os números
    expect(service.execute).toHaveBeenCalledWith(TOUR_ID, administrador);
    expect(resultado).toBe(analytics);
  });
});
