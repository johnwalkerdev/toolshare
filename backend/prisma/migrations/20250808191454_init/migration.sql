-- CreateTable
CREATE TABLE "plans" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "precoMensal" REAL,
    "precoAnual" REAL,
    "limiteUsuarios" INTEGER,
    "limiteSessoes" INTEGER,
    "limiteFerramentas" INTEGER,
    "recursos" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uuid" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "planId" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "expiresAt" DATETIME,
    "ultimoLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teams" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "planId" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "limiteUsuarios" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "teams_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "teams_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "team_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "team_users_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tool_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "icone" TEXT,
    "cor" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "tools" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "urlAcesso" TEXT NOT NULL,
    "descricao" TEXT,
    "icone" TEXT,
    "categoriaId" INTEGER,
    "proxyId" INTEGER,
    "limiteUsuarios" INTEGER NOT NULL DEFAULT 1,
    "timeoutSessao" INTEGER NOT NULL DEFAULT 3600,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "planosPermitidos" TEXT NOT NULL DEFAULT '',
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tools_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "tool_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tools_proxyId_fkey" FOREIGN KEY ("proxyId") REFERENCES "proxies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tool_accounts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "toolId" INTEGER NOT NULL,
    "nome" TEXT,
    "email" TEXT,
    "senhaEncriptada" TEXT,
    "apiToken" TEXT,
    "metadata" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoUso" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tool_accounts_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "proxies" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "porta" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'http',
    "authUser" TEXT,
    "authPass" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "regiao" TEXT,
    "latenciaMedia" INTEGER,
    "uptimePercentage" REAL,
    "ultimaVerificacao" DATETIME,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "team_tool_proxies" (
    "teamId" INTEGER NOT NULL,
    "toolId" INTEGER NOT NULL,
    "proxyId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("teamId", "toolId"),
    CONSTRAINT "team_tool_proxies_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_tool_proxies_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_tool_proxies_proxyId_fkey" FOREIGN KEY ("proxyId") REFERENCES "proxies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_tool_proxies" (
    "userId" TEXT NOT NULL,
    "toolId" INTEGER NOT NULL,
    "proxyId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "toolId"),
    CONSTRAINT "user_tool_proxies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_tool_proxies_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_tool_proxies_proxyId_fkey" FOREIGN KEY ("proxyId") REFERENCES "proxies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "teamId" INTEGER,
    "toolId" INTEGER,
    "proxyId" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "status" TEXT,
    "durationSeconds" INTEGER,
    "bytesTransferred" INTEGER,
    "metadata" TEXT,
    CONSTRAINT "access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "access_logs_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "access_logs_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "access_logs_proxyId_fkey" FOREIGN KEY ("proxyId") REFERENCES "proxies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "teams_uuid_key" ON "teams"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "teams_slug_key" ON "teams"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "team_users_teamId_userId_key" ON "team_users"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "tool_categories_slug_key" ON "tool_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tools_slug_key" ON "tools"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "proxies_host_porta_key" ON "proxies"("host", "porta");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_key" ON "user_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refreshToken_key" ON "user_sessions"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");
