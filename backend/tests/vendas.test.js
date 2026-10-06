// Testes da regra de negócio de vendas (POST /api/vendas e PATCH /api/vendas/:id/status).
// Equivalente, neste projeto, à rota /api/soma do roteiro: aqui a "conta" é
// valorFinal = quantidade * valorUnitario - desconto, com baixa/devolução de estoque.
const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agrigest-vendas-'));
process.env.DATABASE_FILE = path.join(tmpDir, 'test.db');
process.env.JWT_SECRET = 'segredo_apenas_para_testes';

require('../src/db/seed');
const app = require('../src/app');

let server;
let base;
let headers;

async function api(method, url, body) {
  const res = await fetch(`${base}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

// Busca o produto "Rapadura" (R$ 5,00 / unidade, estoque 200 no seed)
async function rapadura() {
  const { data } = await api('GET', '/api/produtos?busca=Rapadura');
  return data.dados.find((p) => p.nome === 'Rapadura');
}

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;

  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@agrigest.com', senha: 'agrigest123' }),
  });
  const { token } = await res.json();
  headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
});

test.after(() => {
  server.close();
  // Fecha o banco antes de apagar a pasta (no Windows o arquivo aberto fica travado)
  require('../src/db/connection').close();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3 });
  } catch {
    // limpeza de arquivo temporário é "melhor esforço": não deve reprovar os testes
  }
});

test('venda calcula o valor final (quantidade x preço - desconto) e baixa o estoque', async () => {
  const antes = await rapadura();
  const { status, data } = await api('POST', '/api/vendas', {
    produtoId: antes.id,
    quantidade: 10,
    desconto: 5,
    clienteNome: 'Cliente Teste',
    formaPagamento: 'Pix',
  });

  assert.equal(status, 201);
  assert.equal(data.valorUnitario, 5);
  assert.equal(data.valorFinal, 45); // 10 * 5,00 - 5,00

  const depois = await rapadura();
  assert.equal(depois.estoque, antes.estoque - 10);
});

test('venda com quantidade acima do estoque retorna 400', async () => {
  const produto = await rapadura();
  const { status, data } = await api('POST', '/api/vendas', {
    produtoId: produto.id,
    quantidade: produto.estoque + 1,
    clienteNome: 'Cliente Teste',
    formaPagamento: 'Dinheiro',
  });

  assert.equal(status, 400);
  assert.match(data.erro, /Estoque insuficiente/);
});

test('venda sem campos obrigatórios retorna 400', async () => {
  const { status } = await api('POST', '/api/vendas', { quantidade: 1 });
  assert.equal(status, 400);
});

test('cancelar uma venda devolve a quantidade ao estoque', async () => {
  const antes = await rapadura();
  const { data: venda } = await api('POST', '/api/vendas', {
    produtoId: antes.id,
    quantidade: 4,
    clienteNome: 'Cliente Cancelamento',
    formaPagamento: 'Pix',
  });
  assert.equal((await rapadura()).estoque, antes.estoque - 4);

  const { status } = await api('PATCH', `/api/vendas/${venda.id}/status`, { status: 'cancelada' });
  assert.equal(status, 200);
  assert.equal((await rapadura()).estoque, antes.estoque);
});

test('status inválido retorna 400', async () => {
  const { status } = await api('PATCH', '/api/vendas/1/status', { status: 'qualquer' });
  assert.equal(status, 400);
});
