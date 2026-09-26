import { BadRequestException } from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { IMAGEM_360, PROPERTY_ID } from '../../../test/virtual-tour.fixtures';
import {
  CreateVirtualTourDto,
  CreateVirtualTourSchema,
} from './create-virtual-tour.dto';
import { RecordViewSchema } from './record-view.dto';
import { UpdateVirtualTourSchema } from './update-virtual-tour.dto';

const criarPipe = new ZodValidationPipe(CreateVirtualTourSchema);
/** Valida um corpo de criação já com o tipo do DTO resultante. */
const validarCriacao = (corpo: unknown) =>
  criarPipe.transform(corpo) as CreateVirtualTourDto;
const atualizarPipe = new ZodValidationPipe(UpdateVirtualTourSchema);
const visualizacaoPipe = new ZodValidationPipe(RecordViewSchema);

/** Corpo mínimo de criação com um único cômodo. */
function corpoComComodo(panorama: Record<string, unknown>) {
  return { propertyId: PROPERTY_ID, panoramas: [panorama] };
}

/**
 * Validação de entrada dos handlers: o `ZodValidationPipe` roda antes do caso de
 * uso, então as regras de formato do requisito são recusadas na borda da API.
 */
describe('Validação de entrada dos handlers de Virtual Tours', () => {
  it('CEN-51: aceita o cômodo informado e aplica os valores padrão do tour', () => {
    // Dado um cômodo informado apenas com nome e imagem 360°
    const corpo = corpoComComodo({
      tempId: 'temp-sala',
      roomName: 'Sala',
      imageData: IMAGEM_360,
    });

    // Quando o corpo é validado
    const dto = validarCriacao(corpo);

    // Então os defaults são aplicados: ordem 0, não inicial, sem medidas/hotspots
    expect(dto.panoramas[0]).toEqual({
      tempId: 'temp-sala',
      roomName: 'Sala',
      imageData: IMAGEM_360,
      order: 0,
      initialPanorama: false,
      measurements: [],
      hotspots: [],
    });
  });

  it('CEN-52: recusa cômodo sem nome ou sem imagem 360°', () => {
    // Dado um cômodo sem nome e outro sem imagem
    // Quando o corpo é validado
    // Então a requisição é recusada
    expect(() =>
      criarPipe.transform(
        corpoComComodo({
          tempId: 'temp-1',
          roomName: '',
          imageData: IMAGEM_360,
        }),
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      criarPipe.transform(
        corpoComComodo({ tempId: 'temp-1', roomName: 'Sala', imageData: '' }),
      ),
    ).toThrow(BadRequestException);
  });

  it('CEN-13: recusa medida com valor zero, negativo ou sem descrição', () => {
    // Dado medidas inválidas registradas em um cômodo
    const medidaInvalida = (measurement: Record<string, unknown>) =>
      corpoComComodo({
        tempId: 'temp-sala',
        roomName: 'Sala',
        imageData: IMAGEM_360,
        measurements: [measurement],
      });

    // Quando o corpo é validado
    // Então cada medida inválida é recusada
    expect(() =>
      criarPipe.transform(medidaInvalida({ description: 'Largura', value: 0 })),
    ).toThrow(BadRequestException);
    expect(() =>
      criarPipe.transform(
        medidaInvalida({ description: 'Largura', value: -2.5 }),
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      criarPipe.transform(medidaInvalida({ description: '', value: 4.5 })),
    ).toThrow(BadRequestException);
  });

  it('CEN-12.2: assume metro como unidade padrão da medida', () => {
    // Dado uma medida informada sem unidade
    const corpo = corpoComComodo({
      tempId: 'temp-sala',
      roomName: 'Sala',
      imageData: IMAGEM_360,
      measurements: [{ description: 'Largura', value: 4.5 }],
    });

    // Quando o corpo é validado
    const dto = validarCriacao(corpo);

    // Então a unidade é registrada como metro
    expect(dto.panoramas[0].measurements[0].unit).toBe('m');
  });

  it('CEN-53: recusa hotspot sem destino informado', () => {
    // Dado um hotspot sem o cômodo de destino
    const corpo = corpoComComodo({
      tempId: 'temp-sala',
      roomName: 'Sala',
      imageData: IMAGEM_360,
      hotspots: [{ positionX: 0.5, positionY: 0.2, targetTempId: '' }],
    });

    // Quando o corpo é validado
    // Então a requisição é recusada
    expect(() => criarPipe.transform(corpo)).toThrow(BadRequestException);
  });

  it('CEN-54: recusa criação de tour sem um imóvel válido', () => {
    // Dado um propertyId que não é um identificador válido
    // Quando o corpo é validado
    // Então a requisição é recusada
    expect(() =>
      criarPipe.transform({ propertyId: 'IMV-001', panoramas: [] }),
    ).toThrow(BadRequestException);
  });

  it('CEN-18: aceita apenas os três status previstos para o tour', () => {
    // Dado os status previstos no requisito
    // Quando cada um é validado
    // Então todos são aceitos
    for (const status of ['DRAFT', 'PUBLISHED', 'ARCHIVED']) {
      expect(atualizarPipe.transform({ status })).toEqual({ status });
    }

    // E um status fora da lista é recusado
    expect(() => atualizarPipe.transform({ status: 'PUBLICADO' })).toThrow(
      BadRequestException,
    );
  });

  it('CEN-55: recusa visualização sem sessão ou com duração inválida', () => {
    // Dado registros de visualização inválidos
    // Quando o corpo é validado
    // Então a requisição é recusada
    expect(() => visualizacaoPipe.transform({ sessionId: '' })).toThrow(
      BadRequestException,
    );
    expect(() =>
      visualizacaoPipe.transform({
        sessionId: 'sessao-abc',
        durationSeconds: -10,
      }),
    ).toThrow(BadRequestException);

    // E uma visualização apenas com a sessão é aceita
    expect(visualizacaoPipe.transform({ sessionId: 'sessao-abc' })).toEqual({
      sessionId: 'sessao-abc',
    });
  });
});
