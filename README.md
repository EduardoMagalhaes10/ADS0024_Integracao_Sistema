# AgriGest — MVP Web Funcional

Sistema de Gestão de Feiras Agroecológicas. Projeto desenvolvido para a disciplina
de Projeto Integrado III (ADS / CEAD UFCA) — Entregável Parcial 3 (EP3).

**Equipe:** Danilo Barros de Novaes, Filipi Emanuel Pinto Teixeira, Eduardo Magalhães,
Eyshila Serena Ferreira Mota.

---

## 1. Descrição do projeto

### Objetivo do sistema

O AgriGest tem como objetivo digitalizar e simplificar a gestão de feiras
agroecológicas, permitindo o cadastro de agricultores e produtos, o registro de
vendas, o controle de estoque e o acompanhamento do desempenho comercial da feira,
tudo em uma única plataforma web.

### Problema que busca resolver

Feiras agroecológicas no interior do Ceará — e do Brasil em geral — costumam operar
sem nenhum sistema de gestão digital. Agricultores familiares controlam produtos,
estoque e vendas em cadernos físicos ou planilhas soltas, o que causa perda de
dados, dificulta a rastreabilidade ("quem vende o quê") e deixa a organização da
feira sem indicadores confiáveis para tomada de decisão. O AgriGest resolve isso
centralizando esses dados em uma plataforma acessível e fácil de operar mesmo por
usuários com pouca familiaridade digital.

### Público-alvo

- Organizadores e administradores de feiras agroecológicas e associações/cooperativas
  de agricultura familiar;
- Agricultores familiares que vendem seus produtos nessas feiras;
- Secretarias municipais de agricultura e órgãos de apoio à agricultura familiar,
  que podem usar os dados agregados do sistema como subsídio para políticas públicas.

### Principais funcionalidades implementadas neste MVP

- **Autenticação** com login, sessão via JWT (expira em 8h) e logout.
- **Agricultores**: cadastro, edição, listagem com busca, ativar/desativar, e total
  de vendas calculado automaticamente por agricultor.
- **Produtos**: cadastro, edição, listagem com busca, indicador visual de estoque
  (ok / baixo / esgotado) e vínculo direto com o agricultor responsável.
- **Vendas**: registro com cálculo automático de valores (unitário, desconto,
  total), baixa automática do estoque do produto vendido, validação de estoque
  insuficiente e fluxo de status (pendente → concluída / cancelada), com devolução
  automática do estoque ao cancelar uma venda.
- **Dashboard**: indicadores em tempo real (agricultores ativos, produtos com
  estoque baixo, vendas do dia, faturamento do mês) e lista das últimas vendas
  registradas.

---

## 2. Tecnologias utilizadas

| Camada | Tecnologia | Por que foi escolhida |
|---|---|---|
| Backend | **Node.js + Express 5** | Curva de aprendizado baixa para a equipe, ecossistema maduro para APIs REST e fácil integração com o restante do stack JavaScript já usado no frontend. |
| Autenticação | **jsonwebtoken (JWT)** + **bcryptjs** | JWT permite autenticação stateless (sem sessão em memória no servidor), simples de validar em cada rota protegida; bcryptjs faz o hash seguro das senhas antes de gravar no banco. |
| Banco de dados | **`node:sqlite`** (módulo nativo do Node.js) | Zero dependências externas e zero configuração para rodar localmente — importante para um MVP que precisa ser fácil de testar. O schema foi desenhado sem recursos exclusivos do SQLite, para facilitar uma futura migração. |
| Configuração | **dotenv** | Mantém segredos (chave JWT, porta, caminho do banco) fora do código-fonte, em variáveis de ambiente. |
| CORS | **cors** | Permite que o frontend (servido separadamente, como arquivo estático) faça requisições à API sem bloqueio do navegador. |
| Frontend | **HTML5 + CSS3 + JavaScript puro (ES6+)**, sem framework e sem build step | O time já vinha de um protótipo estático em HTML/CSS/JS (etapas anteriores); manter JS puro evitou a curva de aprendizado de um framework extra e simplificou a execução (basta abrir o `index.html`). |
| Versionamento | **Git + GitHub** | Controle de versão colaborativo e histórico de commits da equipe. |

