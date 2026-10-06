const db = require('../db/connection');

function mapRow(row) {
  return {
    id: row.id,
    produtoId: row.produto_id,
    produtoNome: row.produto_nome,
    quantidade: row.quantidade,
    valorUnitario: row.valor_unitario,
    desconto: row.desconto,
    valorFinal: row.valor_final,
    clienteNome: row.cliente_nome,
    clienteCpf: row.cliente_cpf,
    clienteTelefone: row.cliente_telefone,
    formaPagamento: row.forma_pagamento,
    status: row.status,
    observacoes: row.observacoes,
    createdAt: row.created_at,
  };
}

function list(req, res) {
  const { busca, status } = req.query;
  let sql = `
    SELECT v.*, p.nome AS produto_nome
    FROM vendas v
    JOIN produtos p ON p.id = v.produto_id
    WHERE 1=1
  `;
  const params = [];
  if (busca) {
    sql += ' AND (v.cliente_nome LIKE ? OR p.nome LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`);
  }
  if (status) {
    sql += ' AND v.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY v.id DESC';

  const rows = db.prepare(sql).all(...params);
  res.json({ total: rows.length, dados: rows.map(mapRow) });
}

function getById(req, res) {
  const row = db.prepare(
    `SELECT v.*, p.nome AS produto_nome FROM vendas v
     JOIN produtos p ON p.id = v.produto_id WHERE v.id = ?`
  ).get(req.params.id);
  if (!row) return res.status(404).json({ erro: 'Venda não encontrada.' });
  res.json(mapRow(row));
}

function create(req, res) {
  const {
    produtoId, quantidade, desconto, clienteNome, clienteCpf, clienteTelefone,
    formaPagamento, status, observacoes,
  } = req.body || {};

  if (!produtoId || !quantidade || !clienteNome || !formaPagamento) {
    return res.status(400).json({ erro: 'Produto, quantidade, cliente e forma de pagamento são obrigatórios.' });
  }

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(produtoId);
  if (!produto) return res.status(400).json({ erro: 'Produto não encontrado.' });

  const qtd = Number(quantidade);
  const statusFinal = status || 'concluida';
  const descontoFinal = Number(desconto) || 0;

  if (statusFinal !== 'cancelada' && qtd > produto.estoque) {
    return res.status(400).json({ erro: `Estoque insuficiente. Disponível: ${produto.estoque} ${produto.tipo_venda}.` });
  }

  const valorUnitario = produto.preco_unitario;
  const valorFinal = qtd * valorUnitario - descontoFinal;

  const info = db.prepare(
    `INSERT INTO vendas (produto_id, quantidade, valor_unitario, desconto, valor_final, cliente_nome, cliente_cpf, cliente_telefone, forma_pagamento, status, observacoes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    produtoId, qtd, valorUnitario, descontoFinal, valorFinal,
    clienteNome, clienteCpf || null, clienteTelefone || null, formaPagamento, statusFinal, observacoes || null
  );

  if (statusFinal !== 'cancelada') {
    db.prepare('UPDATE produtos SET estoque = estoque - ? WHERE id = ?').run(qtd, produtoId);
  }

  const nova = db.prepare(
    `SELECT v.*, p.nome AS produto_nome FROM vendas v
     JOIN produtos p ON p.id = v.produto_id WHERE v.id = ?`
  ).get(Number(info.lastInsertRowid));
  res.status(201).json(mapRow(nova));
}

function updateStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!['concluida', 'pendente', 'cancelada'].includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }

  const atual = db.prepare('SELECT * FROM vendas WHERE id = ?').get(id);
  if (!atual) return res.status(404).json({ erro: 'Venda não encontrada.' });

  // Se estava ativa (concluida/pendente) e está sendo cancelada agora, devolve o estoque
  if (atual.status !== 'cancelada' && status === 'cancelada') {
    db.prepare('UPDATE produtos SET estoque = estoque + ? WHERE id = ?').run(atual.quantidade, atual.produto_id);
  }
  // Se estava cancelada e está sendo reativada, debita o estoque de novo
  if (atual.status === 'cancelada' && status !== 'cancelada') {
    db.prepare('UPDATE produtos SET estoque = estoque - ? WHERE id = ?').run(atual.quantidade, atual.produto_id);
  }

  db.prepare('UPDATE vendas SET status = ? WHERE id = ?').run(status, id);

  const atualizada = db.prepare(
    `SELECT v.*, p.nome AS produto_nome FROM vendas v
     JOIN produtos p ON p.id = v.produto_id WHERE v.id = ?`
  ).get(id);
  res.json(mapRow(atualizada));
}

module.exports = { list, getById, create, updateStatus };
