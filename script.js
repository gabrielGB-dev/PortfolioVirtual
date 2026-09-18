// Substitua pela URL da sua API no Render
const API_URL = 'https://portfoliovirtual.onrender.com';

// Elementos
const header = document.getElementById('header');
const hamburguer = document.getElementById('hamburguer');
const menu = document.getElementById('menu');
const btnTopo = document.getElementById('voltar-topo');
const toast = document.getElementById('toast');
const formulario = document.getElementById('formulario');
const linksMenu = document.querySelectorAll('.menu a[href^="#"]');
const secoes = document.querySelectorAll('main section[id]');

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxAtividade = document.getElementById('lightbox-atividade');
const lightboxProf = document.getElementById('lightbox-prof');
const lightboxFechar = document.getElementById('lightbox-fechar');

const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

// Menu
hamburguer.addEventListener('click', () => {
  const aberto = menu.classList.toggle('aberto');
  hamburguer.classList.toggle('ativo', aberto);
  hamburguer.setAttribute('aria-expanded', aberto);
});

linksMenu.forEach(link => {
  link.addEventListener('click', () => {
    menu.classList.remove('aberto');
    hamburguer.classList.remove('ativo');
    hamburguer.setAttribute('aria-expanded', 'false');
  });
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 1024) {
    menu.classList.remove('aberto');
    hamburguer.classList.remove('ativo');
  }
});

// Scroll Suave
function aoRolar() {
  header.classList.toggle('rolagem', window.scrollY > 40);
  btnTopo.classList.toggle('visivel', window.scrollY > 500);
  const pos = window.scrollY + 140;
  let atual = secoes[0].id;
  secoes.forEach(s => { if (s.offsetTop <= pos) atual = s.id; });
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
    atual = secoes[secoes.length - 1].id;
  }
  linksMenu.forEach(l => {
    l.classList.toggle('ativo', l.getAttribute('href') === '#' + atual);
  });
}
window.addEventListener('scroll', aoRolar, { passive: true });
aoRolar();

btnTopo.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// Reveal
const observerReveal = new IntersectionObserver(entradas => {
  entradas.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visivel');
      observerReveal.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('[data-reveal]').forEach(el => observerReveal.observe(el));

// Lightbox
function abrirLightbox(card) {
  const img = card.querySelector('img');
  if (!img || img.style.display === 'none') return;

  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;

  const titulo = card.querySelector('h4');
  lightboxAtividade.textContent = titulo ? titulo.textContent : '';

  const prof = card.querySelector('.atividade-prof span');
  const nomeProf = prof ? prof.textContent.trim() : '';
  lightboxProf.textContent = nomeProf && nomeProf !== '—' ? 'Prof(a): ' + nomeProf : '';

  lightbox.classList.add('aberto');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function fecharLightbox() {
  lightbox.classList.remove('aberto');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

lightboxFechar.addEventListener('click', fecharLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) fecharLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharLightbox(); });

// Tabela de Horários
const tabela = document.querySelector('.tabela-horarios');
if (tabela) {
  const agora = new Date();
  const dia = agora.getDay();
  if (dia >= 1 && dia <= 5) {
    tabela.querySelectorAll('tr').forEach(linha => {
      const celula = linha.children[dia];
      if (celula) celula.classList.add('hoje');
    });
  }
  const hora = agora.getHours();
  const linhas = tabela.querySelectorAll('tbody tr');
  let periodoAtual = null;
  if (hora >= 8 && hora < 11) periodoAtual = 0;
  else if (hora >= 13 && hora < 19) periodoAtual = 1;
  else if (hora >= 19 && hora < 22) periodoAtual = 2;
  if (periodoAtual !== null && linhas[periodoAtual]) {
    linhas[periodoAtual].classList.add('periodo-atual');
  }
}

// Form Contato
formulario.addEventListener('submit', e => {
  e.preventDefault();
  toast.classList.add('mostrar');
  formulario.reset();
  setTimeout(() => toast.classList.remove('mostrar'), 3500);
});

// Fallback da Foto
const foto = document.getElementById('foto-gabriel');
if (foto) {
  foto.addEventListener('error', () => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='720'><rect width='600' height='720' rx='40' fill='#8d76f5'/><circle cx='300' cy='260' r='120' fill='#ffffff' opacity='0.9'/><rect x='140' y='410' width='320' height='220' rx='60' fill='#ffffff' opacity='0.9'/><text x='300' y='660' font-size='60' text-anchor='middle' fill='#ffffff' font-family='Arial' font-weight='bold'>Gabriel Feitosa</text></svg>`;
    foto.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  });
}

const anoEl = document.getElementById('ano');
if (anoEl) anoEl.textContent = new Date().getFullYear();

// Matérias Colapsáveis
document.querySelectorAll('.area-eixo').forEach(area => {
  const titulo = area.querySelector('h3');
  if (!titulo) return;
  titulo.setAttribute('role', 'button');
  titulo.setAttribute('tabindex', '0');
  titulo.addEventListener('click', () => area.classList.toggle('colapsado'));
  titulo.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      area.classList.toggle('colapsado');
    }
  });
});

// Eixos Colapsáveis
document.querySelectorAll('.secao-eixo').forEach(secao => {
  const titulo = secao.querySelector('.eixo-secao-titulo');
  if (!titulo) return;
  titulo.setAttribute('role', 'button');
  titulo.setAttribute('tabindex', '0');
  titulo.addEventListener('click', () => secao.classList.toggle('colapsado'));
  titulo.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      secao.classList.toggle('colapsado');
    }
  });
  if (!secao.classList.contains('escolhido-secao')) {
    secao.classList.add('colapsado');
  }
});

// Inicialização
(function init() {
  document.querySelectorAll('.btn-avaliar').forEach(btn => btn.remove());

  document.querySelectorAll('.eixos-grid').forEach(grid => {
    const atividades = grid.querySelectorAll('.atividade');
    if (atividades.length > 4) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-recolher';
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML =
        `<span class="btn-texto">Ver mais ${atividades.length - 4} atividade(s)</span>` +
        `<span class="btn-seta">▾</span>`;
      grid.insertAdjacentElement('afterend', btn);
      btn.addEventListener('click', () => {
        const expandido = grid.classList.toggle('expandido');
        btn.classList.toggle('virado', expandido);
        btn.setAttribute('aria-expanded', expandido);
        btn.querySelector('.btn-texto').textContent = expandido
          ? 'Recolher atividades'
          : `Ver mais ${atividades.length - 4} atividade(s)`;
      });
    }
  });

  const areasEl = document.getElementById('areas');
  if (areasEl) areasEl.classList.add('visivel');
  configurarCards();
})();

function configurarCards() {
  document.querySelectorAll('.atividade').forEach(card => {
    card.addEventListener('click', () => abrirLightbox(card));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirLightbox(card); }
    });
  });

  document.querySelectorAll('.atividade-img img').forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
      img.parentElement.classList.add('sem-img');
    });
  });
}

// Verificação de Sessão
(function verificarSessao() {
  const token = localStorage.getItem('token');
  if (!token || !usuario) {
    window.location.href = 'login.html';
    return;
  }

  if (usuario.role === 'admin') {
    const linkAdmin = document.getElementById('link-admin');
    if (linkAdmin) linkAdmin.style.display = 'inline-block';
  }

  const linkSair = document.getElementById('link-sair');
  if (linkSair) {
    linkSair.style.display = 'inline-block';
    linkSair.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = 'login.html';
    });
  }
})();