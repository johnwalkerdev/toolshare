# 🔄 ToolShare - Plataforma SaaS de Compartilhamento de Ferramentas

> Democratizando o acesso a ferramentas premium através de compartilhamento inteligente com IP fixo

## 🚀 Visão Geral

ToolShare é uma plataforma SaaS que permite que usuários e equipes acessem ferramentas premium (Canva, Figma, Adobe Creative Suite, etc.) de forma compartilhada e segura, utilizando sistema de proxy com IP fixo e controle total sobre sessões simultâneas.

## ✨ Funcionalidades Principais

- 🔐 **Autenticação Segura** - JWT com 2FA opcional
- 🌐 **Sistema de Proxy Inteligente** - Hierarquia de resolução automática
- 👥 **Gestão de Equipes** - Compartilhamento colaborativo
- 📊 **Dashboard Analytics** - Métricas de uso em tempo real
- 💳 **Múltiplos Planos** - Starter, Team, Business, Enterprise
- 🛡️ **Segurança Enterprise** - Compliance LGPD, GDPR, SOC 2
- 🔄 **Failover Automático** - Alta disponibilidade garantida

## 🏗️ Arquitetura

```
Frontend (Next.js) → API (Node.js/Express) → Database (PostgreSQL)
                                          → Cache (Redis)
                                          → Proxy Manager
```

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 20+ 
- Docker & Docker Compose
- PostgreSQL 16+
- Redis 7+

### 1. Clone o repositório
```bash
git clone https://github.com/toolshare/toolshare.git
cd toolshare
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 3. Inicie os serviços com Docker
```bash
# Subir todos os serviços
npm run docker:up

# Ou rodar localmente
npm install
npm run dev
```

### 4. Configure o banco de dados
```bash
# Executar migrações
npm run db:migrate

# Popular dados iniciais
npm run db:seed
```

### 5. Acesse a aplicação
- **Frontend:** http://localhost:3000
- **API:** http://localhost:4000
- **Adminer (DB):** http://localhost:8080

## 📁 Estrutura do Projeto

```
toolshare/
├── frontend/          # Next.js application
│   ├── components/    # React components
│   ├── pages/        # Next.js pages
│   ├── styles/       # Tailwind CSS
│   └── utils/        # Utilities
├── backend/          # Node.js API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Express middleware
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utilities
│   ├── prisma/         # Database schema
│   └── tests/          # Unit tests
├── database/         # SQL scripts
├── docker/          # Docker configurations
└── docs/           # Documentation
```

## 🛠️ Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia frontend + backend
npm run dev:frontend     # Apenas frontend
npm run dev:backend      # Apenas backend

# Build
npm run build           # Build completo
npm run build:frontend  # Build frontend
npm run build:backend   # Build backend

# Banco de dados
npm run db:migrate      # Executar migrações
npm run db:seed         # Popular dados
npm run db:reset        # Reset completo

# Testes
npm run test           # Todos os testes
npm run test:unit      # Testes unitários
npm run test:e2e       # Testes E2E

# Docker
npm run docker:up      # Subir serviços
npm run docker:down    # Parar serviços
npm run docker:logs    # Ver logs
```

### Stack Tecnológico

#### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Componentes UI
- **React Query** - Estado do servidor
- **Zustand** - Estado global

#### Backend
- **Node.js 20** - Runtime
- **Express.js** - Framework web
- **TypeScript** - Tipagem estática
- **Prisma** - ORM
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas

#### Database & Cache
- **PostgreSQL 16** - Database principal
- **Redis 7** - Cache e sessões
- **PgBouncer** - Connection pooling

#### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração local
- **GitHub Actions** - CI/CD
- **Prometheus** - Métricas
- **Grafana** - Dashboards

## 📊 Planos de Assinatura

| Plano | Preço | Usuários | Sessões | Ferramentas |
|-------|--------|----------|---------|-------------|
| **Starter** | $19/mês | 1 | 1 | 3 |
| **Team** | $49/mês | 5 | 3 | 10 |
| **Business** | $149/mês | 15 | 8 | Ilimitado |
| **Enterprise** | Custom | Custom | Custom | Custom |

## 🔐 Segurança

- **Criptografia AES-256** para dados sensíveis
- **Rate limiting** por usuário e endpoint
- **CORS** configurado adequadamente
- **Headers de segurança** implementados
- **Logs auditáveis** para compliance
- **2FA opcional** para contas admin

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Convenções

- **Commits:** Use [Conventional Commits](https://conventionalcommits.org/)
- **Code Style:** Prettier + ESLint configurados
- **Testes:** Cobertura mínima de 80%
- **Documentation:** Documente APIs com JSDoc

## 📈 Roadmap

### Fase 1 - MVP (Meses 1-3)
- ✅ Infraestrutura básica
- ✅ Autenticação JWT
- ✅ Dashboard cliente básico
- ✅ Sistema de proxy simples
- 🔄 Integração com 3-5 ferramentas
- ⏳ Plano de pagamento único

### Fase 2 - Produto Completo (Meses 4-6)
- ⏳ Painel administrativo
- ⏳ Sistema de equipes
- ⏳ Múltiplos planos
- ⏳ 15-20 ferramentas
- ⏳ Sistema de logs avançado
- ⏳ API pública

### Fase 3 - Escalabilidade (Meses 7-9)
- ⏳ Proxy inteligente com failover
- ⏳ Navegador remoto (Guacamole)
- ⏳ White-label solution
- ⏳ Mobile app
- ⏳ 50+ ferramentas

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- 📧 Email: support@toolshare.com
- 💬 Discord: [ToolShare Community](https://discord.gg/toolshare)
- 📚 Docs: [docs.toolshare.com](https://docs.toolshare.com)
- 🐛 Issues: [GitHub Issues](https://github.com/toolshare/toolshare/issues)

---

**ToolShare** - *Compartilhe acesso, mantenha o controle.*