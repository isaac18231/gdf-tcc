# GDF — Gestão Digital Funcional

Protótipo de sistema web (HTML5 + CSS3 + JavaScript puro) para cadastro de
clientes e acompanhamento do andamento de serviços contratados.

## Como abrir

Basta abrir `index.html` no navegador. Não é necessário servidor nem
instalação de dependências.

## Páginas

- `index.html` — Home institucional
- `quem-somos.html` — Sobre a empresa
- `portfolio.html` — Projetos/cases
- `contato.html` — Fale conosco
- `login.html` / `cadastro.html` — Acesso e criação de conta
- `cliente.html` — Painel do cliente (somente leitura do andamento)
- `funcionario.html` — Painel do funcionário (atualiza o andamento)
- `admin.html` — Painel administrativo (gestão completa)

## Contas para teste

Os dados ficam salvos no `localStorage` do navegador e são criados
automaticamente na primeira vez que o site é aberto.

| Perfil       | E-mail                  | Senha            |
|--------------|--------------------------|------------------|
| Administrador| admin@gdf.com            | admin123         |
| Funcionário  | funcionario@gdf.com      | funcionario123   |
| Cliente      | cliente@gdf.com          | cliente123       |

> Aviso: como é um protótipo front-end, as senhas ficam salvas em texto
> simples no `localStorage`. Em um sistema real, isso deve ser substituído
> por um backend com banco de dados e autenticação segura (hash de senha,
> HTTPS, tokens, etc).

## Limpar os dados de teste

No console do navegador: `localStorage.clear()` e recarregue a página.
