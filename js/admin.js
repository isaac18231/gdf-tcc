/* ============================================================
   GDF — admin.js
   Painel do administrador: visão geral + gestão completa de
   clientes, funcionários e serviços.
   ============================================================ */

let usuarioAtual = null;
let funcionarioEmEdicaoId = null;
let servicoEmEdicaoId = null;
let acaoConfirmar = null;

document.addEventListener('DOMContentLoaded', () => {
  usuarioAtual = protegerPagina(['admin']);
  if (!usuarioAtual) return;

  $('#side-avatar').textContent = usuarioAtual.nome.trim().charAt(0).toUpperCase();
  $('#side-nome').textContent = usuarioAtual.nome;

  configurarTabs();
  renderDashboard();
  renderClientes();
  renderFuncionarios();
  renderServicos();
  preencherSelects();

  $('#busca-cliente').addEventListener('input', renderClientes);
  $('#busca-funcionario').addEventListener('input', renderFuncionarios);
  $('#busca-servico').addEventListener('input', renderServicos);
  $('#filtro-status-servico').addEventListener('change', renderServicos);

  $('#btn-novo-funcionario').addEventListener('click', () => abrirModalFuncionario(null));
  $('#form-funcionario').addEventListener('submit', salvarFuncionario);
  $('#fechar-modal-funcionario').addEventListener('click', () => fecharModal('#modal-funcionario'));

  $('#btn-novo-servico').addEventListener('click', () => abrirModalServico(null));
  $('#form-servico').addEventListener('submit', salvarServico);
  $('#fechar-modal-servico').addEventListener('click', () => fecharModal('#modal-servico'));

  $('#fechar-modal-historico').addEventListener('click', () => fecharModal('#modal-historico'));

  $('#fechar-modal-confirmar').addEventListener('click', () => fecharModal('#modal-confirmar'));
  $('#btn-cancelar-confirmar').addEventListener('click', () => fecharModal('#modal-confirmar'));
  $('#btn-confirmar-acao').addEventListener('click', () => {
    if (typeof acaoConfirmar === 'function') acaoConfirmar();
    fecharModal('#modal-confirmar');
  });

  $all('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
  });

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

function fecharModal(sel) { $(sel).classList.remove('open'); }

function configurarTabs() {
  $all('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $all('.tab-btn').forEach(b => b.classList.remove('active'));
      $all('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $('#' + btn.dataset.tab).classList.add('active');
    });
  });
}

/* ---------------------- dashboard ---------------------- */

function renderDashboard() {
  const usuarios = getUsers();
  const servicos = getServicos();

  const clientes = usuarios.filter(u => u.tipo === 'cliente');
  const funcionarios = usuarios.filter(u => u.tipo === 'funcionario');

  $('#stat-total-clientes').textContent = clientes.length;
  $('#stat-total-funcionarios').textContent = funcionarios.length;
  $('#stat-total-servicos').textContent = servicos.length;
  $('#stat-em-andamento').textContent = servicos.filter(s => ['recebido', 'em_analise', 'em_desenvolvimento', 'em_revisao'].includes(s.status)).length;
  $('#stat-concluidos').textContent = servicos.filter(s => s.status === 'concluido').length;
  $('#stat-aguardando').textContent = servicos.filter(s => s.status === 'aguardando').length;
}

/* ---------------------- clientes ---------------------- */

