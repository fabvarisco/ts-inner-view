// Injeta a URL da API no bundle de produção a partir da variável de ambiente
// API_URL, definida no projeto da Vercel (uma por environment: Preview e Production).
//
// Motivo: o endereço da API é configuração de ambiente, não código. Antes desta
// esteira o valor estava fixo em environment.prod.ts (`https://api.seudominio.com`),
// um endereço que não existe — o build passava e a aplicação publicada quebrava.
//
// O script falha quando API_URL não está definida, pela mesma regra aplicada ao
// segredo do JWT na API: sem a configuração, a aplicação não sobe em vez de subir
// apontando para lugar nenhum.

import { readFileSync, writeFileSync } from 'node:fs';

const target = new URL('../src/environments/environment.prod.ts', import.meta.url);
const apiUrl = (process.env.API_URL ?? '').trim();

if (!apiUrl) {
  console.error(
    '[set-api-url] API_URL não está definida.\n' +
      '              Configure a variável no projeto da Vercel (Settings > Environment Variables)\n' +
      '              ou exporte API_URL antes de rodar o build.'
  );
  process.exit(1);
}

if (!/^(https:\/\/|\/)/.test(apiUrl)) {
  console.error(`[set-api-url] API_URL inválida: "${apiUrl}". Use https:// ou um caminho iniciado por /.`);
  process.exit(1);
}

const source = readFileSync(target, 'utf8');
const patched = source.replace(/apiUrl:\s*'[^']*'/, `apiUrl: '${apiUrl.replace(/\/+$/, '')}'`);

if (patched === source) {
  console.error('[set-api-url] Não encontrei a chave apiUrl em environment.prod.ts. Build interrompido.');
  process.exit(1);
}

writeFileSync(target, patched);
console.log(`[set-api-url] apiUrl = ${apiUrl}`);
