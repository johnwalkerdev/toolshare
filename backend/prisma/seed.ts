import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create plans
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { slug: 'starter' },
      update: {},
      create: {
        nome: 'Starter',
        slug: 'starter',
        precoMensal: 19.00,
        precoAnual: 190.00,
        limiteUsuarios: 1,
        limiteSessoes: 1,
        limiteFerramentas: 3,
        recursos: {
          ipFixo: true,
          suporte: 'email',
          failover: false,
          api: false,
          whiteLabel: false,
          customProxy: false
        },
        ordem: 1
      }
    }),

    prisma.plan.upsert({
      where: { slug: 'team' },
      update: {},
      create: {
        nome: 'Team',
        slug: 'team',
        precoMensal: 49.00,
        precoAnual: 490.00,
        limiteUsuarios: 5,
        limiteSessoes: 3,
        limiteFerramentas: 10,
        recursos: {
          ipFixo: true,
          suporte: 'priority',
          failover: false,
          api: false,
          whiteLabel: false,
          customProxy: false,
          teamManagement: true,
          sharedDashboard: true
        },
        ordem: 2
      }
    }),

    prisma.plan.upsert({
      where: { slug: 'business' },
      update: {},
      create: {
        nome: 'Business',
        slug: 'business',
        precoMensal: 149.00,
        precoAnual: 1490.00,
        limiteUsuarios: 15,
        limiteSessoes: 8,
        limiteFerramentas: null, // unlimited
        recursos: {
          ipFixo: true,
          suporte: 'chat',
          failover: true,
          api: true,
          whiteLabel: true,
          customProxy: true,
          teamManagement: true,
          sharedDashboard: true,
          sso: true,
          webhooks: true
        },
        ordem: 3
      }
    }),

    prisma.plan.upsert({
      where: { slug: 'enterprise' },
      update: {},
      create: {
        nome: 'Enterprise',
        slug: 'enterprise',
        precoMensal: null, // custom pricing
        precoAnual: null,
        limiteUsuarios: null, // unlimited
        limiteSessoes: null, // unlimited
        limiteFerramentas: null, // unlimited
        recursos: {
          ipFixo: true,
          suporte: '24x7',
          failover: true,
          api: true,
          whiteLabel: true,
          customProxy: true,
          teamManagement: true,
          sharedDashboard: true,
          sso: true,
          webhooks: true,
          onPremise: true,
          dedicatedAccount: true,
          customIntegrations: true,
          advancedAnalytics: true
        },
        ordem: 4
      }
    })
  ]);

  console.log(`✅ Created ${plans.length} plans`);

  // Create tool categories
  const categories = await Promise.all([
    prisma.toolCategory.upsert({
      where: { slug: 'design' },
      update: {},
      create: {
        nome: 'Design',
        slug: 'design',
        descricao: 'Ferramentas de design gráfico e criação visual',
        icone: 'palette',
        cor: '#3B82F6',
        ordem: 1
      }
    }),

    prisma.toolCategory.upsert({
      where: { slug: 'ai' },
      update: {},
      create: {
        nome: 'Inteligência Artificial',
        slug: 'ai',
        descricao: 'Ferramentas de IA para produtividade e criação',
        icone: 'cpu',
        cor: '#8B5CF6',
        ordem: 2
      }
    }),

    prisma.toolCategory.upsert({
      where: { slug: 'marketing' },
      update: {},
      create: {
        nome: 'Marketing',
        slug: 'marketing',
        descricao: 'Ferramentas para marketing digital e social media',
        icone: 'megaphone',
        cor: '#EF4444',
        ordem: 3
      }
    }),

    prisma.toolCategory.upsert({
      where: { slug: 'productivity' },
      update: {},
      create: {
        nome: 'Produtividade',
        slug: 'productivity',
        descricao: 'Ferramentas para organização e gestão de projetos',
        icone: 'briefcase',
        cor: '#10B981',
        ordem: 4
      }
    }),

    prisma.toolCategory.upsert({
      where: { slug: 'development' },
      update: {},
      create: {
        nome: 'Desenvolvimento',
        slug: 'development',
        descricao: 'Ferramentas para desenvolvimento de software',
        icone: 'code',
        cor: '#F59E0B',
        ordem: 5
      }
    })
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create sample proxies
  const proxies = await Promise.all([
    prisma.proxy.create({
      data: {
        nome: 'US East Proxy 1',
        host: '138.68.14.108',
        porta: 8080,
        tipo: 'http',
        authUser: 'user1',
        authPass: 'encrypted_password_1',
        regiao: 'us-east',
        ativo: true,
        latenciaMedia: 45,
        uptimePercentage: 99.8
      }
    }),

    prisma.proxy.create({
      data: {
        nome: 'EU West Proxy 1',
        host: '165.22.203.45',
        porta: 3128,
        tipo: 'http',
        authUser: 'user2',
        authPass: 'encrypted_password_2',
        regiao: 'eu-west',
        ativo: true,
        latenciaMedia: 32,
        uptimePercentage: 99.9
      }
    }),

    prisma.proxy.create({
      data: {
        nome: 'Brazil South Proxy 1',
        host: '134.209.29.120',
        porta: 8888,
        tipo: 'http',
        authUser: 'user3',
        authPass: 'encrypted_password_3',
        regiao: 'sa-east',
        ativo: true,
        latenciaMedia: 28,
        uptimePercentage: 99.5
      }
    })
  ]);

  console.log(`✅ Created ${proxies.length} proxies`);

  // Create sample tools
  const tools = await Promise.all([
    prisma.tool.upsert({
      where: { slug: 'canva-pro' },
      update: {},
      create: {
        nome: 'Canva Pro',
        slug: 'canva-pro',
        urlAcesso: 'https://canva.com',
        descricao: 'Ferramenta de design gráfico online com templates premium',
        icone: '/icons/canva.svg',
        categoriaId: categories.find(c => c.slug === 'design')?.id,
        proxyId: proxies[0].id,
        limiteUsuarios: 3,
        timeoutSessao: 7200, // 2 hours
        planosPermitidos: [2, 3, 4], // Team, Business, Enterprise
        metadata: {
          requiresLogin: true,
          hasApi: false,
          supportsBrowser: true
        }
      }
    }),

    prisma.tool.upsert({
      where: { slug: 'chatgpt-plus' },
      update: {},
      create: {
        nome: 'ChatGPT Plus',
        slug: 'chatgpt-plus',
        urlAcesso: 'https://chat.openai.com',
        descricao: 'IA conversacional avançada com GPT-4',
        icone: '/icons/chatgpt.svg',
        categoriaId: categories.find(c => c.slug === 'ai')?.id,
        proxyId: proxies[1].id,
        limiteUsuarios: 2,
        timeoutSessao: 3600, // 1 hour
        planosPermitidos: [1, 2, 3, 4], // All plans
        metadata: {
          requiresLogin: true,
          hasApi: true,
          supportsBrowser: true
        }
      }
    }),

    prisma.tool.upsert({
      where: { slug: 'figma-pro' },
      update: {},
      create: {
        nome: 'Figma Professional',
        slug: 'figma-pro',
        urlAcesso: 'https://figma.com',
        descricao: 'Ferramenta colaborativa de design de interface',
        icone: '/icons/figma.svg',
        categoriaId: categories.find(c => c.slug === 'design')?.id,
        proxyId: proxies[0].id,
        limiteUsuarios: 5,
        timeoutSessao: 14400, // 4 hours
        planosPermitidos: [2, 3, 4], // Team, Business, Enterprise
        metadata: {
          requiresLogin: true,
          hasApi: true,
          supportsBrowser: true,
          collaborative: true
        }
      }
    }),

    prisma.tool.upsert({
      where: { slug: 'notion-pro' },
      update: {},
      create: {
        nome: 'Notion Pro',
        slug: 'notion-pro',
        urlAcesso: 'https://notion.so',
        descricao: 'Workspace tudo-em-um para notas, docs e colaboração',
        icone: '/icons/notion.svg',
        categoriaId: categories.find(c => c.slug === 'productivity')?.id,
        proxyId: proxies[2].id,
        limiteUsuarios: 10,
        timeoutSessao: 21600, // 6 hours
        planosPermitidos: [1, 2, 3, 4], // All plans
        metadata: {
          requiresLogin: true,
          hasApi: true,
          supportsBrowser: true,
          collaborative: true
        }
      }
    }),

    prisma.tool.upsert({
      where: { slug: 'midjourney' },
      update: {},
      create: {
        nome: 'Midjourney',
        slug: 'midjourney',
        urlAcesso: 'https://discord.gg/midjourney',
        descricao: 'IA para geração de imagens através do Discord',
        icone: '/icons/midjourney.svg',
        categoriaId: categories.find(c => c.slug === 'ai')?.id,
        proxyId: proxies[1].id,
        limiteUsuarios: 1,
        timeoutSessao: 1800, // 30 minutes
        planosPermitidos: [3, 4], // Business, Enterprise only
        metadata: {
          requiresLogin: true,
          hasApi: false,
          supportsBrowser: true,
          platform: 'discord'
        }
      }
    })
  ]);

  console.log(`✅ Created ${tools.length} tools`);

  // Create sample tool accounts
  await Promise.all([
    prisma.toolAccount.create({
      data: {
        toolId: tools.find(t => t.slug === 'canva-pro')?.id!,
        nome: 'Canva Account 1',
        email: 'canva1@toolshare.com',
        senhaEncriptada: 'encrypted_password',
        ativo: true
      }
    }),

    prisma.toolAccount.create({
      data: {
        toolId: tools.find(t => t.slug === 'canva-pro')?.id!,
        nome: 'Canva Account 2',
        email: 'canva2@toolshare.com',
        senhaEncriptada: 'encrypted_password',
        ativo: true
      }
    }),

    prisma.toolAccount.create({
      data: {
        toolId: tools.find(t => t.slug === 'chatgpt-plus')?.id!,
        nome: 'ChatGPT Account 1',
        email: 'chatgpt1@toolshare.com',
        senhaEncriptada: 'encrypted_password',
        ativo: true
      }
    }),

    prisma.toolAccount.create({
      data: {
        toolId: tools.find(t => t.slug === 'figma-pro')?.id!,
        nome: 'Figma Account 1',
        email: 'figma1@toolshare.com',
        senhaEncriptada: 'encrypted_password',
        ativo: true
      }
    })
  ]);

  console.log('✅ Created tool accounts');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@toolshare.com' },
    update: {},
    create: {
      nome: 'Admin User',
      email: 'admin@toolshare.com',
      senhaHash: adminPassword,
      planId: plans.find(p => p.slug === 'enterprise')?.id,
      ativo: true,
      emailVerificado: true
    }
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  // Create test user
  const testPassword = await bcrypt.hash('test123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@toolshare.com' },
    update: {},
    create: {
      nome: 'Test User',
      email: 'test@toolshare.com',
      senhaHash: testPassword,
      planId: plans.find(p => p.slug === 'team')?.id,
      ativo: true,
      emailVerificado: true
    }
  });

  console.log(`✅ Created test user: ${testUser.email}`);

  // Create system settings
  await Promise.all([
    prisma.systemSetting.upsert({
      where: { key: 'app_name' },
      update: {},
      create: {
        key: 'app_name',
        value: 'ToolShare'
      }
    }),

    prisma.systemSetting.upsert({
      where: { key: 'app_version' },
      update: {},
      create: {
        key: 'app_version',
        value: '1.0.0'
      }
    }),

    prisma.systemSetting.upsert({
      where: { key: 'maintenance_mode' },
      update: {},
      create: {
        key: 'maintenance_mode',
        value: false
      }
    }),

    prisma.systemSetting.upsert({
      where: { key: 'max_sessions_per_user' },
      update: {},
      create: {
        key: 'max_sessions_per_user',
        value: 3
      }
    }),

    prisma.systemSetting.upsert({
      where: { key: 'default_session_timeout' },
      update: {},
      create: {
        key: 'default_session_timeout',
        value: 3600 // 1 hour
      }
    })
  ]);

  console.log('✅ Created system settings');

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📋 Created:');
  console.log(`   - ${plans.length} plans`);
  console.log(`   - ${categories.length} tool categories`);
  console.log(`   - ${proxies.length} proxies`);
  console.log(`   - ${tools.length} tools`);
  console.log(`   - 4 tool accounts`);
  console.log(`   - 2 users (admin & test)`);
  console.log(`   - 5 system settings`);
  console.log('\n🔑 Login credentials:');
  console.log('   Admin: admin@toolshare.com / admin123');
  console.log('   Test:  test@toolshare.com / test123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });