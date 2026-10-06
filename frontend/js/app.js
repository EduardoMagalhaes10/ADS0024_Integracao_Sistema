// AgriGest - app.js
// Navegação entre telas e manipulação do DOM. Toda chamada à API
// passa pelo objeto Api (api.js).

// ---------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatarMoeda(valor) {
  const n = Number(valor) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(iso) {
  if (!iso) return '—';
  const d = new Date(iso.replace(' ', 'T') + (iso.includes('Z') ? '' : 'Z'));
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

let toastTimer = null;
function toast(mensagem, tipo = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = mensagem;
  el.className = 'toast show' + (tipo === 'error' ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3500);
}

function setBotaoCarregando(btn, carregando, textoOriginal) {
  if (!btn) return;
  btn.disabled = carregando;
  btn.textContent = carregando ? 'Salvando...' : textoOriginal;
}

// ---------------------------------------------------------------
// Navegação entre páginas
// ---------------------------------------------------------------
const topnavIds = {
  dashboard: 'tn-dash',
  'cad-agri': 'tn-cadagri',
  'cad-prod': 'tn-cadprod',
  'reg-venda': 'tn-regvenda',
};

const sidebarIds = {
  dashboard: 'sb-dash',
  agricultores: 'sb-agri',
  produtos: 'sb-prod',
  vendas: 'sb-vend',
};

function showPage(pageId) {
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  const alvo = document.getElementById(`page-${pageId}`);
  if (alvo) alvo.classList.add('active');

  document.querySelectorAll('.topbar nav a').forEach((a) => a.classList.remove('active'));
  document.querySelectorAll('.sidebar a').forEach((a) => a.classList.remove('active'));

  const tn = topnavIds[pageId];
  if (tn) document.getElementById(tn)?.classList.add('active');

  const sb = sidebarIds[pageId];
  if (sb) document.getElementById(sb)?.classList.add('active');

  if (pageId === 'dashboard') carregarDashboard();
  if (pageId === 'agricultores') carregarAgricultores();
  if (pageId === 'produtos') carregarProdutos();
  if (pageId === 'vendas') carregarVendas();
}

document.querySelectorAll('[data-page]').forEach((el) => {
  el.addEventListener('click', () => showPage(el.dataset.page));
});

// ---------------------------------------------------------------
// Autenticação
// ---------------------------------------------------------------
function mostrarApp() {
  const usuario = Api.getUsuario();
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('user-nome').textContent = usuario ? usuario.nome : '';
  showPage('dashboard');
}

function mostrarLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

document.getElementById('form-login').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;
  const erroEl = document.getElementById('login-erro');
  const btn = document.getElementById('btn-login');

  erroEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Entrando...';

  try {
    const resp = await Api.login(email, senha);
    Api.setToken(resp.token);
    Api.setUsuario(resp.usuario);
    mostrarApp();
  } catch (err) {
    erroEl.textContent = err.message;
    erroEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
});

document.getElementById('btn-logout').addEventListener('click', () => {
  Api.setToken(null);
  Api.setUsuario(null);
  mostrarLogin();
});

