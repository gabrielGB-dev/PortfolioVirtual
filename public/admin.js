// Substitua pela URL da sua API no Render
const API_URL = 'https://seu-backend.onrender.com';

const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

if (!token || usuario?.role !== 'admin') {
    window.location.href = 'login.html';
}

let usuarios = [];
let usuarioEmEdicao = null, tipoAtualUsuarios = 'professor';

function escaparHTML(t) {
    return String(t ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

async function api(path, opts = {}) {
    const headers = { Authorization: `Bearer ${token}` };
    if (opts.body) headers['Content-Type'] = 'application/json';

    const resp = await fetch(`${API_URL}/api` + path, { ...opts, headers });

    if (resp.status === 401) {
        localStorage.clear();
        window.location.href = 'login.html';
        return;
    }

    const dados = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(dados.erro || 'Erro na requisição.');
    return dados;
}

// Tabs
document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(b => b.classList.remove('ativo'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('ativo'));
        btn.classList.add('ativo');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('ativo');
    });
});

// Usuários
async function carregarUsuarios(tipo) {
    tipoAtualUsuarios = tipo;
    usuarios = await api(`/admin/usuarios/${tipo}`);
    const tbody = document.getElementById('tbody-usuarios');

    if (!usuarios.length) {
        tbody.innerHTML = '<tr><td colspan="4">Nenhum usuário.</td></tr>';
        return;
    }

    tbody.innerHTML = usuarios.map(u => `
    <tr>
      <td>${escaparHTML(u.nome)}</td>
      <td>${escaparHTML(u.email)}</td>
      <td>${u.ativo ? 'Sim' : 'Não'}</td>
      <td>
        <button data-acao="editar" data-id="${u.id}">Editar</button>
        <button data-acao="excluir" data-id="${u.id}">Excluir</button>
      </td>
    </tr>
  `).join('');
}

document.getElementById('btn-listar-usuarios').addEventListener('click', () => {
    carregarUsuarios(document.getElementById('filtro-tipo-usuario').value).catch(e => alert(e.message));
});

document.getElementById('btn-cancelar-usuario').addEventListener('click', () => {
    usuarioEmEdicao = null;
    document.getElementById('form-usuario').reset();
    document.getElementById('usuario-tipo').disabled = false;
    document.getElementById('usuario-ativo').checked = true;
});

document.getElementById('tbody-usuarios').addEventListener('click', async e => {
    const btn = e.target.closest('button[data-acao]');
    if (!btn) return;

    const id = Number(btn.dataset.id);

    if (btn.dataset.acao === 'excluir') {
        if (!confirm('Excluir este usuário?')) return;
        try {
            await api(`/admin/usuarios/${tipoAtualUsuarios}/${id}`, { method: 'DELETE' });
            carregarUsuarios(tipoAtualUsuarios);
        } catch (err) {
            alert(err.message);
        }
    }

    if (btn.dataset.acao === 'editar') {
        const u = usuarios.find(x => x.id === id);
        if (!u) return;

        usuarioEmEdicao = { id: u.id, tipo: tipoAtualUsuarios };
        document.getElementById('usuario-id').value = u.id;
        document.getElementById('usuario-tipo').value = tipoAtualUsuarios;
        document.getElementById('usuario-tipo').disabled = true;
        document.getElementById('usuario-nome').value = u.nome;
        document.getElementById('usuario-email').value = u.email;
        document.getElementById('usuario-senha').value = '';
        document.getElementById('usuario-senha').placeholder = 'Deixe em branco para manter';
        document.getElementById('usuario-ativo').checked = Boolean(u.ativo);
    }
});

document.getElementById('form-usuario').addEventListener('submit', async e => {
    e.preventDefault();

    const nome = document.getElementById('usuario-nome').value.trim();
    const email = document.getElementById('usuario-email').value.trim();
    const senha = document.getElementById('usuario-senha').value;
    const ativo = document.getElementById('usuario-ativo').checked ? 1 : 0;
    const tipo = usuarioEmEdicao ? usuarioEmEdicao.tipo : document.getElementById('usuario-tipo').value;

    try {
        if (usuarioEmEdicao) {
            const payload = { nome, email, ativo };
            if (senha) payload.senha = senha;
            await api(`/admin/usuarios/${usuarioEmEdicao.tipo}/${usuarioEmEdicao.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
            if (!senha) { alert('Informe uma senha.'); return; }
            await api('/admin/usuarios', { method: 'POST', body: JSON.stringify({ tipo, nome, email, senha, ativo }) });
        }
        document.getElementById('btn-cancelar-usuario').click();
        await carregarUsuarios(tipo);
        alert('Usuário salvo.');
    } catch (err) {
        alert(err.message);
    }
});

document.getElementById('btn-sair').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

// Inicialização
(async () => {
    try {
        await Promise.all([carregarUsuarios('professor')]);
    } catch (e) {
        console.error(e);
        alert('Erro ao carregar dados.');
    }
})();