// Testes automatizados da API AgriGest (node:test, sem dependências extras).
// Usam um banco SQLite temporário, populado pelo seed, para não afetar dados reais.
const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agrigest-'));
process.env.DATABASE_FILE = path.join(tmpDir, 'test.db');
process.env.JWT_SECRET = 'segredo_apenas_para_testes';

require('../src/db/seed'); // cria o schema e os dados de demonstração
const app = require('../src/app');

let server;
let base;
let token;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
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

const auth = () => ({ Authorization: `Bearer ${token}` });

test('GET /api/health responde ok', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'ok');
});

test('login sem dados retorna 400', async () => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
});

test('login com senha errada retorna 401', async () => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@agrigest.com', senha: 'errada' }),
  });
  assert.equal(res.status, 401);
});

test('login válido retorna token JWT', async () => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@agrigest.com', senha: 'agrigest123' }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.token);
  token = data.token;
});

test('rota protegida sem token retorna 401', async () => {
  const res = await fetch(`${base}/api/agricultores`);
  assert.equal(res.status, 401);
});

for (const recurso of ['agricultores', 'produtos', 'vendas', 'dashboard']) {
  test(`GET /api/${recurso} com token retorna 200`, async () => {
    const res = await fetch(`${base}/api/${recurso}`, { headers: auth() });
    assert.equal(res.status, 200);
  });
}

test('rota inexistente retorna 404', async () => {
  const res = await fetch(`${base}/api/nao-existe`);
  assert.equal(res.status, 404);
});
