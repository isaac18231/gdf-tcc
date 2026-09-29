/* ============================================================
   GDF — funcionario.js
   Painel do funcionário: consulta de clientes/serviços e
   atualização do andamento (status + observação + histórico).
   ============================================================ */

let usuarioAtual = null;
let servicoEmEdicaoId = null;

document.addEventListener('DOMContentLoaded', () => {
  usuarioAtual = protegerPagina(['funcionario']);
  if (!usuarioAtual) return;

  $('#side-avatar').textContent = usuarioAtual.nome.trim().charAt(0).toUpperCase();
  $('#side-nome').textContent = usuarioAtual.nome;

  renderTabela();

  $('#busca-servico').addEventListener('input', renderTabela);
  $('#filtro-status').addEventListener('change', renderTabela);

  $('#form-atualizar').addEventListener('submit', salvarAtualizacao);
  $('#fechar-modal-atualizar').addEventListener('click', fecharModalAtualizar);
  $('#modal-atualizar').addEventListener('click', (e) => { if (e.target === $('#modal-atualizar')) fecharModalAtualizar(); });

  $('#fechar-modal-historico').addEventListener('click', () => $('#modal-historico').classList.remove('open'));
  $('#modal-historico').addEventListener('click', (e) => { if (e.target === $('#modal-historico')) $('#modal-historico').classList.remove('open'); });

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
});

function renderTabela() {
  const corpo = $('#tabela-servicos-body');
  const termo = $('#busca-servico').value.toLowerCase().trim();
  const statusFiltro = $('#filtro-status').value;

  const usuarios = getUsers();
  let servicos = getServicos().sort((a, b) => b.ultimaAtualizacao.localeCompare(a.ultimaAtualizacao));

  servicos = servicos.map(s => ({
    ...s,
    _cliente: usuarios.find(u => u.id === s.clienteId)
  }));

  if (termo) {
    servicos = servicos.filter(s =>
      s.nome.toLowerCase().includes(termo) ||
      (s._cliente && s._cliente.nome.toLowerCase().includes(termo))
    );
  }
  if (statusFiltro) servicos = servicos.filter(s => s.status === statusFiltro);

  if (servicos.length === 0) {
    corpo.innerHTML = `<tr><td colspan="6"><div class="empty-state"><h4>Nenhum serviço encontrado</h4><p>Ajuste a busca ou o filtro de status.</p></div></td></tr>`;
    return;
  }

  corpo.innerHTML = servicos.map(s => `
    <tr>
      <td class="cell-strong">${s._cliente ? escapeHtml(s._cliente.nome) : 'Cliente removido'}</td>
      <td>${escapeHtml(s.nome)}</td>
      <td><span class="badge st-${s.status}">${STATUS_LABELS[s.status]}</span></td>
      <td class="cell-muted">${formatarData(s.ultimaAtualizacao)}</td>
      <td class="cell-muted">${s.historico.length} evento(s)</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-outline btn-sm" data-ver-hist="${s.id}">Histórico</button>
          <button class="btn btn-primary btn-sm" data-atualizar="${s.id}">Atualizar</button>
        </div>
      </td>
    </tr>
  `).join('');

  $all('[data-atualizar]').forEach(btn => btn.addEventListener('click', () => abrirModalAtualizar(btn.getAttribute('data-atualizar'))));
  $all('[data-ver-hist]').forEach(btn => btn.addEventListener('click', () => abrirHistorico(btn.getAttribute('data-ver-hist'))));
}

function abrirModalAtualizar(servicoId) {
  const servico = getServicos().find(s => s.id === servicoId);
  if (!servico) return;
  servicoEmEdicaoId = servicoId;

  const usuarios = getUsers();
  const cliente = usuarios.find(u => u.id === servico.clienteId);

  $('#atualizar-titulo').textContent = servico.nome;
  $('#atualizar-cliente').textContent = 'Cliente: ' + (cliente ? cliente.nome : '—');
  $('#input-status').value = servico.status;
  $('#input-observacao').value = '';
  $('#input-responsavel').textContent = usuarioAtual.nome;

  $('#modal-atualizar').classList.add('open');
}
function fecharModalAtualizar() {
  $('#modal-atualizar').classList.remove('open');
  servicoEmEdicaoId = null;
}

function salvarAtualizacao(e) {
  e.preventDefault();
  if (!servicoEmEdicaoId) return;

  const novoStatus = $('#input-status').value;
  const observacao = $('#input-observacao').value.trim();

  if (!observacao) {
    mostrarToast('Descreva uma observação sobre esta atualização.', 'error');
    return;
  }

  const servicos = getServicos();
  const idx = servicos.findIndex(s => s.id === servicoEmEdicaoId);
  if (idx === -1) return;

  const agora = new Date().toISOString();
  servicos[idx].status = novoStatus;
  servicos[idx].ultimaAtualizacao = agora;
  servicos[idx].historico.push({
    id: gerarId('hist'),
    status: novoStatus,
    descricao: observacao,
    funcionarioId: usuarioAtual.id,
    data: agora
  });

  saveServicos(servicos);
  fecharModalAtualizar();
  renderTabela();
  mostrarToast('Serviço atualizado com sucesso!', 'success');
}

function abrirHistorico(servicoId) {
  const servico = getServicos().find(s => s.id === servicoId);
  if (!servico) return;
  const usuarios = getUsers();

  $('#historico-titulo').textContent = 'Histórico — ' + servico.nome;
  const ordenado = [...servico.historico].sort((a, b) => b.data.localeCompare(a.data));
  $('#historico-conteudo').innerHTML = ordenado.length ? '<div class="timeline">' + ordenado.map(h => {
    const func = usuarios.find(u => u.id === h.funcionarioId);
    return `
      <div class="tl-item">
        <div class="tl-dot"></div>
        <div class="tl-body">
          <div class="tl-date">${formatarData(h.data)}</div>
          <div class="tl-status">Status alterado para: ${STATUS_LABELS[h.status]}</div>
          ${h.descricao ? `<p class="tl-obs">"${escapeHtml(h.descricao)}"</p>` : ''}
          <div class="tl-by">Responsável: ${func ? escapeHtml(func.nome) : 'Equipe GDF'}</div>
        </div>
      </div>`;
  }).join('') + '</div>' : '<p class="cell-muted">Nenhuma atualização registrada ainda.</p>';

  $('#modal-historico').classList.add('open');
}
