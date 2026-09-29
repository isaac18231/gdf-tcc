/* ============================================================
   GDF — script.js
   Interações da página institucional (index.html)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const toggle = $('.nav-toggle');
  const nav = $('.main-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
    $all('.main-nav a').forEach(link => {
      link.addEventListener('click', () => nav.classList.remove('open'));
    });
  }

  const anoEl = $('#ano-atual');
  if (anoEl) anoEl.textContent = new Date().getFullYear();

  // se já existir sessão ativa, ajusta os botões de "Entrar" para ir direto ao painel
  const sessao = typeof getSessao === 'function' ? getSessao() : null;
  if (sessao) {
    $all('[data-auth-link]').forEach(el => {
      el.href = REDIRECT_POR_TIPO[sessao.tipo] || 'login.html';
      el.textContent = 'Ir para o meu painel';
    });
  }

  // animação sutil de entrada no hero (um único momento orquestrado)
  const hero = $('.hero');
  if (hero) {
    hero.classList.add('is-ready');
  }
});
