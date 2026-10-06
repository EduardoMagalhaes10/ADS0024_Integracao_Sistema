const db = require('../db/connection');

function stockStatus(estoque, estoqueMinimo) {
  if (estoque <= 0) return 'out';
  if (estoque <= estoqueMinimo) return 'low';
  return 'ok';
}

function mapRow(row) {
  return {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria,
    descricao: row.descricao,
    tipoVenda: row.tipo_venda,
    precoUnitario: row.preco_unitario,
    estoque: row.estoque,
    estoqueMinimo: row.estoque_minimo,
    ativo: !!row.ativo,
    agricultorId: row.agricultor_id,
    agricultorNome: row.agricultor_nome,
    stockStatus: stockStatus(row.estoque, row.estoque_minimo),
    createdAt: row.created_at,
  };
}

function list(req, res) {
  const { busca } = req.query;
  let sql = `
    SELECT p.*, a.nome AS agricultor_nome
    FROM produtos p
    JOIN agricultores a ON a.id = p.agricultor_id
    WHERE 1=1
  `;
  const params = [];
  if (busca) {
    sql += ' AND (p.nome LIKE ? OR p.categoria LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`);
  }
  sql += ' ORDER BY p.id DESC';

  const rows = db.prepare(sql).all(...params);
  res.json({ total: rows.length, dados: rows.map(mapRow) });
}

function options(req, res) {
  const rows = db.prepare(
    'SELECT id, nome, preco_unitario, tipo_venda, estoque FROM produtos WHERE ativo = 1 ORDER BY nome'
  ).all();
  res.json(rows.map(r => ({
    id: r.id, nome: r.nome, precoUnitario: r.preco_unitario, tipoVenda: r.tipo_venda, estoque: r.estoque,
  })));
}

function getById(req, res) {
  const row = db.prepare(
    `SELECT p.*, a.nome AS agricultor_nome FROM produtos p
     JOIN agricultores a ON a.id = p.agricultor_id WHERE p.id = ?`
  ).get(req.params.id);
  if (!row) return res.status(404).json({ erro: 'Produto não encontrado.' });
  res.json(mapRow(row));
}

function create(req, res) {
  const {
    nome, categoria, descricao, tipoVenda, precoUnitario, estoque, estoqueMinimo, agricultorId, ativo,
  } = req.body || {};

  if (!nome || !categoria || !tipoVenda || precoUnitario === undefined || !agricultorId) {
    return res.status(400).json({ erro: 'Nome, categoria, tipo de venda, preço e agricultor são obrigatórios.' });
  }

  const agricultor = db.prepare('SELECT id FROM agricultores WHERE id = ?').get(agricultorId);
  if (!agricultor) return res.status(400).json({ erro: 'Agricultor responsável não encontrado.' });

  const info = db.prepare(
    `INSERT INTO produtos (nome, categoria, descricao, tipo_venda, preco_unitario, estoque, estoque_minimo, agricultor_id, ativo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    nome, categoria, descricao || null, tipoVenda, Number(precoUnitario),
    Number(estoque) || 0, Number(estoqueMinimo) || 10, agricultorId, ativo === false ? 0 : 1
  );

  const novo = db.prepare(
    `SELECT p.*, a.nome AS agricultor_nome FROM produtos p
     JOIN agricultores a ON a.id = p.agricultor_id WHERE p.id = ?`
  ).get(Number(info.lastInsertRowid));
  res.status(201).json(mapRow(novo));
}

function update(req, res) {
  const { id } = req.params;
  const atual = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
  if (!atual) return res.status(404).json({ erro: 'Produto não encontrado.' });

  const {
    nome, categoria, descricao, tipoVenda, precoUnitario, estoque, estoqueMinimo, agricultorId, ativo,
  } = req.body || {};

  if (agricultorId) {
    const agricultor = db.prepare('SELECT id FROM agricultores WHERE id = ?').get(agricultorId);
    if (!agricultor) return res.status(400).json({ erro: 'Agricultor responsável não encontrado.' });
  }

  db.prepare(
    `UPDATE produtos SET nome=?, categoria=?, descricao=?, tipo_venda=?, preco_unitario=?, estoque=?, estoque_minimo=?, agricultor_id=?, ativo=?
     WHERE id=?`
  ).run(
    nome ?? atual.nome,
    categoria ?? atual.categoria,
    descricao ?? atual.descricao,
    tipoVenda ?? atual.tipo_venda,
    precoUnitario !== undefined ? Number(precoUnitario) : atual.preco_unitario,
    estoque !== undefined ? Number(estoque) : atual.estoque,
    estoqueMinimo !== undefined ? Number(estoqueMinimo) : atual.estoque_minimo,
    agricultorId ?? atual.agricultor_id,
    ativo === undefined ? atual.ativo : (ativo ? 1 : 0),
    id
  );

  const atualizado = db.prepare(
    `SELECT p.*, a.nome AS agricultor_nome FROM produtos p
     JOIN agricultores a ON a.id = p.agricultor_id WHERE p.id = ?`
  ).get(id);
  res.json(mapRow(atualizado));
}

function toggleStatus(req, res) {
  const { id } = req.params;
  const atual = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
  if (!atual) return res.status(404).json({ erro: 'Produto não encontrado.' });

  const novoStatus = atual.ativo ? 0 : 1;
  db.prepare('UPDATE produtos SET ativo = ? WHERE id = ?').run(novoStatus, id);

  const atualizado = db.prepare(
    `SELECT p.*, a.nome AS agricultor_nome FROM produtos p
     JOIN agricultores a ON a.id = p.agricultor_id WHERE p.id = ?`
  ).get(id);
  res.json(mapRow(atualizado));
}

module.exports = { list, options, getById, create, update, toggleStatus };
