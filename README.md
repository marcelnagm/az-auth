# az-auth

API de **autenticação e gestão de usuários** (serviço `az-user-auth`) construída com **LoopBack 3** e **MySQL**, feita para ser consumida por outras aplicações.

## Stack

- Node.js 16, LoopBack 3 (`loopback`)
- MySQL (modelos e migrações em `server/`)
- JWT (`jsonwebtoken`), `helmet`, `cors`, `compression`
- E-mail transacional com AWS SES / SendGrid + templates Handlebars
- AWS SSM (parâmetros de configuração)
- Observabilidade com Datadog (`dd-trace`)
- Testes com Jest; ESLint, Prettier e Husky para qualidade
- Docker / Docker Compose e pipeline Bitbucket

## Estrutura

```
server/
├── server.js, boot/        # inicialização do LoopBack
├── models/                 # modelos (.js + .json): auth, app, app-school, app-version, cluster-env...
├── migrations/, migrate.js # migrações do banco
├── datasources.*.js        # dev, qa, hml, prd, test
├── middleware*.json        # configuração de middlewares
├── helpers/, lib/, mixins/, enum/
database-config.js
Dockerfile, docker-compose.example.yml
```

## Como rodar

```bash
npm install
cp .env.example .env        # preencha MYSQL_HOST, MYSQL_DATABASE (users_v1_db), credenciais, segredos JWT etc.
npm run db:migrate          # aplica as migrações
npm run dev                 # sobe com nodemon
```

Outros scripts úteis:

| Comando | O que faz |
|---|---|
| `npm start` | Inicia com `dotenv` (produção) |
| `npm run start:dev` / `start:qa` / `start:hml` / `start:prd` | Sobem usando `dev.env`, `qa.env`, `hml.env`, `prd.env` |
| `npm test` | Roda os testes Jest |
| `npm run lint` | ESLint |

Com Docker: copie `docker-compose.example.yml` para `docker-compose.yml`, ajuste as variáveis e rode `docker compose up`.

## Documentação da API

Há uma coleção no Postman: [Run in Postman](https://app.getpostman.com/run-collection/aba4b6c68d37a9ab556d).

## Changelog

Veja [CHANGELOG.md](CHANGELOG.md).
