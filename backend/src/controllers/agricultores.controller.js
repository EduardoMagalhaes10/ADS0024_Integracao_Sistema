const db = require('../db/connection');

function mapRow(row) {
  return {
    id: row.id,
    nome: row.nome,
    cpf: row.cpf,
    email: row.email,
    telefone: row.telefone,
    endereco: row.endereco,
    cidade: row.cidade,
    estado: row.estado,
    cep: row.cep,
    ativo: !!row.ativo,
    createdAt: row.created_at,
    totalVendas: row.total_vendas || 0,
  };
}

function list(req, res) {
  const { busca, status } = req.query;

  let sql = `
    SELECT a.*,
      COALESCE((
        SELECT SUM(v.valor_final) FROM vendas v
        JOIN produtos p ON p.id = v.produto_id
        WHERE p.agricultor_id = a.id AND v.status != 'cancelada'
      ), 0) AS total_vendas
    FROM agricultores a
    WHERE 1=1
  `;
  const params = [];

  if (busca) {
    sql += ' AND (a.nome LIKE ? OR a.cpf LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`);
  }
  if (status === 'ativo') {
    sql += ' AND a.ativo = 1';
  } else if (status === 'inativo') {
    sql += ' AND a.ativo = 0';
  }

  sql += ' ORDER BY a.id DESC';

  const rows = db.prepare(sql).all(...params);
  res.json({ total: rows.length, dados: rows.map(mapRow) });
}

function options(req, res) {
  const rows = db.prepare('SELECT id, nome FROM agricultores WHERE ativo = 1 ORDER BY nome').all();
  res.json(rows);
}

function getById(req, res) {
  const row = db.prepare('SELECT * FROM agricultores WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ erro: 'Agricultor não encontrado.' });
  res.json(mapRow(row));
}

function create(req, res) {
  const { nome, cpf, email, telefone, endereco, cidade, estado, cep, ativo } = req.body || {};
  if (!nome || !cpf || !telefone) {
    return res.status(400).json({ erro: 'Nome, CPF e telefone são obrigatórios.' });
  }

  const existente = db.prepare('SELECT id FROM agricultores WHERE cpf = ?').get(cpf);
  if (existente) {
    return res.status(409).json({ erro: 'Já existe um agricultor cadastrado com este CPF.' });
  }

  const info = db.prepare(
    'INSERT INTO agricultores (nome, cpf, email, telefone, endereco, cidade, estado, cep, ativo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(nome, cpf, email || null, telefone, endereco || null, cidade || null, estado || null, cep || null, ativo === false ? 0 : 1);

  const novo = db.prepare('SELECT * FROM agricultores WHERE id = ?').get(Number(info.lastInsertRowid));
  res.status(201).json(mapRow(novo));
}

function update(req, res) {
  const { id } = req.params;
  const atual = db.prepare('SELECT * FROM agricultores WHERE id = ?').get(id);
  if (!atual) return res.status(404).json({ erro: 'Agricultor não encontrado.' });

  const { nome, cpf, email, telefone, endereco, cidade, estado, cep, ativo } = req.body || {};

  if (cpf && cpf !== atual.cpf) {
    const conflito = db.prepare('SELECT id FROM agricultores WHERE cpf = ? AND id != ?').get(cpf, id);
    if (conflito) return res.status(409).json({ erro: 'Já existe outro agricultor com este CPF.' });
  }

  db.prepare(
    `UPDATE agricultores SET nome=?, cpf=?, email=?, telefone=?, endereco=?, cidade=?, estado=?, cep=?, ativo=?
     WHERE id=?`
  ).run(
    nome ?? atual.nome,
    cpf ?? atual.cpf,
    email ?? atual.email,
    telefone ?? atual.telefone,
    endereco ?? atual.endereco,
    cidade ?? atual.cidade,
    estado ?? atual.estado,
    cep ?? atual.cep,
    ativo === undefined ? atual.ativo : (ativo ? 1 : 0),
    id
  );

  const atualizado = db.prepare('SELECT * FROM agricultores WHERE id = ?').get(id);
  res.json(mapRow(atualizado));
}

function toggleStatus(req, res) {
  const { id } = req.params;
  const atual = db.prepare('SELECT * FROM agricultores WHERE id = ?').get(id);
  if (!atual) return res.status(404).json({ erro: 'Agricultor não encontrado.' });

  const novoStatus = atual.ativo ? 0 : 1;
  db.prepare('UPDATE agricultores SET ativo = ? WHERE id = ?').run(novoStatus, id);

  const atualizado = db.prepare('SELECT * FROM agricultores WHERE id = ?').get(id);
  res.json(mapRow(atualizado));
}

module.exports = { list, options, getById, create, update, toggleStatus };