// ---------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------
async function carregarDashboard() {
  try {
    const d = await Api.dashboard();

    document.getElementById('kpi-agricultores').textContent = d.agricultoresAtivos;
    document.getElementById('kpi-agricultores-sub').textContent = `+${d.novosEsteMes} este mês`;

    document.getElementById('kpi-estoque-baixo').textContent = d.produtosEstoqueBaixo;
    document.getElementById('kpi-vendas-hoje').textContent = d.vendasHoje;
    document.getElementById('kpi-vendas-pendentes').textContent = `${d.vendasPendentes} pendente(s)`;
    document.getElementById('kpi-faturamento').textContent = formatarMoeda(d.faturamentoMes);
    document.getElementById('kpi-total-vendas').textContent = `${d.totalVendas} vendas no total`;

    const alerta = document.getElementById('alert-estoque');
    if (d.produtosEstoqueBaixo > 0) {
      alerta.style.display = 'flex';
      document.getElementById('alert-estoque-texto').textContent =
        `${d.produtosEstoqueBaixo} produto(s) com estoque baixo. Verifique a página de Produtos.`;
    } else {
      alerta.style.display = 'none';
    }

    const tbody = document.getElementById('tbl-ultimas-vendas');
    if (!d.ultimasVendas.length) {
      tbody.innerHTML = '<tr><td class="empty-state" colspan="7">Nenhuma venda registrada ainda.</td></tr>';
    } else {
      tbody.innerHTML = d.ultimasVendas.map((v) => `
        <tr>
          <td>${escapeHtml(v.produtoNome)}</td>
          <td>${escapeHtml(v.clienteNome)}</td>
          <td>${v.quantidade}</td>
          <td>${formatarMoeda(v.valorFinal)}</td>
          <td>${escapeHtml(v.formaPagamento)}</td>
          <td><span class="badge ${v.status}">${statusLabel(v.status)}</span></td>
          <td>${formatarData(v.createdAt)}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}

function statusLabel(status) {
  return { concluida: 'Concluída', pendente: 'Pendente', cancelada: 'Cancelada' }[status] || status;
}

// ---------------------------------------------------------------
// Agricultores
// ---------------------------------------------------------------
async function carregarAgricultores() {
  const tbody = document.getElementById('tbl-agricultores');
  tbody.innerHTML = '<tr><td class="empty-state" colspan="7">Carregando...</td></tr>';
  try {
    const busca = document.getElementById('busca-agri').value.trim();
    const resp = await Api.listarAgricultores(busca ? { busca } : {});
    if (!resp.dados.length) {
      tbody.innerHTML = '<tr><td class="empty-state" colspan="7">Nenhum agricultor encontrado.</td></tr>';
      return;
    }
    tbody.innerHTML = resp.dados.map((a) => `
      <tr>
        <td>${escapeHtml(a.nome)}</td>
        <td>${escapeHtml(a.cpf)}</td>
        <td>${escapeHtml(a.telefone)}</td>
        <td>${escapeHtml(a.cidade || '—')}${a.estado ? '/' + escapeHtml(a.estado) : ''}</td>
        <td>${formatarMoeda(a.totalVendas)}</td>
        <td><span class="badge ${a.ativo ? 'ativo' : 'inativo'}">${a.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td class="action-btns">
          <button class="btn-sm" onclick="editarAgricultor(${a.id})">Editar</button>
          <button class="btn-sm ${a.ativo ? 'danger' : 'success'}" onclick="alternarStatusAgricultor(${a.id})">${a.ativo ? 'Desativar' : 'Ativar'}</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td class="empty-state" colspan="7">${escapeHtml(err.message)}</td></tr>`;
  }
}

document.getElementById('busca-agri').addEventListener('input', debounce(carregarAgricultores, 350));

function novoAgricultor() {
  document.getElementById('form-agri').reset();
  document.getElementById('agri-id').value = '';
  document.getElementById('cad-agri-titulo').textContent = 'Novo agricultor';
  showPage('cad-agri');
}
document.getElementById('btn-novo-agri').addEventListener('click', novoAgricultor);
document.getElementById('tn-cadagri').addEventListener('click', novoAgricultor);

async function editarAgricultor(id) {
  try {
    const a = await Api.obterAgricultor(id);
    document.getElementById('agri-id').value = a.id;
    document.getElementById('agri-nome').value = a.nome || '';
    document.getElementById('agri-cpf').value = a.cpf || '';
    document.getElementById('agri-email').value = a.email || '';
    document.getElementById('agri-telefone').value = a.telefone || '';
    document.getElementById('agri-endereco').value = a.endereco || '';
    document.getElementById('agri-cep').value = a.cep || '';
    document.getElementById('agri-cidade').value = a.cidade || '';
    document.getElementById('agri-estado').value = a.estado || '';
    document.getElementById('cad-agri-titulo').textContent = 'Editar agricultor';
    showPage('cad-agri');
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function alternarStatusAgricultor(id) {
  try {
    await Api.alternarStatusAgricultor(id);
    toast('Status atualizado.');
    carregarAgricultores();
  } catch (err) {
    toast(err.message, 'error');
  }
}

document.getElementById('form-agri').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id = document.getElementById('agri-id').value;
  const dados = {
    nome: document.getElementById('agri-nome').value.trim(),
    cpf: document.getElementById('agri-cpf').value.trim(),
    email: document.getElementById('agri-email').value.trim() || null,
    telefone: document.getElementById('agri-telefone').value.trim(),
    endereco: document.getElementById('agri-endereco').value.trim() || null,
    cep: document.getElementById('agri-cep').value.trim() || null,
    cidade: document.getElementById('agri-cidade').value.trim() || null,
    estado: document.getElementById('agri-estado').value.trim().toUpperCase() || null,
  };

  if (!dados.nome || !dados.cpf || !dados.telefone) {
    toast('Nome, CPF e telefone são obrigatórios.', 'error');
    return;
  }

  const btn = document.getElementById('btn-salvar-agri');
  setBotaoCarregando(btn, true, 'Salvar agricultor');
  try {
    if (id) {
      await Api.atualizarAgricultor(id, dados);
      toast('Agricultor atualizado com sucesso.');
    } else {
      await Api.criarAgricultor(dados);
      toast('Agricultor cadastrado com sucesso.');
    }
    showPage('agricultores');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setBotaoCarregando(btn, false, 'Salvar agricultor');
  }
});

// ---------------------------------------------------------------
// Produtos
// ---------------------------------------------------------------
async function carregarProdutos() {
  const tbody = document.getElementById('tbl-produtos');
  tbody.innerHTML = '<tr><td class="empty-state" colspan="7">Carregando...</td></tr>';
  try {
    const busca = document.getElementById('busca-prod').value.trim();
    const resp = await Api.listarProdutos(busca ? { busca } : {});
    if (!resp.dados.length) {
      tbody.innerHTML = '<tr><td class="empty-state" colspan="7">Nenhum produto encontrado.</td></tr>';
      return;
    }
    tbody.innerHTML = resp.dados.map((p) => `
      <tr>
        <td>${escapeHtml(p.nome)}</td>
        <td>${escapeHtml(p.categoria)}</td>
        <td>${escapeHtml(p.agricultorNome)}</td>
        <td>${formatarMoeda(p.precoUnitario)} / ${escapeHtml(p.tipoVenda)}</td>
        <td><span class="stock-dot stock-${p.stockStatus}"></span>${p.estoque} ${escapeHtml(p.tipoVenda)}</td>
        <td><span class="badge ${p.ativo ? 'ativo' : 'inativo'}">${p.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td class="action-btns">
          <button class="btn-sm" onclick="editarProduto(${p.id})">Editar</button>
          <button class="btn-sm ${p.ativo ? 'danger' : 'success'}" onclick="alternarStatusProduto(${p.id})">${p.ativo ? 'Desativar' : 'Ativar'}</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td class="empty-state" colspan="7">${escapeHtml(err.message)}</td></tr>`;
  }
}

document.getElementById('busca-prod').addEventListener('input', debounce(carregarProdutos, 350));

async function preencherSelectAgricultores(selectId, valorSelecionado) {
  const select = document.getElementById(selectId);
  select.innerHTML = '<option value="">Carregando...</option>';
  try {
    const opcoes = await Api.opcoesAgricultores();
    select.innerHTML = opcoes.map((a) => `<option value="${a.id}">${escapeHtml(a.nome)}</option>`).join('');
    if (valorSelecionado) select.value = valorSelecionado;
  } catch (err) {
    select.innerHTML = '<option value="">Erro ao carregar agricultores</option>';
    toast(err.message, 'error');
  }
}

async function novoProduto() {
  document.getElementById('form-prod').reset();
  document.getElementById('prod-id').value = '';
  document.getElementById('prod-estoque').value = 0;
  document.getElementById('prod-estoquemin').value = 10;
  document.getElementById('cad-prod-titulo').textContent = 'Novo produto';
  await preencherSelectAgricultores('prod-agricultor');
  showPage('cad-prod');
}
document.getElementById('btn-novo-prod').addEventListener('click', novoProduto);
document.getElementById('tn-cadprod').addEventListener('click', novoProduto);

async function editarProduto(id) {
  try {
    const p = await Api.obterProduto(id);
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-nome').value = p.nome || '';
    document.getElementById('prod-categoria').value = p.categoria || '';
    document.getElementById('prod-tipovenda').value = p.tipoVenda || 'kg';
    document.getElementById('prod-preco').value = p.precoUnitario;
    document.getElementById('prod-estoque').value = p.estoque;
    document.getElementById('prod-estoquemin').value = p.estoqueMinimo;
    document.getElementById('prod-descricao').value = p.descricao || '';
    document.getElementById('cad-prod-titulo').textContent = 'Editar produto';
    await preencherSelectAgricultores('prod-agricultor', p.agricultorId);
    showPage('cad-prod');
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function alternarStatusProduto(id) {
  try {
    await Api.alternarStatusProduto(id);
    toast('Status atualizado.');
    carregarProdutos();
  } catch (err) {
    toast(err.message, 'error');
  }
}

document.getElementById('form-prod').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id = document.getElementById('prod-id').value;
  const dados = {
    nome: document.getElementById('prod-nome').value.trim(),
    categoria: document.getElementById('prod-categoria').value.trim(),
    tipoVenda: document.getElementById('prod-tipovenda').value,
    precoUnitario: Number(document.getElementById('prod-preco').value),
    estoque: Number(document.getElementById('prod-estoque').value) || 0,
    estoqueMinimo: Number(document.getElementById('prod-estoquemin').value) || 0,
    agricultorId: Number(document.getElementById('prod-agricultor').value),
    descricao: document.getElementById('prod-descricao').value.trim() || null,
  };

  if (!dados.nome || !dados.categoria || !dados.tipoVenda || !dados.agricultorId || Number.isNaN(dados.precoUnitario)) {
    toast('Nome, categoria, tipo de venda, preço e agricultor são obrigatórios.', 'error');
    return;
  }

  const btn = document.getElementById('btn-salvar-prod');
  setBotaoCarregando(btn, true, 'Salvar produto');
  try {
    if (id) {
      await Api.atualizarProduto(id, dados);
      toast('Produto atualizado com sucesso.');
    } else {
      await Api.criarProduto(dados);
      toast('Produto cadastrado com sucesso.');
    }
    showPage('produtos');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setBotaoCarregando(btn, false, 'Salvar produto');
  }
});

// ---------------------------------------------------------------
// Vendas
// ---------------------------------------------------------------
async function carregarVendas() {
  const tbody = document.getElementById('tbl-vendas');
  tbody.innerHTML = '<tr><td class="empty-state" colspan="8">Carregando...</td></tr>';
  try {
    const busca = document.getElementById('busca-venda').value.trim();
    const resp = await Api.listarVendas(busca ? { busca } : {});
    if (!resp.dados.length) {
      tbody.innerHTML = '<tr><td class="empty-state" colspan="8">Nenhuma venda encontrada.</td></tr>';
      return;
    }
    tbody.innerHTML = resp.dados.map((v) => `
      <tr>
        <td>${escapeHtml(v.produtoNome)}</td>
        <td>${escapeHtml(v.clienteNome)}</td>
        <td>${v.quantidade}</td>
        <td>${formatarMoeda(v.valorFinal)}</td>
        <td>${escapeHtml(v.formaPagamento)}</td>
        <td><span class="badge ${v.status}">${statusLabel(v.status)}</span></td>
        <td>${formatarData(v.createdAt)}</td>
        <td class="action-btns">
          ${v.status !== 'cancelada' ? `<button class="btn-sm danger" onclick="cancelarVenda(${v.id})">Cancelar</button>` : ''}
          ${v.status === 'pendente' ? `<button class="btn-sm success" onclick="concluirVenda(${v.id})">Concluir</button>` : ''}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td class="empty-state" colspan="8">${escapeHtml(err.message)}</td></tr>`;
  }
}

document.getElementById('busca-venda').addEventListener('input', debounce(carregarVendas, 350));

async function cancelarVenda(id) {
  if (!confirm('Cancelar esta venda? O estoque do produto será devolvido.')) return;
  try {
    await Api.atualizarStatusVenda(id, 'cancelada');
    toast('Venda cancelada.');
    carregarVendas();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function concluirVenda(id) {
  try {
    await Api.atualizarStatusVenda(id, 'concluida');
    toast('Venda concluída.');
    carregarVendas();
  } catch (err) {
    toast(err.message, 'error');
  }
}

let produtosCache = [];

async function novaVenda() {
  document.getElementById('form-venda').reset();
  document.getElementById('venda-valor-estimado').value = 'R$ 0,00';
  const select = document.getElementById('venda-produto');
  select.innerHTML = '<option value="">Carregando...</option>';
  try {
    produtosCache = await Api.opcoesProdutos();
    select.innerHTML = produtosCache.map((p) =>
      `<option value="${p.id}">${escapeHtml(p.nome)} — ${formatarMoeda(p.precoUnitario)}/${escapeHtml(p.tipoVenda)} (estoque: ${p.estoque})</option>`
    ).join('');
    atualizarValorEstimado();
  } catch (err) {
    select.innerHTML = '<option value="">Erro ao carregar produtos</option>';
    toast(err.message, 'error');
  }
  showPage('reg-venda');
}
document.getElementById('btn-nova-venda').addEventListener('click', novaVenda);
document.getElementById('tn-regvenda').addEventListener('click', novaVenda);

function atualizarValorEstimado() {
  const produtoId = Number(document.getElementById('venda-produto').value);
  const qtd = Number(document.getElementById('venda-quantidade').value) || 0;
  const desconto = Number(document.getElementById('venda-desconto').value) || 0;
  const produto = produtosCache.find((p) => p.id === produtoId);
  const valor = produto ? Math.max(0, qtd * produto.precoUnitario - desconto) : 0;
  document.getElementById('venda-valor-estimado').value = formatarMoeda(valor);
}
document.getElementById('venda-produto').addEventListener('change', atualizarValorEstimado);
document.getElementById('venda-quantidade').addEventListener('input', atualizarValorEstimado);
document.getElementById('venda-desconto').addEventListener('input', atualizarValorEstimado);

document.getElementById('form-venda').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const dados = {
    produtoId: Number(document.getElementById('venda-produto').value),
    quantidade: Number(document.getElementById('venda-quantidade').value),
    desconto: Number(document.getElementById('venda-desconto').value) || 0,
    clienteNome: document.getElementById('venda-cliente').value.trim(),
    clienteTelefone: document.getElementById('venda-cliente-tel').value.trim() || null,
    formaPagamento: document.getElementById('venda-pagamento').value,
    status: document.getElementById('venda-status').value,
    observacoes: document.getElementById('venda-obs').value.trim() || null,
  };

  if (!dados.produtoId || !dados.quantidade || !dados.clienteNome || !dados.formaPagamento) {
    toast('Produto, quantidade, cliente e forma de pagamento são obrigatórios.', 'error');
    return;
  }

  const btn = document.getElementById('btn-salvar-venda');
  setBotaoCarregando(btn, true, 'Registrar venda');
  try {
    await Api.criarVenda(dados);
    toast('Venda registrada com sucesso.');
    showPage('vendas');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setBotaoCarregando(btn, false, 'Registrar venda');
  }
});

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// ---------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------
(function init() {
  if (Api.getToken() && Api.getUsuario()) {
    mostrarApp();
  } else {
    mostrarLogin();
  }
})();