> O [documento de arquitetura do EP2](../EP2_AgriGest_Modelo_Arquitetural.docx) previa
> PostgreSQL + Prisma como solução de banco de dados para produção. Para a execução
> local deste MVP optamos pelo `node:sqlite`, por não exigir nenhuma instalação
> adicional — o schema SQL (`backend/src/db/schema.sql`) foi escrito para ser
> facilmente portado para PostgreSQL quando essa migração for feita.

---

## 3. Estrutura do projeto

```
Projeto_Integrado4/
├── .github/workflows/ci.yml       pipeline de integração contínua (GitHub Actions)
├── backend/                        API REST em Node.js + Express
│   ├── src/
│   │   ├── server.js               ponto de entrada — inicia o servidor HTTP
│   │   ├── app.js                  configuração do Express (middlewares, rotas)
│   │   ├── controllers/            regras de negócio de cada recurso
│   │   │   ├── auth.controller.js
│   │   │   ├── agricultores.controller.js
│   │   │   ├── produtos.controller.js
│   │   │   ├── vendas.controller.js
│   │   │   └── dashboard.controller.js
│   │   ├── routes/                 definição dos endpoints (mapeiam URL → controller)
│   │   │   ├── auth.routes.js
│   │   │   ├── agricultores.routes.js
│   │   │   ├── produtos.routes.js
│   │   │   ├── vendas.routes.js
│   │   │   └── dashboard.routes.js
│   │   ├── middleware/
│   │   │   └── auth.js             validação do token JWT nas rotas protegidas
│   │   └── db/
│   │       ├── connection.js       abre a conexão com o banco SQLite
│   │       ├── schema.sql          definição das tabelas (usuarios, agricultores, produtos, vendas)
│   │       └── seed.js             popula o banco com dados iniciais de demonstração
│   ├── data/                       arquivo do banco SQLite (gerado pelo seed, não versionado)
│   ├── tests/api.test.js           testes automatizados da API
│   ├── .env.example                modelo de variáveis de ambiente
│   └── package.json
└── frontend/                       Interface web (HTML + CSS + JS puro)
    ├── index.html                  single-page app: login, dashboard e telas de CRUD
    ├── css/style.css
    └── js/
        ├── api.js                  camada de comunicação com a API (fetch + token)
        └── app.js                  lógica de navegação entre telas e manipulação do DOM
```

---

## 4. Pré-requisitos

