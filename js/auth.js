/* ============================================================
   GDF — auth.js
   Camada de dados, autenticação e utilitários compartilhados.

   AVISO IMPORTANTE:
   Este protótipo usa localStorage apenas para fins de demonstração
   didática (TCC / portfólio). Em uma aplicação real, senhas NUNCA
   devem ser armazenadas em texto simples no navegador — o sistema
   precisaria de um backend, banco de dados e autenticação segura
   (hash de senha, tokens, HTTPS, etc).
   ============================================================ */

const GDF_KEYS = {
  users: 'gdf_users',
  servicos: 'gdf_servicos',
  seeded: 'gdf_seeded',
  session: 'gdf_session'
};

const STATUS_LABELS = {
  aguardando: 'Aguardando',
  recebido: 'Recebido',
  em_analise: 'Em análise',
  em_desenvolvimento: 'Em desenvolvimento',
  em_revisao: 'Em revisão',
  concluido: 'Concluído',
  cancelado: 'Cancelado'
};

// ordem usada na barra de progresso (cancelado não entra na barra)
const STATUS_PROGRESSO = ['recebido', 'em_analise', 'em_desenvolvimento', 'em_revisao', 'concluido'];

/* ---------------------- helpers genéricos ---------------------- */

function $(sel, ctx) { return (ctx || document).querySelector(sel); }
function $all(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

function gerarId(prefixo) {
  return prefixo + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatarData(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

/* ---------------------- toasts ---------------------- */

function garantirToastWrap() {
  let wrap = $('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  return wrap;
}

function mostrarToast(mensagem, tipo) {
  const wrap = garantirToastWrap();
  const toast = document.createElement('div');
  toast.className = 'toast ' + (tipo || 'info');
  const icones = { success: '✓', error: '⚠', info: 'ℹ' };
  toast.innerHTML = '<span>' + (icones[tipo] || icones.info) + '</span><span>' + escapeHtml(mensagem) + '</span>';
  wrap.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(6px)';
    toast.style.transition = '.2s';
    setTimeout(() => toast.remove(), 220);
  }, 3600);
}

/* ---------------------- acesso a dados ---------------------- */

function getUsers() {
  return JSON.parse(localStorage.getItem(GDF_KEYS.users) || '[]');
}
function saveUsers(users) {
  localStorage.setItem(GDF_KEYS.users, JSON.stringify(users));
}
function getServicos() {
  return JSON.parse(localStorage.getItem(GDF_KEYS.servicos) || '[]');
}
function saveServicos(servicos) {
  localStorage.setItem(GDF_KEYS.servicos, JSON.stringify(servicos));
}

/* ---------------------- seed de demonstração ---------------------- */

function seedDadosDemo() {
  if (localStorage.getItem(GDF_KEYS.seeded)) return;

  const admin = {
    id: gerarId('usr'), nome: 'Administrador GDF', email: 'admin@gdf.com',
    telefone: '(21) 90000-0000', documento: '000.000.000-00',
    senha: 'admin123', tipo: 'admin', ativo: true
  };
  const funcionario = {
    id: gerarId('usr'), nome: 'João Mendes', email: 'funcionario@gdf.com',
    telefone: '(21) 91111-1111', documento: '111.111.111-11',
    senha: 'funcionario123', tipo: 'funcionario', ativo: true
  };
  const cliente = {
    id: gerarId('usr'), nome: 'Maria Fernandes', email: 'cliente@gdf.com',
    telefone: '(21) 92222-2222', documento: '222.222.222-22',
    senha: 'cliente123', tipo: 'cliente', ativo: true
  };

  const users = [admin, funcionario, cliente];
  saveUsers(users);

  const agora = new Date();
  const diasAtras = (n) => new Date(agora.getTime() - n * 86400000).toISOString();

  const servico1 = {
    id: gerarId('srv'),
    clienteId: cliente.id,
    funcionarioId: funcionario.id,
    nome: 'Criação de site institucional',
    descricao: 'Desenvolvimento do novo site institucional da empresa, com identidade visual personalizada.',
    status: 'em_desenvolvimento',
    dataCriacao: diasAtras(12),
    ultimaAtualizacao: diasAtras(1),
    historico: [
      { id: gerarId('hist'), status: 'recebido', descricao: 'Solicitação recebida pela equipe GDF.', funcionarioId: funcionario.id, data: diasAtras(12) },
      { id: gerarId('hist'), status: 'em_analise', descricao: 'Levantamento de requisitos com o cliente.', funcionarioId: funcionario.id, data: diasAtras(9) },
      { id: gerarId('hist'), status: 'em_desenvolvimento', descricao: 'A equipe iniciou o desenvolvimento da solução.', funcionarioId: funcionario.id, data: diasAtras(1) }
    ]
  };

  const servico2 = {
    id: gerarId('srv'),
    clienteId: cliente.id,
    funcionarioId: funcionario.id,
    nome: 'Consultoria de identidade digital',
    descricao: 'Diagnóstico e recomendações de presença digital para a marca do cliente.',
    status: 'em_revisao',
    dataCriacao: diasAtras(20),
    ultimaAtualizacao: diasAtras(2),
    historico: [
      { id: gerarId('hist'), status: 'recebido', descricao: 'Solicitação recebida pela equipe GDF.', funcionarioId: funcionario.id, data: diasAtras(20) },
      { id: gerarId('hist'), status: 'em_analise', descricao: 'Análise do cenário atual da marca.', funcionarioId: funcionario.id, data: diasAtras(15) },
      { id: gerarId('hist'), status: 'em_desenvolvimento', descricao: 'Elaboração do relatório de recomendações.', funcionarioId: funcionario.id, data: diasAtras(6) },
      { id: gerarId('hist'), status: 'em_revisao', descricao: 'Relatório em revisão final antes da entrega.', funcionarioId: funcionario.id, data: diasAtras(2) }
    ]
  };

  saveServicos([servico1, servico2]);
  localStorage.setItem(GDF_KEYS.seeded, '1');
}

/* ---------------------- sessão ---------------------- */

function getSessao() {
  return JSON.parse(sessionStorage.getItem(GDF_KEYS.session) || 'null');
}
function setSessao(usuario) {
  sessionStorage.setItem(GDF_KEYS.session, JSON.stringify({
    id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo
  }));
}
function logout() {
  sessionStorage.removeItem(GDF_KEYS.session);
  window.location.href = 'login.html';
}

const REDIRECT_POR_TIPO = {
  cliente: 'cliente.html',
  funcionario: 'funcionario.html',
  admin: 'admin.html'
};

/**
 * Protege uma página: exige sessão válida e, opcionalmente,
 * um conjunto de papéis permitidos. Se o usuário não tiver
 * permissão, ele é redirecionado para sua própria área.
 */
function protegerPagina(papeisPermitidos) {
  const sessao = getSessao();
  if (!sessao) {
    window.location.href = 'login.html';
    return null;
  }
  const usuarios = getUsers();
  const usuarioAtual = usuarios.find(u => u.id === sessao.id);
  if (!usuarioAtual || !usuarioAtual.ativo) {
    logout();
    return null;
  }
  if (papeisPermitidos && !papeisPermitidos.includes(sessao.tipo)) {
    window.location.href = REDIRECT_POR_TIPO[sessao.tipo] || 'login.html';
    return null;
  }
  return usuarioAtual;
}

/* ---------------------- autenticação ---------------------- */

function login(email, senha) {
  const usuarios = getUsers();
  const usuario = usuarios.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!usuario) return { sucesso: false, mensagem: 'E-mail ou senha incorretos.' };
  if (!usuario.ativo) return { sucesso: false, mensagem: 'Esta conta está desativada. Fale com a administração.' };
  if (usuario.senha !== senha) return { sucesso: false, mensagem: 'E-mail ou senha incorretos.' };
  setSessao(usuario);
  return { sucesso: true, usuario };
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function cadastrarCliente(dados) {
  const usuarios = getUsers();

  if (!dados.nome || dados.nome.trim().length < 3) {
    return { sucesso: false, campo: 'nome', mensagem: 'Informe seu nome completo.' };
  }
  if (!validarEmail(dados.email)) {
    return { sucesso: false, campo: 'email', mensagem: 'Informe um e-mail válido.' };
  }
  if (usuarios.some(u => u.email.toLowerCase() === dados.email.toLowerCase())) {
    return { sucesso: false, campo: 'email', mensagem: 'Este e-mail já está cadastrado.' };
  }
  if (!dados.telefone || dados.telefone.trim().length < 8) {
    return { sucesso: false, campo: 'telefone', mensagem: 'Informe um telefone válido.' };
  }
  if (!dados.documento || dados.documento.trim().length < 5) {
    return { sucesso: false, campo: 'documento', mensagem: 'Informe um CPF/documento válido.' };
  }
  if (!dados.senha || dados.senha.length < 6) {
    return { sucesso: false, campo: 'senha', mensagem: 'A senha deve ter pelo menos 6 caracteres.' };
  }
  if (dados.senha !== dados.confirmarSenha) {
    return { sucesso: false, campo: 'confirmarSenha', mensagem: 'As senhas não coincidem.' };
  }

  const novoUsuario = {
    id: gerarId('usr'),
    nome: dados.nome.trim(),
    email: dados.email.trim(),
    telefone: dados.telefone.trim(),
    documento: dados.documento.trim(),
    senha: dados.senha,
    tipo: 'cliente',
    ativo: true
  };
  usuarios.push(novoUsuario);
  saveUsers(usuarios);
  return { sucesso: true, usuario: novoUsuario };
}

/* ---------------------- inicialização ---------------------- */

seedDadosDemo();
