import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const categories = [
  { id: 'all', name: 'Todas' },
  { id: 'design', name: 'Design' },
  { id: 'ia', name: 'IA' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'video', name: 'Vídeo' },
];

const tools = [
  { id: 1, name: 'Canva Pro', category: 'design', desc: 'Design e social', icon: '🎨' },
  { id: 2, name: 'ChatGPT Plus', category: 'ia', desc: 'Assistente IA', icon: '🤖' },
  { id: 3, name: 'Capcut', category: 'video', desc: 'Edição de vídeo', icon: '🎬' },
  { id: 4, name: 'Figma Pro', category: 'design', desc: 'UI/UX', icon: '📐' },
  { id: 5, name: 'Notion Pro', category: 'marketing', desc: 'Docs & wiki', icon: '📝' },
];

export default function ClientDashboard() {
  const [activeCat, setActiveCat] = useState('all');
  const [query, setQuery] = useState('');

  const filtered = tools.filter(
    (t) => (activeCat === 'all' || t.category === activeCat) && t.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-primary text-primary">
      {/* Topbar */}
      <header className="nav-glass sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-lg">🔄</div>
            <h1 className="font-bold">ToolShare</h1>
          </div>
          <div className="flex items-center space-x-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ferramentas..."
              className="input-glass w-64 placeholder-text-tertiary"
            />
            <Link href="/admin" className="btn btn-glass">Admin</Link>
            <Link href="/auth/login" className="btn btn-primary">Entrar</Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categories */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                activeCat === c.id ? 'bg-primary-600 text-white' : 'btn-glass'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Tool grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((tool, i) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className="card group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-600/20 text-primary-300 flex items-center justify-center text-xl">
                    {tool.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{tool.name}</h3>
                    <p className="text-sm text-secondary">{tool.desc}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-primary-600/15 text-primary-300 capitalize">{tool.category}</span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Link href={`/tools/${tool.id}`} className="btn btn-primary">Abrir</Link>
                <button className="btn btn-glass">Detalhes</button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}


