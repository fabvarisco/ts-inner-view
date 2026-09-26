// O valor de apiUrl é substituído no build por scripts/set-api-url.mjs, a partir
// da variável de ambiente API_URL do projeto na Vercel. O placeholder abaixo é
// propositalmente vazio: se o script não rodar, a falha aparece no build e não
// em produção.
export const environment = {
  production: true,
  apiUrl: ''
};
