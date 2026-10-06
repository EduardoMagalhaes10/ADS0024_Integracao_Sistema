const db = require('../db/connection');

function overview(req, res) {
  const agricultoresAtivos = db.prepare('SELECT COUNT(*) AS n FROM agricultores WHERE ativo = 1').get().n;
  const novosEsteMes = db.prepare(
    `SELECT COUNT(*) AS n FROM agricultores WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`
  ).get().n;

  const produtosAtivos = db.prepare('SELECT COUNT(*) AS n FROM produtos WHERE ativo = 1').get().n;
  const produtosEstoqueBaixo = db.prepare(
    'SELECT COUNT(*) AS n FROM produtos WHERE ativo = 1 AND estoque <= estoque_minimo'
  ).get().n;

  const vendasHoje = db.prepare(
    `SELECT COUNT(*) AS n FROM vendas WHERE date(created_at) = date('now')`
  ).get().n;
  const vendasPendentes = db.prepare(`SELECT COUNT(*) AS n FROM vendas WHERE status = 'pendente'`).get().n;

  const faturamentoMes = db.prepare(
    `SELECT COALESCE(SUM(valor_final), 0) AS total FROM vendas
     WHERE status != 'cancelada' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`
  ).get().total;

  const totalVendas = db.prepare('SELECT COUNT(*) AS n FROM vendas').get().n;

  const ultimasVendas = db.prepare(
    `SELECT v.*, p.nome AS produto_nome FROM vendas v
     JOIN produtos p ON p.id = v.produto_id
     ORDER BY v.id DESC LIMIT 10`
  ).all().map(row => ({
    id: row.id,
    produtoNome: row.produto_nome,
    clienteNome: row.cliente_nome,
    quantidade: row.quantidade,
    valorFinal: row.valor_final,
    formaPagamento: row.forma_pagamento,
    status: row.status,
    createdAt: row.created_at,
  }));

  res.json({
    agricultoresAtivos,
    novosEsteMes,
    produtosAtivos,
    produtosEstoqueBaixo,
    vendasHoje,
    vendasPendentes,
    faturamentoMes,
    totalVendas,
    ultimasVendas,
  });
}

module.exports = { overview };