- **Node.js 22.5 ou superior** (necessário porque o backend usa o módulo nativo
  `node:sqlite`, ainda experimental — você verá um aviso `ExperimentalWarning` no
  console ao iniciar o servidor; isso é esperado e não afeta o funcionamento).
  Verifique sua versão com `node -v`. Se estiver em uma versão mais antiga, atualize
  com [nvm](https://github.com/nvm-sh/nvm) (`nvm install 22 && nvm use 22`) ou baixe
  em [nodejs.org](https://nodejs.org).
- Um navegador moderno (Chrome, Firefox, Edge) para abrir o frontend.

## 5. Instalação e execução

### 5.1. Backend (API)

```bash
cd backend
npm install
cp .env.example .env   # copie o modelo e ajuste se necessário (valores padrão já funcionam localmente)
npm run seed            # cria o banco de dados e popula com dados iniciais
npm start                # inicia a API em http://localhost:3001
```

Login de demonstração criado pelo seed:

- **Email:** admin@agrigest.com
- **Senha:** agrigest123

O comando `npm run seed` é idempotente — pode ser executado novamente sem duplicar
registros (ele verifica o que já existe antes de inserir).

### 5.2. Frontend

Com o backend rodando, basta abrir o arquivo `frontend/index.html` diretamente no
navegador (duplo clique, ou `Arquivo > Abrir`). Não há build, nem dependências —
é HTML/CSS/JS puro.

Se preferir servir por HTTP em vez de abrir como `file://` (opcional, mas evita
restrições do navegador em alguns sistemas), qualquer servidor estático funciona,
por exemplo:

```bash
cd frontend
npx serve .
# ou: python3 -m http.server 5500
```

O frontend está configurado para chamar a API em `http://localhost:3001/api`
(veja `frontend/js/api.js`, constante `API_BASE`, caso queira mudar a porta).

### 5.3. Acesso ao sistema

1. Abra o frontend no navegador;
2. Faça login com `admin@agrigest.com` / `agrigest123`;
3. Você será direcionado ao Dashboard, com o menu lateral para acessar
   Agricultores, Produtos e Vendas.

---

## 6. Processo de desenvolvimento

- **Divisão de tarefas:** a equipe manteve a divisão de papéis definida desde as
  etapas anteriores do projeto, com cada integrante responsável por uma frente
  (modelagem de dados, backend, frontend e documentação), integrando o trabalho por
  meio de commits no GitHub.
- **Uso do GitHub:** este repositório (`Projeto_Integrado4`) dá continuidade ao MVP desenvolvido no
  Projeto Integrado III (repositório `Agrigest`).
- **Estratégia de versionamento:** commits incrementais por funcionalidade
  (autenticação, CRUD de agricultores, produtos, vendas, dashboard).
- **Dificuldades encontradas e soluções adotadas:** durante a preparação desta
  entrega identificamos que a pasta `backend/src` — com todo o código-fonte da
  API — não havia sido enviada ao repositório remoto em um envio anterior (ficou
  apenas na máquina local de quem desenvolveu o backend). Isso foi corrigido nesta
  entrega, junto com uma limpeza do versionamento do backend: removemos
  `node_modules` e o arquivo `.env` (que continha um segredo de desenvolvimento) do
  controle de versão, adicionando um `.gitignore` e um `.env.example` como modelo,
  seguindo boas práticas de repositórios Node.js.

> *Espaço para a equipe complementar: dificuldades técnicas específicas enfrentadas
> durante a implementação do backend/frontend, decisões de escopo do MVP, e como o
> trabalho foi combinado entre os integrantes ao longo da Sprint 3.*

---

## 7. Demonstração do MVP

- **Tela inicial:** tela de login, única página acessível sem autenticação.
- **Fluxo de navegação:** login → Dashboard → menu lateral (Agricultores, Produtos,
  Vendas) → telas de listagem de cada recurso, com botões para cadastrar/editar.
- **Principais funcionalidades:** cadastro e edição de agricultores e produtos,
  registro de vendas com cálculo automático de valores e baixa de estoque, e
  Dashboard com indicadores em tempo real.

> *Adicionar aqui prints de tela do sistema em funcionamento (login, dashboard,
> listagem de agricultores/produtos, registro de venda). Recomendamos capturar as
> telas com o sistema já rodando localmente e salvar em uma pasta `docs/imagens/`
> dentro deste diretório, referenciando-as aqui com `![descrição](docs/imagens/arquivo.png)`.*

## 8. Vídeo de apresentação

> *Link do vídeo (YouTube não listado, Google Drive ou plataforma equivalente):* `[inserir link aqui]`

---

## 9. Como utilizar a aplicação

*(Componente Extensionista)*

O AgriGest pode ser acessado por qualquer pessoa responsável pela organização de
uma feira agroecológica ou por um agricultor familiar que participe dela. Após
receber um login de acesso (criado pelo administrador do sistema), o usuário abre
o sistema no navegador, entra com e-mail e senha, e chega direto ao Dashboard, onde
já visualiza um resumo do dia: quantos agricultores estão ativos, quais produtos
estão com estoque baixo, quantas vendas já foram feitas e qual o faturamento do
período.

Para usar as principais funcionalidades, o usuário navega pelo menu lateral:

- Em **Agricultores**, cadastra um novo produtor com seus dados de contato e
  localização, ou edita um cadastro existente;
- Em **Produtos**, vincula um produto ao agricultor responsável, define o preço,
  o tipo de venda (kg, litro, unidade, caixa) e um estoque mínimo, para que o
  sistema avise quando esse produto estiver acabando;
- Em **Vendas**, registra uma venda escolhendo o produto e a quantidade — o
  sistema calcula o valor automaticamente, aplica desconto se houver, e já
  desconta a quantidade vendida do estoque do produto, sem precisar de conta
  manual.

O problema que a aplicação busca resolver é a falta de controle digital nas feiras
agroecológicas: hoje, a maioria dos feirantes e organizações de agricultura
familiar da região registra vendas e estoque em papel, o que dificulta saber, em
tempo real, quanto já foi vendido, o que está em falta e qual o desempenho de cada
agricultor. Com o AgriGest, essas informações ficam centralizadas e acessíveis
imediatamente.

Podem se beneficiar da solução:

- **Cooperativas e associações de agricultura familiar**, que organizam feiras
  semanais e precisam de uma visão consolidada de todos os produtores e produtos;
- **Agricultores individuais**, que passam a ter um controle simples do que
  produzem e vendem, sem depender de cadernos ou planilhas;
- **Prefeituras e secretarias de agricultura**, que podem usar os dados agregados
  do sistema para embasar políticas de apoio à agricultura familiar.

Como exemplo real de uso: uma cooperativa com 15 produtores em Itapipoca-CE pode
cadastrar todos os agricultores e seus produtos no início da temporada e, durante
cada feira semanal, registrar as vendas conforme elas acontecem. Ao final do dia,
o Dashboard mostra o faturamento total e sinaliza quais produtos precisam ser
repostos para a próxima feira — uma tarefa que, sem o sistema, dependeria de somar
manualmente anotações em papel.

Acreditamos que essa digitalização gera impacto positivo real: reduz o tempo gasto
com controle manual, diminui erros de cálculo em vendas, evita que um agricultor
perca uma venda por falta de um produto que já estava em falta há dias sem que
ninguém percebesse, e dá visibilidade a dados que hoje se perdem — contribuindo
para a sustentabilidade financeira da agricultura familiar da região.

---

## 10. Próximos passos sugeridos

- Migrar de `node:sqlite` para PostgreSQL + Prisma em um ambiente de produção,
  conforme a arquitetura documentada no EP2.
- Ampliar os testes automatizados (unitários nos controllers, end-to-end no fluxo
  do frontend).
- Adicionar paginação nas listagens para volumes maiores de dados.
- Adicionar página de relatórios (o item "Relatórios" do menu hoje aponta para o
  Dashboard como placeholder).
- Publicar a aplicação (backend e frontend) em um serviço de hospedagem, para que
  possa ser acessada por um link público.

---

## 11. Integração Contínua (CI) com GitHub Actions

### O que é integração contínua?
Integração contínua é a prática de verificar o código automaticamente toda vez
que alguém envia uma mudança para o repositório. Em vez de descobrir um erro
só no fim do projeto, um "robô" (aqui, o GitHub Actions) instala o projeto do
zero, roda os testes e avisa na hora se algo quebrou.

### Por que isso importa para quem está aprendendo a programar?
- Você descobre seus erros rápido, com o código ainda fresco na cabeça.
- Aprende a escrever código que pode ser testado, um hábito valorizado no mercado.
- Em trabalho de equipe, a mudança de um colega não quebra a sua sem ninguém perceber.
- Você ganha confiança para mexer no código: se algo estragar, o teste avisa.

### Objetivo neste projeto
Garantir que o backend do AgriGest (Node.js + Express + SQLite) continue
funcionando a cada `push` ou `pull request` na branch `main`.

### Como o pipeline funciona
O arquivo [`.github/workflows/ci.yml`](.github/workflows/ci.yml) executa, em uma máquina Ubuntu limpa:

1. **Checkout** do código;
2. **Node.js 22** (o backend usa `node:sqlite`, que exige Node 22.5+);
3. **`npm install`** dentro de `backend/`;
4. **`npm run check`**: verifica a sintaxe de todos os arquivos `.js`;
5. **`npm test`**: roda os testes automatizados (`backend/tests/api.test.js`), que criam um
   banco temporário, populam com o seed e testam a API (health, login válido e
   inválido, rotas protegidas com e sem token, listagens e rota 404).

O resultado aparece na aba **Actions** do GitHub: ✅ tudo certo, ❌ algo falhou.

### Como rodar os testes na sua máquina
```bash
cd backend
npm install
npm run check
npm test
```

---

## 10. Pipeline de CI e Docker (Estudo Guiado 01)

### Rodando o backend em contêiner

```bash
docker build -t agrigest-api:latest .
docker run -d -p 3001:3001 -e JWT_SECRET=um_segredo_seu --name agrigest agrigest-api:latest
curl http://localhost:3001/api/health
```

O contêiner executa o seed (idempotente) e inicia a API. Para persistir o banco entre
execuções, monte um volume: `-v agrigest-data:/app/data`.

### Pipeline (`.github/workflows/ci.yml`)

| Job | Etapa | Falha quando... |
|---|---|---|
| `backend` | `npm ci` | dependências não instalam |
| `backend` | `npm run check` | há erro de sintaxe |
| `backend` | `npm run lint` (ESLint) | o código viola as regras de estilo/qualidade |
| `backend` | `npm test` | algum teste automatizado quebra |
| `docker` (só roda se `backend` passou) | `docker build` | o Dockerfile não constrói |
| `docker` | subir contêiner + `GET /api/health` | a API não sobe dentro do contêiner |

Comandos locais: `cd backend && npm run lint && npm test`.
