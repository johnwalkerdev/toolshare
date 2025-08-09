import { useEffect, useState } from 'react';
import Link from 'next/link';

type Todo = { id: string; title: string; done: boolean; due?: string };

export default function TodosPage(){
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');

  useEffect(()=>{
    const saved = localStorage.getItem('toolshare_todos');
    if(saved) setTodos(JSON.parse(saved));
  },[]);

  const persist = (next:Todo[]) => {
    setTodos(next);
    localStorage.setItem('toolshare_todos', JSON.stringify(next));
  };

  const add = (e:React.FormEvent) => {
    e.preventDefault();
    if(!title.trim()) return;
    const next = [...todos, { id: crypto.randomUUID(), title, done:false, due: due || undefined }];
    setTitle(''); setDue(''); persist(next);
  };

  const toggle = (id:string) => persist(todos.map(t => t.id===id? { ...t, done: !t.done }: t));
  const remove = (id:string) => persist(todos.filter(t => t.id!==id));

  return (
    <main className="min-h-screen bg-primary text-primary max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">To‑Do (Cliente)</h1>
        <Link href="/client" className="btn btn-glass">Voltar</Link>
      </div>

      <form onSubmit={add} className="card mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="input-glass" placeholder="Nova tarefa" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="input-glass" type="date" value={due} onChange={e=>setDue(e.target.value)} />
        <button className="btn btn-primary" type="submit">Adicionar</button>
      </form>

      <div className="space-y-3">
        {todos.map(t => (
          <div key={t.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={t.done} onChange={()=>toggle(t.id)} />
              <div>
                <p className={`font-medium ${t.done? 'line-through text-secondary':''}`}>{t.title}</p>
                {t.due && <p className="text-xs text-secondary">Prazo: {new Date(t.due).toLocaleDateString('pt-BR')}</p>}
              </div>
            </div>
            <button className="text-danger-500 hover:text-danger-400" onClick={()=>remove(t.id)}>Excluir</button>
          </div>
        ))}
        {todos.length===0 && <p className="text-secondary">Sem tarefas. Crie a primeira acima.</p>}
      </div>
    </main>
  );
}


