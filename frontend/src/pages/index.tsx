import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  CheckIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'IP fixo confiável',
    description: 'Acesse sempre com o mesmo IP para evitar bloqueios e verificações.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Controle de sessões',
    description: 'Limites por plano, time ou usuário. Bloqueios automáticos quando exceder.',
    icon: CogIcon,
  },
  {
    name: 'Proxy inteligente',
    description: 'Failover por região e rotação controlada nos planos avançados.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Acesso por times',
    description: 'Papéis e permissões para colaborar sem expor credenciais.',
    icon: UserGroupIcon,
  },
  {
    name: 'Auditoria e logs',
    description: 'Histórico completo de acessos e exportação para CSV/Excel.',
    icon: ChartBarIcon,
  },
];

const plans = [
  {
    name: 'Starter',
    price: 19,
    description: 'Ideal para freelancers',
    features: [
      '1 usuário ativo',
      '1 sessão simultânea',
      '3 ferramentas premium',
      'IP fixo garantido',
      'Suporte via email',
    ],
    cta: 'Começar grátis',
    highlighted: false,
  },
  {
    name: 'Team',
    price: 49,
    description: 'Para pequenas equipes',
    features: [
      'Até 5 usuários',
      '3 sessões simultâneas',
      '10 ferramentas premium',
      'Dashboard colaborativo',
      'Suporte prioritário',
    ],
    cta: 'Mais popular',
    highlighted: true,
  },
  {
    name: 'Business',
    price: 149,
    description: 'Para empresas médias',
    features: [
      'Até 15 usuários',
      '8 sessões simultâneas',
      'Ferramentas ilimitadas',
      'API completa',
      'Failover automático',
    ],
    cta: 'Começar teste',
    highlighted: false,
  },
];

const tools = [
  { name: 'Canva Pro', icon: '🎨' },
  { name: 'ChatGPT Plus', icon: '🤖' },
  { name: 'Figma Pro', icon: '📐' },
  { name: 'Notion Pro', icon: '📝' },
  { name: 'Midjourney', icon: '🖼️' },
  { name: 'Adobe CC', icon: '🔵' },
];

