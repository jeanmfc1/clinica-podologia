# Clínica de Podologia — App de gestão (PWA)

App de gestão para clínica de podologia, pensado para uso **no celular** como **PWA**
(instalável na tela inicial, funciona offline para leitura básica).

> Inspirado no "Clínica Experts", porém enxuto para uma profissional manter sozinha.

## Stack

- **React + Vite + TypeScript + Tailwind CSS** (mobile-first)
- **PWA** com `vite-plugin-pwa` (manifest + service worker)
- **Supabase** (Postgres + Auth + Storage) — backend gerenciado
- **TanStack Query** + **React Router**
- Deploy na **Vercel**

## Como rodar localmente

Pré-requisito: **Node.js LTS** instalado.

```bash
npm install
npm run dev
```

Abra o endereço que o terminal mostrar (ex.: `http://localhost:5173`).

Outros comandos:

```bash
npm run build     # gera a versão de produção em dist/
npm run preview   # serve a versão de produção localmente
npm run lint      # checagem de código
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha com os dados do seu projeto Supabase
(painel do Supabase → Settings → API):

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA-CHAVE-ANON
```

O arquivo `.env` **não é versionado** (está no `.gitignore`). Sem ele, o app roda
mas o login fica desativado (mostra um aviso).

> Para o deploy na Vercel, as mesmas variáveis devem ser cadastradas em
> Project Settings → Environment Variables.

## Instalar no celular (PWA)

1. Abra a URL do app no navegador do celular (Chrome no Android, Safari no iPhone).
2. **Android/Chrome:** menu (⋮) → "Instalar app" / "Adicionar à tela inicial".
3. **iPhone/Safari:** botão Compartilhar → "Adicionar à Tela de Início".

## LGPD, segurança e acessibilidade

Este app guarda **dados de saúde** (prontuário, fotos clínicas), tratados como
dados sensíveis.

**Já implementado:**

- Autenticação obrigatória (Supabase Auth) para acessar qualquer dado.
- Dados trafegam por HTTPS (Supabase e Vercel).
- `.env` fora do versionamento; nenhum segredo no código.
- Acessibilidade: fonte de alta legibilidade (Atkinson Hyperlegible), sem itálico
  na interface, alto contraste, foco visível por teclado, respeito a
  `prefers-reduced-motion`, alvos de toque ≥ 44px.

**Ainda falta (próximas fases):**

- **RLS (Row Level Security)** em todas as tabelas e buckets do Supabase — para
  cada clínica/usuário só enxergar seus próprios dados. _Requisito antes de
  colocar dados reais de pacientes._
- Registro de consentimento do paciente para fotos e termos.
- Política de retenção/exclusão de dados e exportação a pedido do titular.

> **Assinatura por toque ≠ assinatura ICP-Brasil.** O aceite de termos por toque na
> tela (a ser implementado) registra data/hora e identidade no nosso sistema, mas
> **não** tem a mesma validade jurídica de um certificado digital ICP-Brasil. Isso
> será documentado para o paciente e não prometemos validade que não temos.

## Caminho futuro (não implementado)

- **App nativo:** empacotar com **Capacitor** reaproveitando este mesmo código para
  publicar nas lojas (Android/iOS), caso desejado.
- **WhatsApp oficial:** automação via **WhatsApp Cloud API** (Meta). Por ora, os
  lembretes usarão links `wa.me` (envio com um toque), sem bibliotecas não oficiais.
- **Assistente com IA (Claude):** resumir histórico, organizar evolução e rascunhar
  mensagens — com a chave da API **somente no backend** (Supabase Edge Function).

## Status do projeto

- [x] **Fase 0 — Esqueleto:** projeto rodando, PWA instalável, login (UI), navegação
      por abas. _(Falta conectar Supabase e publicar na Vercel.)_
- [ ] **Fase 1 — MVP:** Pacientes, Procedimentos, Agenda, Prontuário (anamnese, mapa
      podológico, fotos).
- [ ] **Fase 2:** Orçamentos, Financeiro, Estoque, Termos, lembrete por WhatsApp.
- [ ] **Fase 3:** Dashboard/relatórios, Assistente com IA, WhatsApp Cloud API.
