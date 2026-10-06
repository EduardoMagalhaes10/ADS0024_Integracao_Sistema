const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const agricultoresRoutes = require('./routes/agricultores.routes');
const produtosRoutes = require('./routes/produtos.routes');
const vendasRoutes = require('./routes/vendas.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', servico: 'AgriGest API' }));

app.use('/api/auth', authRoutes);
app.use('/api/agricultores', agricultoresRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

// Tratamento de erros não previstos
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

module.exports = app;