export default function Home() {
  const [email, setEmail] = useState('');
  const [faqOpen, setFaqOpen] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter signup or redirect to registration
    window.location.href = `/auth/register?email=${encodeURIComponent(email)}`;
  };

  return (
    <>
      <Head>
        <title>ToolShare - Compartilhe ferramentas premium com IP fixo</title>
        <meta
          name="description"
          content="Plataforma para compartilhar ferramentas premium com segurança e IP fixo. Centralize acessos de Canva, ChatGPT, Figma e muito mais."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="ToolShare - Compartilhe ferramentas premium com IP fixo" />
        <meta
          property="og:description"
          content="Compartilhe ferramentas premium com controle de sessões, IP fixo e auditoria."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://toolshare.com" />
        <meta property="og:image" content="https://toolshare.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ToolShare - Compartilhe ferramentas premium com IP fixo" />
        <meta name="twitter:description" content="Compartilhe ferramentas premium com controle e segurança" />
      </Head>

      <div className="bg-primary text-primary min-h-screen">
        {/* Navigation */}
        <header className="relative nav-glass">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex justify-start lg:w-0 lg:flex-1">
                <Link href="/" className="flex items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg">
                      <span className="font-bold text-lg">🔄</span>
                    </div>
                    <span className="text-xl font-bold">ToolShare</span>
                  </div>
                </Link>
              </div>

              <nav className="hidden md:flex space-x-8">
                <Link href="#features" className="text-base font-medium text-secondary hover:text-primary">
                  Recursos
                </Link>
                <Link href="#pricing" className="text-base font-medium text-secondary hover:text-primary">
                  Preços
                </Link>
                <Link href="/client" className="text-base font-medium text-secondary hover:text-primary">
                  Client
                </Link>
                <Link href="/admin" className="text-base font-medium text-secondary hover:text-primary">
                  Admin
                </Link>
                <Link href="/tools" className="text-base font-medium text-secondary hover:text-primary">
                  Ferramentas
                </Link>
                <Link href="/contact" className="text-base font-medium text-secondary hover:text-primary">
                  Contato
                </Link>
              </nav>

              <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0 space-x-4">
                <Link
                  href="/auth/login"
                  className="whitespace-nowrap text-base font-medium text-secondary hover:text-primary"
                >
                  Entrar
                </Link>
                <Link
                  href="/auth/register"
                  className="btn btn-primary glow-hover"
                >
                  Começar grátis
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main>
          {/* Hero Section */}
          <div className="relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
              <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                  <div className="sm:text-center lg:text-left">
                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                      className="text-4xl tracking-tight font-bold sm:text-5xl md:text-6xl"
                    >
                      <span className="block">Compartilhe ferramentas premium</span>
                      <span className="block gradient-text">com segurança e IP fixo</span>
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="mt-3 text-base text-secondary sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0"
                    >
                      Uma plataforma para compartilhar ferramentas como Canva, ChatGPT e Figma com IP fixo,
                      controle de sessões e auditoria. Seguro, escalável e econômico.
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start"
                    >
                      <div className="rounded-md shadow glow-hover">
                        <Link href="/auth/register" className="btn btn-primary">
                          Escolher meu plano
                          <ArrowRightIcon className="ml-2 w-5 h-5" />
                        </Link>
                      </div>
                      <div className="mt-3 sm:mt-0 sm:ml-3">
                        <Link
                          href="/demo"
                          className="w-full flex items-center justify-center px-8 py-3 border border-primary-400/30 text-base font-medium rounded-md text-primary-300 bg-transparent hover:bg-white/5 md:py-4 md:text-lg md:px-10 transition-colors duration-200"
                        >
                          Como funciona
                        </Link>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      className="mt-6"
                    >
                      <p className="text-sm text-secondary">
                        ✨ Teste grátis por 7 dias • Sem cartão de crédito
                      </p>
                    </motion.div>
                  </div>
                </main>
              </div>
            </div>

            <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-56 w-full mesh-gradient sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center relative"
              >
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_rgba(34,197,94,0.35),_transparent_40%),radial-gradient(ellipse_at_bottom_left,_rgba(34,197,94,0.25),_transparent_40%)]" />
                <div className="grid grid-cols-3 gap-4 p-8">
                  {tools.map((tool, index) => (
                    <motion.div
                      key={tool.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                      className="card-neon text-center text-white border-primary-500/30"
                    >
                      <div className="text-2xl mb-2">{tool.icon}</div>
                      <div className="text-xs font-medium">{tool.name}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Hero Section - improved */}
          <section className="relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-4xl md:text-6xl font-extrabold leading-tight"
                >
                  Compartilhe ferramentas premium
                  <span className="block gradient-text">com segurança e IP fixo</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  className="mt-4 text-lg text-secondary max-w-xl"
                >
                  Uma assinatura, várias plataformas. IP fixo para evitar bloqueios, controle de sessões por
                  plano/time e auditoria completa para sua operação.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-6 flex flex-col sm:flex-row gap-3"
                >
                  <Link href="/auth/register" className="btn btn-primary">Começar agora</Link>
                  <Link href="#pricing" className="btn btn-glass">Ver planos</Link>
                </motion.div>
              </div>
              <div className="relative">
                <div className="mesh-gradient rounded-3xl h-72 md:h-96" />
                <div className="absolute inset-0 p-6 grid grid-cols-3 gap-4">
                  {tools.slice(0,6).map((tool, i) => (
                    <motion.div key={tool.name} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:0.2 + i*0.05}} className="card-neon text-center text-white">
                      <div className="text-2xl mb-2">{tool.icon}</div>
                      <div className="text-xs font-medium">{tool.name}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Brands Section */}
          <section className="py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-secondary mb-6">Ferramentas que você terá acesso</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-center">
                {['ChatGPT Plus','Claude','Grok','Perplexity','Gemini','Midjourney','Leonardo AI','Runway','Freepik','Envato Elements','Motion Array','Storyblocks','Captions','Placeit','Flaticon','Vecteezy','Vectorizer','Canva Pro','CapCut Pro','TurboScribe'].map((brand) => (
                  <div key={brand} className="btn-glass rounded-xl py-2 text-sm text-secondary">{brand}</div>
                ))}
              </div>
            </div>
          </section>

          {/* Features Section */}
          <div id="features" className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="lg:text-center">
                 <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
                  As melhores ferramentas em uma única assinatura
                </h2>
                 <p className="mt-2 text-3xl leading-8 font-bold tracking-tight sm:text-4xl">
                  Compartilhe ferramentas com controle e segurança
                </p>
                 <p className="mt-4 max-w-2xl text-xl text-secondary lg:mx-auto">
                  Uma assinatura, várias plataformas. Centralize acessos, mantenha IP fixo e controle o uso sem dor de cabeça.
                </p>
              </div>

              <div className="mt-10">
                <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 lg:grid-cols-3">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="relative"
                    >
                      <dt>
                        <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white shadow-soft">
                          <feature.icon className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <p className="ml-16 text-lg leading-6 font-medium">
                          {feature.name}
                        </p>
                      </dt>
                      <dd className="mt-2 ml-16 text-base text-secondary">{feature.description}</dd>
                    </motion.div>
                  ))}
                </dl>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div id="pricing" className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="sm:text-center">
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Planos simples para compartilhar melhor
                </h2>
                <p className="mt-4 text-xl text-secondary">
                  Comece agora e escale conforme sua equipe cresce
                </p>
              </div>

              <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
                {[{...plans[0], price: 37}, {...plans[1], price: 57}, {...plans[2], price: 97}].map((plan, index) => (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`card divide-y divide-primary-200/10 ${
                      plan.highlighted
                        ? 'ring-1 ring-primary-500 relative'
                        : ''
                    }`}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-primary-600 text-white">
                          Mais popular
                        </span>
                      </div>
                    )}

                    <div className="p-6">
                      <h3 className="text-lg leading-6 font-medium">{plan.name}</h3>
                      <p className="mt-2 text-base text-secondary">{plan.description}</p>
                      <p className="mt-8">
                        <span className="text-4xl font-bold">R$ {plan.price},00</span>
                        <span className="text-base font-medium text-secondary">/mês</span>
                      </p>
                      <Link
                        href="/auth/register"
                        className={`mt-8 block w-full py-3 px-6 rounded-md text-center font-medium transition-colors duration-200 ${
                          plan.highlighted
                            ? 'btn btn-primary'
                            : 'btn btn-glass'
                        }`}
                      >
                        {plan.cta}
                      </Link>
                    </div>

                    <div className="pt-6 pb-8 px-6">
                      <h4 className="text-sm font-medium tracking-wide uppercase">
                        Incluso:
                      </h4>
                      <ul className="mt-6 space-y-4">
                        {(plan.features || []).map((feature) => (
                          <li key={feature} className="flex space-x-3">
                            <CheckIcon className="flex-shrink-0 h-5 w-5 text-success-500" />
                            <span className="text-sm text-secondary">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Section with Guarantee */}
          <div className="bg-gradient-to-r from-primary-700 to-primary-600">
            <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                <span className="block">Pronto para começar?</span>
                <span className="block">Teste grátis por 7 dias.</span>
              </h2>
              <p className="mt-4 text-lg leading-6 text-primary-200">
                Sem cartão de crédito. Sem compromisso. Cancele quando quiser.
              </p>
              <div className="mt-6 card bg-black/30">
                <h3 className="text-xl font-semibold mb-2">Garantia Incondicional de 7 Dias</h3>
                <p className="text-secondary">
                  Experimente sem risco. Se a plataforma não elevar sua produtividade, solicite reembolso
                  integral em até 7 dias após a compra. Sem perguntas, sem pegadinhas.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="mt-8 sm:flex sm:justify-center">
                <div className="min-w-0 flex-1 max-w-md">
                  <label htmlFor="email" className="sr-only">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-4 py-3 rounded-md border-0 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-700 focus:ring-white"
                    placeholder="Seu email"
                  />
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3 sm:flex-shrink-0">
                  <button
                    type="submit"
                    className="block w-full px-4 py-3 font-medium text-primary-700 bg-white border border-transparent rounded-md shadow hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-700 focus:ring-white transition-colors duration-200"
                  >
                    Começar grátis
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* FAQ */}
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h3 className="text-2xl font-bold mb-6">Restou alguma dúvida?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {id:'tempo', q:'Quanto tempo dura a assinatura?', a:'Planos mensais com renovação automática. Você pode cancelar quando quiser.'},
                  {id:'pagamento', q:'Como funciona o pagamento?', a:'Cartão ou Pix via provedor de pagamento. A cobrança é recorrente conforme o plano.'},
                  {id:'garantia', q:'Existe garantia de satisfação?', a:'Sim, 7 dias de garantia com reembolso integral para novos assinantes.'},
                  {id:'sites', q:'Quais são todos os sites?', a:'Disponibilizamos as principais ferramentas listadas acima. A oferta pode variar por plano e disponibilidade.'},
                  {id:'suporte', q:'Existe suporte em caso de dúvidas?', a:'Sim, suporte via e‑mail e WhatsApp para planos elegíveis.'},
                  {id:'atualizacoes', q:'Tenho direito às atualizações?', a:'Sim, melhorias e novas integrações são liberadas continuamente.'},
                ].map(item => (
                  <div key={item.id} className="card">
                    <button onClick={() => setFaqOpen(faqOpen === item.id ? null : item.id)} className="w-full flex items-center justify-between text-left">
                      <span className="font-medium">{item.q}</span>
                      {faqOpen === item.id ? <MinusIcon className="w-5 h-5"/> : <PlusIcon className="w-5 h-5"/>}
                    </button>
                    {faqOpen === item.id && (
                      <p className="mt-3 text-secondary">{item.a}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="mt-0 border-t border-primary-200/10 bg-black/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid gap-10 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-lg">🔄</div>
                <span className="font-bold">ToolShare</span>
              </div>
              <p className="text-secondary text-sm">Compartilhe ferramentas premium com IP fixo, controle de sessões e auditoria.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Produto</h4>
              <ul className="space-y-2 text-secondary text-sm">
                <li><Link href="#features" className="hover:text-primary">Recursos</Link></li>
                <li><Link href="#pricing" className="hover:text-primary">Planos</Link></li>
                <li><Link href="/client" className="hover:text-primary">Client</Link></li>
                <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-secondary text-sm">
                <li><Link href="/privacy" className="hover:text-primary">Privacidade</Link></li>
                <li><Link href="/terms" className="hover:text-primary">Termos</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Siga</h4>
              <ul className="space-y-2 text-secondary text-sm">
                <li><Link href="https://instagram.com/toolshare" target="_blank" className="hover:text-primary">Instagram</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-200/10 py-6">
            <p className="text-center text-sm text-secondary">&copy; 2024 ToolShare. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
      {/* FAQ */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold mb-6">Restou alguma dúvida?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {id:'tempo', q:'Quanto tempo dura a assinatura?', a:'Planos mensais com renovação automática. Você pode cancelar quando quiser.'},
              {id:'pagamento', q:'Como funciona o pagamento?', a:'Cartão ou Pix via provedor de pagamento. A cobrança é recorrente conforme o plano.'},
              {id:'garantia', q:'Existe garantia de satisfação?', a:'Sim, 7 dias de garantia com reembolso integral para novos assinantes.'},
              {id:'sites', q:'Quais são todos os sites?', a:'Disponibilizamos as principais ferramentas listadas acima. A oferta pode variar por plano e disponibilidade.'},
              {id:'suporte', q:'Existe suporte em caso de dúvidas?', a:'Sim, suporte via e‑mail e WhatsApp para planos elegíveis.'},
              {id:'atualizacoes', q:'Tenho direito às atualizações?', a:'Sim, melhorias e novas integrações são liberadas continuamente.'},
            ].map(item => (
              <div key={item.id} className="card">
                <button onClick={() => setFaqOpen(faqOpen === item.id ? null : item.id)} className="w-full flex items-center justify-between text-left">
                  <span className="font-medium">{item.q}</span>
                  {faqOpen === item.id ? <MinusIcon className="w-5 h-5"/> : <PlusIcon className="w-5 h-5"/>}
                </button>
                {faqOpen === item.id && (
                  <p className="mt-3 text-secondary">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}