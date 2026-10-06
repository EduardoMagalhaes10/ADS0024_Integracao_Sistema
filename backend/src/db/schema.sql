-- Esquema relacional do AgriGest.
-- Em desenvolvimento local roda em SQLite (via módulo nativo node:sqlite).
-- As tabelas, tipos e relacionamentos foram desenhados para serem
-- portados para PostgreSQL sem mudanças estruturais, conforme planejado
-- no documento de arquitetura (EP2).

CREATE TABLE IF NOT EXISTS usuarios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  senha_hash  TEXT NOT NULL,
  papel       TEXT NOT NULL DEFAULT 'operador', -- admin | operador
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agricultores (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT NOT NULL,
  cpf         TEXT NOT NULL UNIQUE,
  email       TEXT,
  telefone    TEXT NOT NULL,
  endereco    TEXT,
  cidade      TEXT,
  estado      TEXT,
  cep         TEXT,
  ativo       INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS produtos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nome            TEXT NOT NULL,
  categoria       TEXT NOT NULL,
  descricao       TEXT,
  tipo_venda      TEXT NOT NULL, -- kg | Litro | Unidade | Caixa
  preco_unitario  REAL NOT NULL,
  estoque         REAL NOT NULL DEFAULT 0,
  estoque_minimo  REAL NOT NULL DEFAULT 10,
  ativo           INTEGER NOT NULL DEFAULT 1,
  agricultor_id   INTEGER NOT NULL REFERENCES agricultores(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendas (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id        INTEGER NOT NULL REFERENCES produtos(id),
  quantidade        REAL NOT NULL,
  valor_unitario    REAL NOT NULL,
  desconto          REAL NOT NULL DEFAULT 0,
  valor_final       REAL NOT NULL,
  cliente_nome      TEXT NOT NULL,
  cliente_cpf       TEXT,
  cliente_telefone  TEXT,
  forma_pagamento   TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'concluida', -- concluida | pendente | cancelada
  observacoes       TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_produtos_agricultor ON produtos(agricultor_id);
CREATE INDEX IF NOT EXISTS idx_vendas_produto ON vendas(produto_id);
CREATE INDEX IF NOT EXISTS idx_vendas_created_at ON vendas(created_at);
