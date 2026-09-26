import { JwtPayload } from '../common/strategies/jwt-access.strategy';
import { CreateVirtualTourDto } from '../modules/virtual-tours/dto/create-virtual-tour.dto';

export const AGENCY_ID = '11111111-1111-4111-8111-111111111111';
export const OTHER_AGENCY_ID = '22222222-2222-4222-8222-222222222222';
export const PROPERTY_ID = '33333333-3333-4333-8333-333333333333';
export const TOUR_ID = '44444444-4444-4444-8444-444444444444';

/** Imagem 360° fictícia: o domínio só exige conteúdo não vazio. */
export const IMAGEM_360 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ';

/** Corretor autenticado da imobiliária dona do imóvel. */
export const corretor: JwtPayload = {
  sub: '55555555-5555-4555-8555-555555555555',
  email: 'ana@relaxinn.com.br',
  role: 'AGENT',
  agencyId: AGENCY_ID,
};

/** Corretor autenticado de outra imobiliária (usado nos testes de isolamento). */
export const corretorDeOutraImobiliaria: JwtPayload = {
  sub: '66666666-6666-4666-8666-666666666666',
  email: 'bruno@outra.com.br',
  role: 'AGENT',
  agencyId: OTHER_AGENCY_ID,
};

/** Administrador da imobiliária dona do imóvel. */
export const administrador: JwtPayload = {
  sub: '77777777-7777-4777-8777-777777777777',
  email: 'admin@relaxinn.com.br',
  role: 'ADMINISTRATOR',
  agencyId: AGENCY_ID,
};

type PanoramaInput = CreateVirtualTourDto['panoramas'][number];

/** Panorama de entrada já com os defaults preenchidos (pós-Zod). */
export function panoramaInput(
  override: Partial<PanoramaInput> & Pick<PanoramaInput, 'tempId' | 'roomName'>,
): PanoramaInput {
  return {
    imageData: IMAGEM_360,
    order: 0,
    initialPanorama: false,
    measurements: [],
    hotspots: [],
    ...override,
  };
}

/**
 * Tour de dois cômodos (Sala inicial → Cozinha) com uma medida na sala e
 * hotspots ligando os dois panoramas nos dois sentidos.
 */
export function createTourDto(
  override: Partial<CreateVirtualTourDto> = {},
): CreateVirtualTourDto {
  return {
    propertyId: PROPERTY_ID,
    panoramas: [
      panoramaInput({
        tempId: 'temp-sala',
        roomName: 'Sala',
        order: 0,
        initialPanorama: true,
        measurements: [{ description: 'Largura', value: 4.5, unit: 'm' }],
        hotspots: [
          {
            label: 'Ir para a cozinha',
            positionX: 0.5,
            positionY: 0.2,
            targetTempId: 'temp-cozinha',
          },
        ],
      }),
      panoramaInput({
        tempId: 'temp-cozinha',
        roomName: 'Cozinha',
        order: 1,
        hotspots: [
          { positionX: -0.3, positionY: 0.1, targetTempId: 'temp-sala' },
        ],
      }),
    ],
    ...override,
  };
}
