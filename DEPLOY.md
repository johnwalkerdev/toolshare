# ToolShare - Guia de Deploy na Vercel (100% GRATUITO)

## 🆓 Deploy Gratuito em 5 Minutos

### 1. PostgreSQL Gratuito - Neon (Recomendado)
1. **Acesse**: [neon.tech](https://neon.tech)
2. **Cadastre-se** com GitHub (mais rápido)
3. **Crie projeto**: "toolshare-db"
4. **Copie a DATABASE_URL** que aparece automaticamente

### 2. Deploy Automático no Vercel
1. **Acesse**: [vercel.com](https://vercel.com) 
2. **Login** com GitHub
3. **Import Project** → selecione este repositório
4. **Configure Environment Variables**:

```bash
# Cole estas variáveis NO VERCEL durante o import:

DATABASE_URL=sua_connection_string_do_neon_aqui

JWT_SECRET=toolshare_jwt_2024_super_secret_key_minimum_32_chars

CORS_ORIGIN=https://toolshare.vercel.app

NEXT_PUBLIC_API_URL=https://toolshare.vercel.app/api

NEXT_PUBLIC_APP_URL=https://toolshare.vercel.app
```

5. **Deploy!** 🚀

### 3. Configuração Automática Pós-Deploy

Após o primeiro deploy, execute APENAS 1 comando:

```bash
npm run setup
```

**Pronto!** ✨ O script automaticamente:
- Gera o cliente Prisma
- Cria todas as tabelas
- Popula com dados iniciais
- Cria usuários admin e teste

## 🎯 Bancos PostgreSQL 100% Gratuitos

### 🥇 Neon (Melhor opção)
- ✅ **3GB gratuito para sempre**
- ✅ Conexão direta via URL
- ✅ Interface web incluída
- ✅ Backup automático
- 🔗 [neon.tech](https://neon.tech)

### 🥈 Supabase 
- ✅ **500MB gratuito + 2GB de bandwidth**
- ✅ Dashboard admin incluído
- ✅ Auth automático (opcional)
- 🔗 [supabase.com](https://supabase.com)

### 🥉 Railway
- ✅ **1GB gratuito**
- ✅ $5 de crédito mensal grátis
- ✅ Deploy automático
- 🔗 [railway.app](https://railway.app)

## ⚡ Setup Ultra-Rápido (Neon + Vercel)

### Passo 1: Neon (2 minutos)
1. [neon.tech](https://neon.tech) → Sign up with GitHub
2. Create project: "toolshare"
3. Copiar connection string (postgresql://...)

### Passo 2: Vercel (2 minutos)  
1. [vercel.com](https://vercel.com) → Import from GitHub
2. Selecionar repositório "ToolShare"
3. Colar variáveis de ambiente (veja modelo acima)
4. Deploy!

### Passo 3: Inicializar DB (1 minuto)
```bash
npm run setup
```

**Total: 5 minutos** ⏱️

## 🔧 Variáveis de Ambiente - Template Completo

```env
# 📄 COLE ISTO NO VERCEL (substitua apenas a DATABASE_URL):

DATABASE_URL=postgresql://usuario:senha@host.neon.tech/toolshare?sslmode=require

JWT_SECRET=toolshare_production_secret_key_2024_very_secure_minimum_32_chars

CORS_ORIGIN=https://toolshare.vercel.app

NEXT_PUBLIC_API_URL=https://toolshare.vercel.app/api  

NEXT_PUBLIC_APP_URL=https://toolshare.vercel.app

NODE_ENV=production
```

**💡 Dica**: No Vercel, as variáveis `NEXT_PUBLIC_*` são configuradas automaticamente para o frontend!

### 6. Executar Migrations e Seed

Após o deploy, execute os comandos no terminal local:

```bash
# Gerar o cliente Prisma
npx prisma generate

# Executar migrations
npx prisma migrate deploy

# Popular o banco com dados iniciais
npx prisma db seed
```

### 7. Configurações Adicionais

#### JWT Secret
Gere um secret seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### CORS Origin
Use o domínio da sua aplicação Vercel:
```
https://toolshare-123456.vercel.app
```

## 📋 Checklist de Deploy

- [ ] Repositório no GitHub criado
- [ ] Projeto conectado ao Vercel
- [ ] Banco PostgreSQL configurado
- [ ] Variáveis de ambiente definidas
- [ ] Migrations executadas
- [ ] Seed executado
- [ ] Deploy realizado com sucesso
- [ ] Testes de login funcionando

## 🔧 Comandos Úteis

```bash
# Ver logs do Vercel
vercel logs

# Deploy manual
vercel deploy

# Ver status das functions
vercel inspect <deployment-url>

# Executar Prisma Studio (local)
npx prisma studio
```

## 👥 Usuários Padrão (após seed)

**Admin:**
- Email: admin@toolshare.com  
- Senha: admin123

**Usuário Teste:**
- Email: test@toolshare.com
- Senha: test123

## 🆘 Troubleshooting

### Erro: "Database connection failed"
- Verifique se a `DATABASE_URL` está correta
- Confirme se o banco permite conexões externas
- Teste a conexão localmente primeiro

### Erro: "JWT malformed"
- Verifique se `JWT_SECRET` tem pelo menos 32 caracteres
- Confirme se não há espaços extras na variável

### Erro: "CORS blocked"
- Verifique se `CORS_ORIGIN` está correto
- Use HTTPS na URL de produção
- Confirme se não há trailing slash

### Build failing
- Execute `npm install` localmente
- Verifique se todas as dependências estão no package.json
- Confirme se não há erros de TypeScript

## 📞 Suporte

Se encontrar problemas durante o deploy, verifique:
1. Logs do Vercel
2. Configurações das variáveis de ambiente  
3. Status do banco de dados
4. Configuração do CORS

---

🎉 **Parabéns!** Seu ToolShare está rodando em produção!