# BaaS API

API do backend (BaaS – Backend as a Service) construída com **NestJS**, **TypeORM** e **MySQL**.

## Stack

| Tecnologia                              | Uso                                             |
| ---------------------------------------- | ------------------------------------------------ |
| TypeScript + NestJS                      | API da aplicação                                  |
| TypeORM                                  | Persistência (MySQL)                              |
| class-validator / class-transformer      | DTOs e validação de entrada/saída                 |
| Swagger (`@nestjs/swagger`)              | Documentação interativa da API                    |
| Middleware Nest                          | Logging, correlation id e apoio à autenticação    |
| MySQL                                    | Banco de dados próprio da aplicação               |

## Estrutura de pastas

```
src/
├── main.ts                     # bootstrap (pipes, filtros, swagger, cors, helmet)
├── app.module.ts                # módulo raiz + registro dos middlewares globais
├── swagger.ts                   # configuração do Swagger
├── config/
│   ├── configuration.ts         # leitura tipada das variáveis de ambiente
│   └── validation.schema.ts     # validação (fail-fast) do .env no bootstrap
├── database/
│   ├── data-source.ts           # DataSource usado pela CLI do TypeORM (migrations)
│   └── migrations/
├── common/
│   ├── middleware/
│   │   ├── correlation-id.middleware.ts  # gera/propaga x-correlation-id
│   │   └── logger.middleware.ts          # log de requisição/resposta
│   ├── filters/http-exception.filter.ts  # padroniza corpo de erro da API
│   ├── interceptors/logging.interceptor.ts
│   ├── decorators/{public,current-user}.decorator.ts
│   ├── dto/pagination.dto.ts
│   └── entities/base.entity.ts  # id (uuid), createdAt, updatedAt
└── modules/
    ├── auth/                    # registro, login, estratégia JWT, guard
    ├── users/                   # CRUD de usuários (entidade, DTOs, service, controller)
    └── health/                  # GET /health (checagem da conexão com o MySQL)
```

## Pré-requisitos

- Node.js 20+
- MySQL 8+ (local ou via Docker)

## Como rodar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie o arquivo de ambiente e ajuste os valores:

   ```bash
   cp .env.example .env
   ```

3. Suba o MySQL (opcional, via Docker):

   ```bash
   docker compose up -d mysql
   ```

4. Rode as migrations (com `DB_SYNCHRONIZE=false`, recomendado):

   ```bash
   npm run migration:run
   ```

5. Inicie a aplicação em modo desenvolvimento:

   ```bash
   npm run start:dev
   ```

A API sobe em `http://localhost:3000/api/v1` e a documentação Swagger em
`http://localhost:3000/api/docs`.

## Scripts principais

| Script                  | Descrição                                  |
| ------------------------ | -------------------------------------------- |
| `npm run start:dev`      | Sobe a API com watch mode                    |
| `npm run build`          | Compila para `dist/`                         |
| `npm run test`           | Testes unitários                             |
| `npm run test:e2e`       | Testes end-to-end                            |
| `npm run lint`           | Lint + fix                                   |
| `npm run migration:generate -- src/database/migrations/Nome` | Gera migration a partir das entidades |
| `npm run migration:run`  | Aplica migrations pendentes                  |

## Observabilidade e apoio à autenticação

- **Correlation ID**: todo request recebe/propaga o header `x-correlation-id`,
  usado nos logs (`LoggerMiddleware`, `LoggingInterceptor`) e no corpo de erro
  (`HttpExceptionFilter`) para facilitar rastreamento ponta a ponta.
- **Logging**: middleware Nest loga método, rota, status e duração de cada
  requisição; o interceptor complementa com o handler (`Controller.method`)
  que atendeu.
- **Autenticação**: `AuthModule` expõe `POST /auth/register` e `POST /auth/login`,
  emitindo um JWT validado pela `JwtStrategy`. Rotas protegidas usam o
  `JwtAuthGuard` (`@UseGuards(JwtAuthGuard)`), como em `UsersController`.

## Docker

```bash
docker compose up --build
```

Sobe o MySQL e a API em modo desenvolvimento (com volume montado em `src/`).
