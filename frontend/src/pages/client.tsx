import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  Squares2X2Icon,
  StarIcon,
  Cog6ToothIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  BoltIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

// sidebar removido (layout fix); links renderizados diretamente no JSX

const filters = [
  { id: 'all', name: 'Todas as ferramentas' },
  { id: 'chatgpt', name: 'ChatGPT' },
  { id: 'freepik', name: 'Freepik' },
  { id: 'envato', name: 'Envato' },
];

const tools = [
  { id: 1, name: 'Canva Pro', category: 'design', vendor: 'canva', desc: 'Versão premium com recursos gráficos e modelos.', icon: '🎨' },
  { id: 2, name: 'Capcut', category: 'video', vendor: 'capcut', desc: 'Editor de vídeo com recursos avançados.', icon: '🎬' },
  { id: 3, name: 'ChatGPT Plus 2', category: 'chatgpt', vendor: 'openai', desc: 'IA conversacional para geração de textos.', icon: '🤖' },
  { id: 4, name: 'ChatGPT Plus 5', category: 'chatgpt', vendor: 'openai', desc: 'IA conversacional para geração de textos.', icon: '🤖' },
  { id: 5, name: 'Envato Elements', category: 'envato', vendor: 'envato', desc: 'Banco visual de itens premium.', icon: '🧩' },
  { id: 6, name: 'Freepik 1', category: 'freepik', vendor: 'freepik', desc: 'Banco visual com milhões de recursos.', icon: '📁' },
];

export default function ClientDashboard() {
  const [activeCat, setActiveCat] = useState('all');
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('toolshare_favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('toolshare_favorites', JSON.stringify(next));
      return next;
    });
  };

  const filtered = tools.filter(
    (t) => (activeCat === 'all' || t.category === activeCat) && t.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-primary text-primary">
      {/* Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Sidebar */}
        <aside className="hidden lg:block col-span-3 xl:col-span-2">
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-4 border-b border-primary-200/10 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-lg">🔄</div>
              <div>
                <p className="text-sm text-secondary">ASSINANTE</p>
                <p className="font-semibold">Prime</p>
              </div>
            </div>
            <nav className="py-2">
              <Link href="/client" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors bg-white/5 border-l-4 border-primary-500"><HomeIcon className="w-5 h-5 text-secondary"/><span>Dashboard</span></Link>
              <Link href="/client" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors"><Squares2X2Icon className="w-5 h-5 text-secondary"/><span>Ferramentas</span></Link>
              <Link href="/client/favorites" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors"><StarIcon className="w-5 h-5 text-secondary"/><span>Favoritos</span></Link>
              <Link href="/client/todos" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors"><UsersIcon className="w-5 h-5 text-secondary"/><span>To‑Do</span></Link>
              <Link href="/client/settings" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors"><Cog6ToothIcon className="w-5 h-5 text-secondary"/><span>Configurações</span></Link>
            </nav>
            <div className="px-4 py-3 border-t border-primary-200/10">
              <button className="flex items-center gap-2 text-danger-500 text-sm hover:text-danger-400">
                <ArrowRightOnRectangleIcon className="w-5 h-5" /> Sair
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 lg:col-span-9 xl:col-span-10 space-y-6">
          {/* Welcome banner */}
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-6 bg-gradient-to-r from-primary-900/30 to-primary-600/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary">Olá, Vinicius Cardoso, bem-vindo(a) ao futuro!</p>
                  <h2 className="text-2xl font-bold mt-1">Acesse suas ferramentas com controle total</h2>
                  <div className="mt-2 text-sm text-secondary">
                    Seus planos ativos: <Link href="#" className="text-primary-400 underline">Assinante Prime</Link>. <Link href="#" className="text-primary-400">Ver mais</Link>
                  </div>
                </div>
                <BoltIcon className="w-10 h-10 text-primary-400 hidden sm:block" />
              </div>
            </div>
            {/* Search */}
            <div className="px-6 py-4 border-t border-primary-200/10 flex items-center gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="w-5 h-5 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar ferramentas..."
                  className="input-glass w-full pl-10 placeholder-text-tertiary"
                />
              </div>
              <button className="btn btn-glass hidden md:inline-flex"><GlobeAltIcon className="w-5 h-5 mr-2"/>Ver todas</button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveCat(f.id)}
                className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                  activeCat === f.id ? 'bg-primary-600 text-white' : 'btn-glass'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>

          {/* Tools grid */}
          <section>
            <h3 className="text-sm text-secondary mb-3">Mais Acessadas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((tool, i) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}
                  className="card group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-600/20 text-primary-300 flex items-center justify-center text-xl">
                        {tool.icon}
                      </div>
                      <div>
                        <p className="text-[10px] tracking-widest text-secondary uppercase">Ferramentas</p>
                        <h4 className="font-semibold">{tool.name}</h4>
                        <p className="text-sm text-secondary line-clamp-2">{tool.desc}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleFavorite(tool.id)} title="Favoritar" className={`text-sm ${favorites.includes(tool.id)?'text-primary-400':'text-secondary'} hover:text-primary-300`}>★</button>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <a href={`/sessions/${tool.id}`} className="btn btn-primary">Abrir</a>
                    <button className="btn btn-glass">Detalhes</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}


