require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./connection');

function run() {
  console.log('Populando banco de dados com dados iniciais...');

  // ---------- usuário admin ----------
  const senhaHash = bcrypt.hashSync('agrigest123', 10);
  const existeUsuario = db.prepare('SELECT id FROM usuarios WHERE email = ?').get('admin@agrigest.com');
  if (!existeUsuario) {
    db.prepare(
      'INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (?, ?, ?, ?)'
    ).run('Administrador AgriGest', 'admin@agrigest.com', senhaHash, 'admin');
    console.log('  usuário admin criado -> admin@agrigest.com / agrigest123');
  } else {
    console.log('  usuário admin já existe, mantendo.');
  }

  // ---------- agricultores ----------
  const agricultores = [
    { nome: 'Francisca Rodrigues', cpf: '007.355.444-55', email: 'francisca@email.com', telefone: '(88) 98879-5522', endereco: 'Sítio Vó Santa, Zona Rural', cidade: 'Itapipoca', estado: 'CE', cep: '62500-000' },
    { nome: 'Antônio Moura Costa', cpf: '017.355.424-19', email: 'antonio@email.com', telefone: '(88) 98979-3312', endereco: 'Sítio Boa Vista', cidade: 'Itapipoca', estado: 'CE', cep: '62500-000' },
    { nome: 'Maria Filomena da Silva', cpf: '123.456.789-00', email: 'filomena@email.com', telefone: '(88) 98519-5321', endereco: 'Comunidade Bom Jardim', cidade: 'Amontada', estado: 'CE', cep: '62380-000' },
    { nome: 'José Antero Lima', cpf: '034.221.998-12', email: 'jose@email.com', telefone: '(88) 93776-5312', endereco: 'Sítio Capim Verde', cidade: 'Tururu', estado: 'CE', cep: '62420-000' },
  ];

  const insertAgricultor = db.prepare(
    'INSERT INTO agricultores (nome, cpf, email, telefone, endereco, cidade, estado, cep, ativo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const buscaAgricultorPorCpf = db.prepare('SELECT id FROM agricultores WHERE cpf = ?');

  const idsAgricultores = {};
  agricultores.forEach((a, idx) => {
    const existente = buscaAgricultorPorCpf.get(a.cpf);
    if (existente) {
      idsAgricultores[a.nome] = existente.id;
      return;
    }
    const ativo = idx === 3 ? 0 : 1; // José Antero Lima entra inativo, como no protótipo
    const info = insertAgricultor.run(a.nome, a.cpf, a.email, a.telefone, a.endereco, a.cidade, a.estado, a.cep, ativo);
    idsAgricultores[a.nome] = Number(info.lastInsertRowid);
  });
  console.log(`  ${agricultores.length} agricultores garantidos.`);

  // ---------- produtos ----------
  const produtos = [
    { nome: 'Tomate Orgânico', categoria: 'Hortaliça', descricao: 'Tomate cultivado sem agrotóxicos.', tipoVenda: 'kg', preco: 10.9, estoque: 30, estoqueMin: 10, agricultor: 'Francisca Rodrigues' },
    { nome: 'Rapadura', categoria: 'Cana-de-açúcar', descricao: 'Rapadura artesanal de cana.', tipoVenda: 'Unidade', preco: 5.0, estoque: 200, estoqueMin: 20, agricultor: 'Antônio Moura Costa' },
    { nome: 'Mel de Abelha', categoria: 'Apicultura', descricao: 'Mel puro de abelhas nativas.', tipoVenda: 'Litro', preco: 45.0, estoque: 5, estoqueMin: 10, agricultor: 'Maria Filomena da Silva' },
    { nome: 'Castanha de Caju', categoria: 'Snacks', descricao: 'Castanha de caju torrada.', tipoVenda: 'kg', preco: 45.0, estoque: 15, estoqueMin: 10, agricultor: 'Antônio Moura Costa' },
  ];

  const insertProduto = db.prepare(
    'INSERT INTO produtos (nome, categoria, descricao, tipo_venda, preco_unitario, estoque, estoque_minimo, agricultor_id, ativo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)'
  );
  const buscaProdutoPorNome = db.prepare('SELECT id FROM produtos WHERE nome = ?');

  const idsProdutos = {};
  produtos.forEach((p) => {
    const existente = buscaProdutoPorNome.get(p.nome);
    if (existente) {
      idsProdutos[p.nome] = existente.id;
      return;
    }
    const info = insertProduto.run(
      p.nome, p.categoria, p.descricao, p.tipoVenda, p.preco, p.estoque, p.estoqueMin, idsAgricultores[p.agricultor]
    );
    idsProdutos[p.nome] = Number(info.lastInsertRowid);
  });
  console.log(`  ${produtos.length} produtos garantidos.`);

  // ---------- vendas ----------
  const totalVendas = db.prepare('SELECT COUNT(*) AS n FROM vendas').get().n;
  if (totalVendas === 0) {
    const vendas = [
      { produto: 'Tomate Orgânico', qtd: 5, valorUnit: 7.5, desconto: 0, cliente: 'Allyson Allex', cpf: '111.111.111-11', tel: '(88) 99999-0001', pagamento: 'PIX', status: 'concluida' },
      { produto: 'Rapadura', qtd: 3, valorUnit: 5.0, desconto: 0, cliente: 'Márcio Francisco', cpf: '222.222.222-22', tel: '(88) 99999-0002', pagamento: 'Débito', status: 'concluida' },
      { produto: 'Mel de Abelha', qtd: 5, valorUnit: 45.0, desconto: 0, cliente: 'Fabrício Lima', cpf: '333.333.333-33', tel: '(88) 99999-0003', pagamento: 'Dinheiro', status: 'concluida' },
      { produto: 'Castanha de Caju', qtd: 3, valorUnit: 45.0, desconto: 8.0, cliente: 'Jildonas Afonso', cpf: '444.444.444-44', tel: '(88) 99999-0004', pagamento: 'Crédito', status: 'pendente' },
    ];
    const insertVenda = db.prepare(
      `INSERT INTO vendas (produto_id, quantidade, valor_unitario, desconto, valor_final, cliente_nome, cliente_cpf, cliente_telefone, forma_pagamento, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    vendas.forEach((v) => {
      const valorFinal = v.qtd * v.valorUnit - v.desconto;
      insertVenda.run(idsProdutos[v.produto], v.qtd, v.valorUnit, v.desconto, valorFinal, v.cliente, v.cpf, v.tel, v.pagamento, v.status);
    });
    console.log(`  ${vendas.length} vendas de exemplo inseridas.`);
  } else {
    console.log('  já existem vendas no banco, mantendo.');
  }

  console.log('Seed concluído.');
}

run();
