// Substitua pela URL da sua API no Render
const API_URL = 'https://portfoliovirtual.onrender.com';

function logar(event) {
    event.preventDefault();

    const email = document.getElementById('login').value.trim();
    const senha = document.getElementById('senha').value;
    const erroLogin = document.getElementById('erro-login');

    erroLogin.textContent = 'Entrando...';

    fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    })
        .then(resp => resp.json())
        .then(dados => {
            if (dados.erro) throw new Error(dados.erro);

            localStorage.setItem('token', dados.token);
            localStorage.setItem('usuario', JSON.stringify(dados.usuario));

            if (dados.usuario.role === 'admin') {
                window.location.href = 'admin.html?token=' + encodeURIComponent(dados.token);
            } else {
                window.location.href = 'index.html';
            }
        })
        .catch(err => {
            erroLogin.textContent = err.message;
        });
}