function renderClientes() {
  const corpo = $('#tabela-clientes-body');
  const termo = $('#busca-cliente').value.toLowerCase().trim();
  const servicos = getServicos();

  let clientes = getUsers().filter(u => u.tipo === 'cliente');
  if (termo) clientes = clientes.filter(c => c.nome.toLowerCase().includes(termo) || c.email.toLowerCase().includes(termo));

  if (clientes.length === 0) {
    corpo.innerHTML = `<tr><td colspan="5"><div class="empty-state"><h4>Nenhum cliente encontrado</h4></div></td></tr>`;
    return;
  }

  corpo.innerHTML = clientes.map(c => {
    const qtdServicos = servicos.filter(s => s.clienteId === c.id).length;
    return `
      <tr>
        <td class="cell-strong">${escapeHtml(c.nome)}</td>
        <td class="cell-muted">${escapeHtml(c.email)}<br><span class="cell-muted">${escapeHtml(c.telefone)}</span></td>
        <td>${qtdServicos} serviço(s)</td>
        <td>
          <label class="switch">
            <input type="checkbox" data-toggle-cliente="${c.id}" ${c.ativo ? 'checked' : ''}>
            <span class="track"></span> ${c.ativo ? 'Ativo' : 'Inativo'}
          </label>
        </td>
        <td>
          <div class="row-actions">
            <button class="btn btn-outline btn-sm" data-ver-servicos-cliente="${c.id}">Ver serviços</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  $all('[data-toggle-cliente]').forEach(input => {
    input.addEventListener('change', () => alternarAtivo(input.getAttribute('data-toggle-cliente'), 'cliente'));
  });
  $all('[data-ver-servicos-cliente]').forEach(btn => {
    btn.addEventListener('click', () => {
      $all('.tab-btn').forEach(b => b.classList.remove('active'));
      $all('.tab-panel').forEach(p => p.classList.remove('active'));
      $('.tab-btn[data-tab="tab-servicos"]').classList.add('active');
      $('#tab-servicos').classList.add('active');
      $('#busca-servico').value = getUsers().find(u => u.id === btn.getAttribute('data-ver-servicos-cliente')).nome;
      renderServicos();
    });
  });
}

function alternarAtivo(userId, tipoLabel) {
  const usuarios = getUsers();
  const idx = usuarios.findIndex(u => u.id === userId);
  if (idx === -1) return;
  usuarios[idx].ativo = !usuarios[idx].ativo;
  saveUsers(usuarios);
  mostrarToast(`${tipoLabel === 'cliente' ? 'Cliente' : 'Funcionário'} ${usuarios[idx].ativo ? 'ativado' : 'desativado'} com sucesso!`, 'success');
  renderClientes();
  renderFuncionarios();
  preencherSelects();
}

/* ---------------------- funcionários ---------------------- */

function renderFuncionarios() {
  const corpo = $('#tabela-funcionarios-body');
  const termo = $('#busca-funcionario').value.toLowerCase().trim();
  const servicos = getServicos();

  let funcionarios = getUsers().filter(u => u.tipo === 'funcionario');
  if (termo) funcionarios = funcionarios.filter(f => f.nome.toLowerCase().includes(termo) || f.email.toLowerCase().includes(termo));

  if (funcionarios.length === 0) {
    corpo.innerHTML = `<tr><td colspan="5"><div class="empty-state"><h4>Nenhum funcionário encontrado</h4></div></td></tr>`;
    return;
  }

  corpo.innerHTML = funcionarios.map(f => {
    const qtd = servicos.filter(s => s.funcionarioId === f.id).length;
    return `
      <tr>
        <td class="cell-strong">${escapeHtml(f.nome)}</td>
        <td class="cell-muted">${escapeHtml(f.email)}<br><span class="cell-muted">${escapeHtml(f.telefone)}</span></td>
        <td>${qtd} serviço(s)</td>
        <td>
          <label class="switch">
            <input type="checkbox" data-toggle-funcionario="${f.id}" ${f.ativo ? 'checked' : ''}>
            <span class="track"></span> ${f.ativo ? 'Ativo' : 'Inativo'}
          </label>
        </td>
        <td>
          <div class="row-actions">
            <button class="btn btn-outline btn-sm" data-editar-funcionario="${f.id}">Editar</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  $all('[data-toggle-funcionario]').forEach(input => {
    input.addEventListener('change', () => alternarAtivo(input.getAttribute('data-toggle-funcionario'), 'funcionario'));
  });
  $all('[data-editar-funcionario]').forEach(btn => {
    btn.addEventListener('click', () => abrirModalFuncionario(btn.getAttribute('data-editar-funcionario')));
  });
}

function abrirModalFuncionario(funcionarioId) {
  funcionarioEmEdicaoId = funcionarioId;
  const form = $('#form-funcionario');
  form.reset();

  if (funcionarioId) {
    const f = getUsers().find(u => u.id === funcionarioId);
    $('#modal-funcionario-titulo').textContent = 'Editar funcionário';
    $('#input-func-nome').value = f.nome;
    $('#input-func-email').value = f.email;
    $('#input-func-telefone').value = f.telefone;
    $('#input-func-senha').placeholder = 'Deixe em branco para manter a atual';
    $('#input-func-senha').required = false;
  } else {
    $('#modal-funcionario-titulo').textContent = 'Novo funcionário';
    $('#input-func-senha').placeholder = 'Senha de acesso';
    $('#input-func-senha').required = true;
  }

  $('#modal-funcionario').classList.add('open');
}

function salvarFuncionario(e) {
  e.preventDefault();
  const nome = $('#input-func-nome').value.trim();
  const email = $('#input-func-email').value.trim();
  const telefone = $('#input-func-telefone').value.trim();
  const senha = $('#input-func-senha').value;

  if (nome.length < 3) return mostrarToast('Informe o nome completo do funcionário.', 'error');
  if (!validarEmail(email)) return mostrarToast('Informe um e-mail válido.', 'error');

  const usuarios = getUsers();

  if (funcionarioEmEdicaoId) {
    const idx = usuarios.findIndex(u => u.id === funcionarioEmEdicaoId);
    if (usuarios.some(u => u.id !== funcionarioEmEdicaoId && u.email.toLowerCase() === email.toLowerCase())) {
      return mostrarToast('Este e-mail já está em uso por outro usuário.', 'error');
    }
    usuarios[idx].nome = nome;
    usuarios[idx].email = email;
    usuarios[idx].telefone = telefone;
    if (senha) usuarios[idx].senha = senha;
    mostrarToast('Funcionário atualizado com sucesso!', 'success');
  } else {
    if (usuarios.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return mostrarToast('Este e-mail já está em uso por outro usuário.', 'error');
    }
    if (!senha || senha.length < 6) return mostrarToast('A senha deve ter pelo menos 6 caracteres.', 'error');
    usuarios.push({
      id: gerarId('usr'), nome, email, telefone, documento: '—',
      senha, tipo: 'funcionario', ativo: true
    });
    mostrarToast('Funcionário cadastrado com sucesso!', 'success');
  }

  saveUsers(usuarios);
  fecharModal('#modal-funcionario');
  renderFuncionarios();
  renderDashboard();
  preencherSelects();
}

/* ---------------------- serviços ---------------------- */

function preencherSelects() {
  const usuarios = getUsers();
  const clientes = usuarios.filter(u => u.tipo === 'cliente' && u.ativo);
  const funcionarios = usuarios.filter(u => u.tipo === 'funcionario' && u.ativo);

  $('#input-srv-cliente').innerHTML = clientes.map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join('') || '<option value="">Nenhum cliente ativo</option>';
  $('#input-srv-funcionario').innerHTML = funcionarios.map(f => `<option value="${f.id}">${escapeHtml(f.nome)}</option>`).join('') || '<option value="">Nenhum funcionário ativo</option>';
}

function renderServicos() {
  const corpo = $('#tabela-servicos-body');
  const termo = $('#busca-servico').value.toLowerCase().trim();
  const statusFiltro = $('#filtro-status-servico').value;
  const usuarios = getUsers();

  let servicos = getServicos().sort((a, b) => b.ultimaAtualizacao.localeCompare(a.ultimaAtualizacao)).map(s => ({
    ...s,
    _cliente: usuarios.find(u => u.id === s.clienteId),
    _funcionario: usuarios.find(u => u.id === s.funcionarioId)
  }));

  if (termo) {
    servicos = servicos.filter(s =>
      s.nome.toLowerCase().includes(termo) ||
      (s._cliente && s._cliente.nome.toLowerCase().includes(termo))
    );
  }
  if (statusFiltro) servicos = servicos.filter(s => s.status === statusFiltro);

  if (servicos.length === 0) {
    corpo.innerHTML = `<tr><td colspan="6"><div class="empty-state"><h4>Nenhum serviço encontrado</h4></div></td></tr>`;
    return;
  }

  corpo.innerHTML = servicos.map(s => `
    <tr>
      <td class="cell-strong">${escapeHtml(s.nome)}</td>
      <td>${s._cliente ? escapeHtml(s._cliente.nome) : '—'}</td>
      <td class="cell-muted">${s._funcionario ? escapeHtml(s._funcionario.nome) : '—'}</td>
      <td><span class="badge st-${s.status}">${STATUS_LABELS[s.status]}</span></td>
      <td class="cell-muted">${formatarData(s.ultimaAtualizacao)}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-outline btn-sm" data-ver-hist-adm="${s.id}">Histórico</button>
          <button class="btn btn-outline btn-sm" data-editar-servico="${s.id}">Editar</button>
          <button class="btn btn-danger btn-sm" data-excluir-servico="${s.id}">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');

  $all('[data-editar-servico]').forEach(btn => btn.addEventListener('click', () => abrirModalServico(btn.getAttribute('data-editar-servico'))));
  $all('[data-ver-hist-adm]').forEach(btn => btn.addEventListener('click', () => abrirHistoricoAdmin(btn.getAttribute('data-ver-hist-adm'))));
  $all('[data-excluir-servico]').forEach(btn => btn.addEventListener('click', () => confirmarExclusaoServico(btn.getAttribute('data-excluir-servico'))));
}

function abrirModalServico(servicoId) {
  servicoEmEdicaoId = servicoId;
  const form = $('#form-servico');
  form.reset();
  preencherSelects();

  if (servicoId) {
    const s = getServicos().find(x => x.id === servicoId);
    $('#modal-servico-titulo').textContent = 'Editar serviço';
    $('#input-srv-nome').value = s.nome;
    $('#input-srv-descricao').value = s.descricao;
    $('#input-srv-cliente').value = s.clienteId;
    $('#input-srv-funcionario').value = s.funcionarioId;
    $('#input-srv-status').value = s.status;
  } else {
    $('#modal-servico-titulo').textContent = 'Novo serviço';
    $('#input-srv-status').value = 'aguardando';
  }

  $('#modal-servico').classList.add('open');
}

function salvarServico(e) {
  e.preventDefault();
  const nome = $('#input-srv-nome').value.trim();
  const descricao = $('#input-srv-descricao').value.trim();
  const clienteId = $('#input-srv-cliente').value;
  const funcionarioId = $('#input-srv-funcionario').value;
  const status = $('#input-srv-status').value;

  if (nome.length < 3) return mostrarToast('Informe o nome do serviço.', 'error');
  if (!descricao) return mostrarToast('Informe uma descrição para o serviço.', 'error');
  if (!clienteId) return mostrarToast('Selecione um cliente.', 'error');
  if (!funcionarioId) return mostrarToast('Selecione um funcionário responsável.', 'error');

  const servicos = getServicos();
  const agora = new Date().toISOString();

  if (servicoEmEdicaoId) {
    const idx = servicos.findIndex(s => s.id === servicoEmEdicaoId);
    const statusMudou = servicos[idx].status !== status;
    servicos[idx].nome = nome;
    servicos[idx].descricao = descricao;
    servicos[idx].clienteId = clienteId;
    servicos[idx].funcionarioId = funcionarioId;
    servicos[idx].status = status;
    servicos[idx].ultimaAtualizacao = agora;
    if (statusMudou) {
      servicos[idx].historico.push({
        id: gerarId('hist'), status, descricao: 'Status atualizado pela administração.',
        funcionarioId: usuarioAtual.id, data: agora
      });
    }
    mostrarToast('Serviço atualizado com sucesso!', 'success');
  } else {
    servicos.push({
      id: gerarId('srv'), clienteId, funcionarioId, nome, descricao, status,
      dataCriacao: agora, ultimaAtualizacao: agora,
      historico: [{ id: gerarId('hist'), status, descricao: 'Serviço criado pela administração.', funcionarioId: usuarioAtual.id, data: agora }]
    });
    mostrarToast('Serviço cadastrado com sucesso!', 'success');
  }

  saveServicos(servicos);
  fecharModal('#modal-servico');
  renderServicos();
  renderDashboard();
}

function confirmarExclusaoServico(servicoId) {
  const servico = getServicos().find(s => s.id === servicoId);
  if (!servico) return;
  $('#confirmar-texto').innerHTML = `Tem certeza que deseja excluir o serviço <strong>${escapeHtml(servico.nome)}</strong>? Esta ação não pode ser desfeita.`;
  acaoConfirmar = () => {
    const servicos = getServicos().filter(s => s.id !== servicoId);
    saveServicos(servicos);
    renderServicos();
    renderDashboard();
    mostrarToast('Serviço excluído com sucesso!', 'success');
  };
  $('#modal-confirmar').classList.add('open');
}

function abrirHistoricoAdmin(servicoId) {
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
