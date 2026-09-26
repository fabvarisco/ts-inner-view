/**
 * Stub do client gerado pelo Prisma (`generated/prisma/client`).
 *
 * Os testes unitários nunca tocam o banco: o `PrismaService` é sempre
 * substituído pelo mock de `src/test/prisma-mock.ts`. Este stub existe apenas
 * para que importar `PrismaService` (ou qualquer arquivo que o importe) não
 * carregue o client gerado, que é enorme e precisaria ser compilado a cada suíte.
 *
 * O mapeamento está em `jest.moduleNameMapper` (package.json).
 */
export class PrismaClient {
  async $connect(): Promise<void> {}
  async $disconnect(): Promise<void> {}
}
