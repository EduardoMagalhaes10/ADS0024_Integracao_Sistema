const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { JWT_SECRET } = require('../middleware/auth');

function login(req, res) {
  const { email, senha } = req.body || {};
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe email e senha.' });
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  if (!usuario) {
    return res.status(401).json({ erro: 'Email ou senha inválidos.' });
  }

  const senhaValida = bcrypt.compareSync(senha, usuario.senha_hash);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'Email ou senha inválidos.' });
  }

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel },
  });
}

function me(req, res) {
  res.json({ usuario: req.usuario });
}

module.exports = { login, me };
