import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SettingsPage(){
  const [dark, setDark] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(()=>{
    const stored = localStorage.getItem('toolshare_pref_dark');
    setDark(stored !== 'false');
    const e = localStorage.getItem('toolshare_email');
    if(e) setEmail(e);
  },[]);

  const save = () => {
    localStorage.setItem('toolshare_pref_dark', String(dark));
    localStorage.setItem('toolshare_email', email);
    alert('Preferências salvas');
  };

  return (
    <main className="min-h-screen bg-primary text-primary max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <Link href="/client" className="btn btn-glass">Voltar</Link>
      </div>
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Tema escuro</p>
            <p className="text-sm text-secondary">Ative para usar o tema escuro por padrão.</p>
          </div>
          <input type="checkbox" checked={dark} onChange={e=>setDark(e.target.checked)} />
        </div>
        <div>
          <p className="font-medium mb-2">Email de contato</p>
          <input className="input-glass w-full" placeholder="Seu email" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={save}>Salvar</button>
      </div>
    </main>
  );
}


