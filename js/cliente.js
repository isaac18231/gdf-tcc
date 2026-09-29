/* ============================================================
   GDF — cliente.js
   Painel do cliente: visualização (somente leitura) dos
   serviços contratados e do andamento de cada um.
   ============================================================ */

let usuarioAtual = null;

document.addEventListener('DOMContentLoaded', () => {
  usuarioAtual = protegerPagina(['cliente']);
  if (!usuarioAtual) return;

  montarSidebar();
  renderResumo();
  renderServicos();

  const busca = $('#busca-servico');
  const filtro = $('#filtro-status');
  if (busca) busca.addEventListener('input', renderServicos);
  if (filtro) filtro.addEventListener('change', renderServicos);

  const btnMenu = $('.mobile-menu-btn');
  if (btnMenu) btnMenu.addEventListener('click', () => {
    $('.sidebar').classList.add('open');
    $('.sidebar-backdrop').classList.add('open');
  });
  const backdrop = $('.sidebar-backdrop');
  if (backdrop) backdrop.addEventListener('click', () => {
    $('.sidebar').classList.remove('open');
    backdrop.classList.remove('open');
  });

  $all('[data-logout]').forEach(btn => btn.addEventListener('click', logout));

  const overlay = $('#modal-detalhes');
  if (overlay) {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) fecharModalDetalhes(); });
    $('#fechar-modal-detalhes').addEventListener('click', fecharModalDetalhes);
  }
});

function montarSidebar() {
  const inicial = usuarioAtual.nome.trim().charAt(0).toUpperCase();
  $('#side-avatar').textContent = inicial;
  $('#side-nome').textContent = usuarioAtual.nome;
}

function meusServicos() {
  return getServicos().filter(s => s.clienteId === usuarioAtual.id);
}

function renderResumo() {
  const servicos = meusServicos();
  const ativos = servicos.filter(s => !['concluido', 'cancelado'].includes(s.status)).length;
  const concluidos = servicos.filter(s => s.status === 'concluido').length;
  const aguardando = servicos.filter(s => s.status === 'aguardando').length;
  const ultima = servicos.reduce((max, s) => (!max || s.ultimaAtualizacao > max) ? s.ultimaAtualizacao : max, null);

  $('#stat-ativos').textContent = ativos;
  $('#stat-concluidos').textContent = concluidos;
  $('#stat-aguardando').textContent = aguardando;
  $('#stat-ultima').textContent = ultima ? formatarData(ultima) : '—';
}

function renderServicos() {
  const lista = $('#lista-servicos');
  const termo = ($('#busca-servico') ? $('#busca-servico').value : '').toLowerCase().trim();
  const statusFiltro = $('#filtro-status') ? $('#filtro-status').value : '';

  let servicos = meusServicos().sort((a, b) => b.ultimaAtualizacao.localeCompare(a.ultimaAtualizacao));

  if (termo) servicos = servicos.filter(s => s.nome.toLowerCase().includes(termo));
  if (statusFiltro) servicos = servicos.filter(s => s.status === statusFiltro);

  if (servicos.length === 0) {
    lista.innerHTML = '<div class="empty-state"><h4>Nenhum serviço encontrado</h4><p>Assim que você contratar um serviço com a GDF, ele aparecerá aqui.</p></div>';
    return;
  }

  const funcionarios = getUsers();
  lista.innerHTML = servicos.map(s => {
    const funcionario = funcionarios.find(f => f.id === s.funcionarioId);
    return `
      <div class="service-card">
        <div class="sc-head">
          <div>
            <h4>${escapeHtml(s.nome)}</h4>
            <div class="sc-id">ID: ${escapeHtml(s.id)}</div>
          </div>
          <span class="badge st-${s.status}">${STATUS_LABELS[s.status]}</span>
        </div>
        <p>${escapeHtml(s.descricao)}</p>
        <div class="sc-meta">
          <span>Contratado em ${new Date(s.dataCriacao).toLocaleDateString('pt-BR')}</span>
          <span>Resp.: ${funcionario ? escapeHtml(funcionario.nome) : '—'}</span>
        </div>
        <div class="sc-meta">
          <span>Última atualização: ${formatarData(s.ultimaAtualizacao)}</span>
          <button class="btn btn-ghost btn-sm" data-ver-detalhes="${s.id}">Ver detalhes</button>
        </div>
      </div>`;
  }).join('');

  $all('[data-ver-detalhes]').forEach(btn => {
    btn.addEventListener('click', () => abrirModalDetalhes(btn.getAttribute('data-ver-detalhes')));
  });
}

function abrirModalDetalhes(servicoId) {
  const servico = getServicos().find(s => s.id === servicoId);
  if (!servico) return;

  $('#detalhe-titulo').textContent = servico.nome;
  $('#detalhe-descricao').textContent = servico.descricao;
  $('#detalhe-progresso').innerHTML = montarBarraProgresso(servico.status);
  $('#detalhe-timeline').innerHTML = montarTimeline(servico.historico);

  $('#modal-detalhes').classList.add('open');
}
function fecharModalDetalhes() {
  $('#modal-detalhes').classList.remove('open');
}

function montarBarraProgresso(statusAtual) {
  if (statusAtual === 'cancelado') {
    return '<p style="color:var(--bad); font-weight:700; font-size:.9rem;">Este serviço foi cancelado.</p>';
  }
  const idxAtual = STATUS_PROGRESSO.indexOf(statusAtual === 'aguardando' ? 'recebido' : statusAtual);
  return '<div class="progress-track">' + STATUS_PROGRESSO.map((st, i) => {
    let classe = '';
    if (i < idxAtual) classe = 'done';
    else if (i === idxAtual) classe = 'current';
    return `<div class="progress-step ${classe}"><span class="line"></span><span class="dot"></span><span>${STATUS_LABELS[st]}</span></div>`;
  }).join('') + '</div>';
}

function montarTimeline(historico) {
  if (!historico || historico.length === 0) {
    return '<p class="cell-muted">Nenhuma atualização registrada ainda.</p>';
  }
  const funcionarios = getUsers();
  const ordenado = [...historico].sort((a, b) => b.data.localeCompare(a.data));
  return '<div class="timeline">' + ordenado.map(h => {
    const funcionario = funcionarios.find(f => f.id === h.funcionarioId);
    return `
      <div class="tl-item">
        <div class="tl-dot"></div>
        <div class="tl-body">
          <div class="tl-date">${formatarData(h.data)}</div>
          <div class="tl-status">Status alterado para: ${STATUS_LABELS[h.status]}</div>
          ${h.descricao ? `<p class="tl-obs">"${escapeHtml(h.descricao)}"</p>` : ''}
          <div class="tl-by">Responsável: ${funcionario ? escapeHtml(funcionario.nome) : 'Equipe GDF'}</div>
        </div>
      </div>`;
  }).join('') + '</div>';
}
