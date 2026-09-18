require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
    console.error('ERRO CRÍTICO: Defina JWT_SECRET no arquivo .env ou no Render');
    process.exit(1);
}

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));

// Permite requisições do GitHub Pages ou localhost
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
app.use(cors({
    origin: FRONTEND_URL === '*' ? '*' : [FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:5500'],
    credentials: true
}));

app.use(express.json());

// Rota de status da API
app.get('/', (req, res) => res.json({ status: 'API rodando com sucesso no Render.com com Supabase!' }));

// Pool de conexão PostgreSQL (Supabase)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const TABELAS = {
    admin: 'admins',
    professor: 'professores',
    estudante: 'estudantes'
};

// ============================================================
// MIDDLEWARES
// ============================================================
function autenticar(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ erro: 'Token não enviado.' });
    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ erro: 'Token inválido.' });
    }
}

function exigirRole(...roles) {
    return (req, res, next) => {
        if (!req.usuario || !roles.includes(req.usuario.role)) {
            return res.status(403).json({ erro: 'Acesso negado.' });
        }
        next();
    };
}

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { erro: 'Muitas tentativas. Tente novamente em alguns minutos.' }
});

// ============================================================
// ROTAS AUTENTICAÇÃO
// ============================================================
app.post('/api/auth/login', loginLimiter, asyncHandler(async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'Informe e-mail e senha.' });

    const candidatos = [];
    for (const [role, tabela] of Object.entries(TABELAS)) {
        const result = await pool.query(
            `SELECT id, nome, email, senha FROM ${tabela} WHERE email = $1 AND ativo = TRUE LIMIT 1`,
            [email]
        );
        if (!result.rows.length) continue;
        const u = result.rows[0];
        if (await bcrypt.compare(senha, u.senha)) {
            candidatos.push({ id: u.id, nome: u.nome, email: u.email, role });
        }
    }

    if (!candidatos.length) return res.status(401).json({ erro: 'Usuário ou senha incorretos.' });

    const usuario = candidatos[0];
    const token = jwt.sign(
        { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    res.json({ token, usuario });
}));

app.get('/api/auth/me', autenticar, (req, res) => {
    res.json({ usuario: req.usuario });
});

// ============================================================
// ROTAS ADMIN
// ============================================================
app.get('/api/admin/usuarios/:tipo', autenticar, exigirRole('admin'), asyncHandler(async (req, res) => {
    const tabela = TABELAS[req.params.tipo];
    if (!tabela) return res.status(400).json({ erro: 'Tipo inválido.' });
    const result = await pool.query(`SELECT id, nome, email, ativo FROM ${tabela} ORDER BY nome`);
    res.json(result.rows);
}));

app.post('/api/admin/usuarios', autenticar, exigirRole('admin'), asyncHandler(async (req, res) => {
    const { tipo, nome, email, senha, ativo } = req.body;
    const tabela = TABELAS[tipo];
    if (!tabela) return res.status(400).json({ erro: 'Tipo inválido.' });
    if (!nome || !email || !senha) return res.status(400).json({ erro: 'Preencha todos os campos.' });
    if (String(senha).length < 8) return res.status(400).json({ erro: 'Senha com no mínimo 8 caracteres.' });

    const hash = await bcrypt.hash(senha, 10);
    try {
        const isAtivo = ativo !== 0 && ativo !== false;
        const result = await pool.query(
            `INSERT INTO ${tabela} (nome, email, senha, ativo) VALUES ($1, $2, $3, $4) RETURNING id`,
            [nome, email, hash, isAtivo]
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch (e) {
        if (e.code === '23505') return res.status(409).json({ erro: 'E-mail já cadastrado.' });
        throw e;
    }
}));

app.put('/api/admin/usuarios/:tipo/:id', autenticar, exigirRole('admin'), asyncHandler(async (req, res) => {
    const tabela = TABELAS[req.params.tipo];
    if (!tabela) return res.status(400).json({ erro: 'Tipo inválido.' });
    const id = Number(req.params.id);
    const { nome, email, senha, ativo } = req.body;
    const campos = [], valores = [];
    let contador = 1;

    if (nome !== undefined) { campos.push(`nome = $${contador++}`); valores.push(nome); }
    if (email !== undefined) { campos.push(`email = $${contador++}`); valores.push(email); }
    if (senha) {
        if (String(senha).length < 8) return res.status(400).json({ erro: 'Senha com no mínimo 8 caracteres.' });
        campos.push(`senha = $${contador++}`); valores.push(await bcrypt.hash(senha, 10));
    }
    if (ativo !== undefined) { campos.push(`ativo = $${contador++}`); valores.push(Boolean(ativo)); }
    if (!campos.length) return res.status(400).json({ erro: 'Nada para atualizar.' });

    valores.push(id);
    const result = await pool.query(`UPDATE ${tabela} SET ${campos.join(', ')} WHERE id = $${contador}`, valores);
    if (!result.rowCount) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json({ mensagem: 'Usuário atualizado.' });
}));

app.delete('/api/admin/usuarios/:tipo/:id', autenticar, exigirRole('admin'), asyncHandler(async (req, res) => {
    const tabela = TABELAS[req.params.tipo];
    if (!tabela) return res.status(400).json({ erro: 'Tipo inválido.' });
    const result = await pool.query(`DELETE FROM ${tabela} WHERE id = $1`, [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json({ mensagem: 'Usuário removido.' });
}));

app.get('/api/eixos', asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT * FROM eixos ORDER BY ordem');
    res.json(result.rows);
}));

app.get('/api/materias', asyncHandler(async (req, res) => {
    const { eixo_id } = req.query;
    let sql = 'SELECT * FROM materias';
    const params = [];
    if (eixo_id) {
        sql += ' WHERE eixo_id = $1';
        params.push(eixo_id);
    }
    sql += ' ORDER BY ordem';
    const result = await pool.query(sql, params);
    res.json(result.rows);
}));

// ============================================================
// TRATAMENTO DE ERROS
// ============================================================
app.use((err, req, res, next) => {
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ erro: 'Registro duplicado.' });
    res.status(500).json({ erro: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));