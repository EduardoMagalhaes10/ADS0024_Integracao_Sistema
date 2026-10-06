// AgriGest - api.js
// Camada de comunicação com a API. Nenhuma outra parte do frontend
// deve chamar fetch() diretamente — tudo passa por aqui.

const API_BASE = 'http://localhost:3001/api';

const Api = (() => {
  function getToken() {
    return localStorage.getItem('agrigest_token');
  }

  function setToken(token) {
    if (token) localStorage.setItem('agrigest_token', token);
    else localStorage.removeItem('agrigest_token');
  }

  function getUsuario() {
    try {
      return JSON.parse(localStorage.getItem('agrigest_usuario') || 'null');
    } catch {
      return null;
    }
  }

  function setUsuario(usuario) {
    if (usuario) localStorage.setItem('agrigest_usuario', JSON.stringify(usuario));
    else localStorage.removeItem('agrigest_usuario');
  }

  async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let resp;
    try {
      resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch (err) {
      throw new Error('Não foi possível conectar à API. Verifique se o backend está rodando em ' + API_BASE + '.');
    }

    let data = null;
    try {
      data = await resp.json();
    } catch {
      data = null;
    }

    if (resp.status === 401) {
      setToken(null);
      setUsuario(null);
      throw new Error((data && data.erro) || 'Sessão expirada. Faça login novamente.');
    }

    if (!resp.ok) {
      throw new Error((data && data.erro) || `Erro na requisição (${resp.status}).`);
    }

    return data;
  }

  return {
    getToken, setToken, getUsuario, setUsuario,

    // ---- autenticação ----
    login: (email, senha) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) }),
    me: () => request('/auth/me'),

    // ---- dashboard ----
    dashboard: () => request('/dashboard'),

    // ---- agricultores ----
    listarAgricultores: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/agricultores${qs ? `?${qs}` : ''}`);
    },
    opcoesAgricultores: () => request('/agricultores/options'),
    obterAgricultor: (id) => request(`/agricultores/${id}`),
    criarAgricultor: (dados) => request('/agricultores', { method: 'POST', body: JSON.stringify(dados) }),
    atualizarAgricultor: (id, dados) => request(`/agricultores/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
    alternarStatusAgricultor: (id) => request(`/agricultores/${id}/status`, { method: 'PATCH' }),

    // ---- produtos ----
    listarProdutos: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/produtos${qs ? `?${qs}` : ''}`);
    },
    opcoesProdutos: () => request('/produtos/options'),
    obterProduto: (id) => request(`/produtos/${id}`),
    criarProduto: (dados) => request('/produtos', { method: 'POST', body: JSON.stringify(dados) }),
    atualizarProduto: (id, dados) => request(`/produtos/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
    alternarStatusProduto: (id) => request(`/produtos/${id}/status`, { method: 'PATCH' }),

    // ---- vendas ----
    listarVendas: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/vendas${qs ? `?${qs}` : ''}`);
    },
    obterVenda: (id) => request(`/vendas/${id}`),
    criarVenda: (dados) => request('/vendas', { method: 'POST', body: JSON.stringify(dados) }),
    atualizarStatusVenda: (id, status) => request(`/vendas/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  };
})();
