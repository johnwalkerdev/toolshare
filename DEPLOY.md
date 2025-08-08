# ToolShare - Guia de Deploy na Vercel

## 🚀 Passos para Deploy

### 1. Pré-requisitos
- Conta no Vercel
- Conta no GitHub
- Banco PostgreSQL (recomendado: Neon, Supabase ou PlanetScale)

### 2. Preparar o Repositório
```bash
git init
git add .
git commit -m "Initial commit - ToolShare SaaS Platform"
git branch -M main
git remote add origin <SEU_REPOSITORIO_GITHUB>
git push -u origin main
```

### 3. Conectar ao Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "New Project"
3. Importe seu repositório do GitHub
4. Configure as variáveis de ambiente (veja abaixo)
5. Clique em "Deploy"

### 4. Configurar Variáveis de Ambiente no Vercel

#### Para o Backend:
```
DATABASE_URL=postgresql://usuario:senha@host:porta/database?sslmode=require
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_32_chars_min
CORS_ORIGIN=https://seu-dominio.vercel.app
```

#### Para o Frontend:
```
NEXT_PUBLIC_API_URL=https://seu-dominio.vercel.app/api
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
```

### 5. Configurar o Banco de Dados

#### Opção A: Neon (Recomendado)
1. Acesse [neon.tech](https://neon.tech) e crie uma conta
2. Crie um novo projeto PostgreSQL
3. Copie a connection string
4. Cole em `DATABASE_URL` no Vercel

#### Opção B: Supabase
1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em Settings > Database
3. Copie a connection string (mode: Session)
4. Cole em `DATABASE_URL` no Vercel

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