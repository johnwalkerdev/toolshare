import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const tools = [
  { id: 1, name: 'Canva Pro', icon: '🎨' },
  { id: 2, name: 'ChatGPT Plus', icon: '🤖' },
  { id: 3, name: 'Capcut', icon: '🎬' },
  { id: 4, name: 'Figma Pro', icon: '📐' },
  { id: 5, name: 'Notion Pro', icon: '📝' },
];

export default function FavoritesPage(){
  const [favorites, setFavorites] = useState<number[]>([]);
  useEffect(()=>{
    const saved = localStorage.getItem('toolshare_favorites');
    if(saved) setFavorites(JSON.parse(saved));
  },[]);

  const favTools = useMemo(()=> tools.filter(t=>favorites.includes(t.id)),[favorites]);

  return (
    <main className="min-h-screen bg-primary text-primary max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Favoritos</h1>
        <Link href="/client" className="btn btn-glass">Voltar</Link>
      </div>
      {favTools.length ===0 ? (
        <p className="text-secondary">Você ainda não favoritou nenhuma ferramenta.</p>
      ):(
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {favTools.map(t=> (
            <div key={t.id} className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-600/20 text-primary-300 flex items-center justify-center text-xl">{t.icon}</div>
                <h3 className="font-semibold">{t.name}</h3>
              </div>
              <div className="mt-4 flex gap-3">
                <a href={`/sessions/${t.id}`} className="btn btn-primary">Abrir</a>
                <button className="btn btn-glass">Remover</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}


