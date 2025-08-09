import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Task = {
  id: number | string;
  content: string;
  description?: string;
  priority: 1 | 2 | 3 | 4;
  dueDate?: string | null;
  isCompleted: boolean;
  projectId?: number | null;
  sectionId?: number | null;
};

type Project = { id: number; name: string; isFavorite?: boolean };
type Section = { id: number; name: string; projectId: number };

const api = {
  async get<T>(url: string): Promise<T | null> {
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch { return null; }
  },
  async post<T>(url: string, body: any): Promise<T | null> {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'include' });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch { return null; }
  },
  async patch<T>(url: string, body: any): Promise<T | null> {
    try {
      const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'include' });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch { return null; }
  },
  async del<T>(url: string): Promise<T | null> {
    try {
      const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch { return null; }
  }
};

const STORAGE_KEYS = {
  tasks: 'toolshare_todos_tasks',
  projects: 'toolshare_todos_projects',
  sections: 'toolshare_todos_sections'
};

export default function TodosPage(){
  const [view, setView] = useState<'today'|'upcoming'|'inbox'|'project'>('today');
  const [projects, setProjects] = useState<Project[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<number|undefined>();

  const [quickContent, setQuickContent] = useState('');
  const [quickDue, setQuickDue] = useState('');
  const [quickPriority, setQuickPriority] = useState<1|2|3|4>(1);

  const isProjectView = view === 'project' && selectedProject;

  useEffect(()=>{
    const bootstrap = async () => {
      // Try API first
      const p = await api.get<{success:boolean; projects:Project[]}>('/api/todos/projects');
      const t = await api.get<{success:boolean; tasks:Task[]}>(`/api/todos/tasks?view=${view}`);
      if (p && p.success) setProjects(p.projects);
      if (t && t.success) setTasks(t.tasks);
      if (!p || !p.success) {
        const lp = localStorage.getItem(STORAGE_KEYS.projects);
        if (lp) setProjects(JSON.parse(lp));
      } else {
        localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(p.projects));
      }
      if (!t || !t.success) {
        const lt = localStorage.getItem(STORAGE_KEYS.tasks);
        if (lt) setTasks(JSON.parse(lt));
      } else {
        localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(t.tasks));
      }
      const ls = localStorage.getItem(STORAGE_KEYS.sections);
      if (ls) setSections(JSON.parse(ls));
    };
    bootstrap();
  },[view]);

  useEffect(()=>{
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
  },[tasks]);
  useEffect(()=>{
    localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
  },[projects]);
  useEffect(()=>{
    localStorage.setItem(STORAGE_KEYS.sections, JSON.stringify(sections));
  },[sections]);

  const groupedBySection = useMemo(()=>{
    const map: Record<string, Task[]> = {};
    const secForProject = sections.filter(s=>s.projectId===selectedProject);
    for (const s of secForProject) map[s.id] = [] as unknown as Task[];
    for (const task of tasks.filter(t=> (isProjectView? t.projectId===selectedProject : true) && !t.isCompleted)){
      const key = task.sectionId ?? 'inbox';
      if (!map[key as any]) map[key as any] = [] as unknown as Task[];
      map[key as any].push(task);
    }
    return map;
  },[tasks, sections, selectedProject, isProjectView]);

  const addQuick = async (e:React.FormEvent) => {
    e.preventDefault();
    if(!quickContent.trim()) return;
    const body = {
      content: quickContent,
      priority: quickPriority,
      dueDate: quickDue || undefined,
      projectId: isProjectView ? selectedProject! : undefined
    };
    const res = await api.post<{success:boolean; task:Task}>('/api/todos/tasks', body);
    if (res && res.success) {
      setTasks(prev=>[res.task, ...prev]);
    } else {
      // Fallback local
      setTasks(prev=>[
        { id: crypto.randomUUID(), content: quickContent, description: '', priority: quickPriority, dueDate: quickDue||null, isCompleted:false, projectId: selectedProject ?? null, sectionId: null },
        ...prev
      ]);
    }
    setQuickContent(''); setQuickDue(''); setQuickPriority(1);
  };

  const toggleComplete = async (task: Task) => {
    const next = { ...task, isCompleted: !task.isCompleted };
    setTasks(prev => prev.map(t=> (t.id===task.id? next : t)));
    await api.patch(`/api/todos/tasks/${task.id}`, { isCompleted: next.isCompleted });
  };

  const removeTask = async (task: Task) => {
    setTasks(prev => prev.filter(t=> t.id!==task.id));
    await api.del(`/api/todos/tasks/${task.id}`);
  };

  const createProject = async () => {
    const name = prompt('Project name');
    if (!name) return;
    const res = await api.post<{success:boolean; project:Project}>('/api/todos/projects', { name });
    if (res && res.success) setProjects(prev=>[...prev, res.project]);
    else setProjects(prev=>[...prev, { id: Date.now(), name }]);
  };

  return (
    <main className="min-h-screen bg-primary text-primary">
      <div className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 space-y-4">
          <Link href="/client" className="btn btn-glass w-full">← Back</Link>

          <nav className="card divide-y divide-white/5">
            <button onClick={()=>{setView('today'); setSelectedProject(undefined);}} className={`w-full text-left px-4 py-3 hover:bg-white/5 ${view==='today'?'bg-white/10':''}`}>Today</button>
            <button onClick={()=>{setView('upcoming'); setSelectedProject(undefined);}} className={`w-full text-left px-4 py-3 hover:bg-white/5 ${view==='upcoming'?'bg-white/10':''}`}>Upcoming</button>
            <button onClick={()=>{setView('inbox'); setSelectedProject(undefined);}} className={`w-full text-left px-4 py-3 hover:bg-white/5 ${view==='inbox'?'bg-white/10':''}`}>Inbox</button>
          </nav>

          <div className="flex items-center justify-between">
            <h3 className="text-sm uppercase tracking-wider text-secondary">Projects</h3>
            <button onClick={createProject} className="text-accent-primary hover:underline">Add</button>
          </div>
          <div className="card p-0">
            {projects.length===0 && <p className="text-secondary px-4 py-3">No projects</p>}
            {projects.map(p=> (
              <button key={p.id} onClick={()=>{setView('project'); setSelectedProject(p.id);}} className={`w-full text-left px-4 py-3 hover:bg-white/5 ${isProjectView && selectedProject===p.id?'bg-white/10':''}`}>{p.name}</button>
            ))}
          </div>
        </aside>

        {/* Main */}
        <section className="col-span-12 md:col-span-9 space-y-6">
          <header className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">
              {view==='today' && 'Today'}
              {view==='upcoming' && 'Upcoming'}
              {view==='inbox' && 'Inbox'}
              {isProjectView && projects.find(p=>p.id===selectedProject)?.name}
            </h1>
          </header>

          {/* Quick add */}
          <form onSubmit={addQuick} className="card grid grid-cols-1 md:grid-cols-5 gap-3">
            <input className="input-glass md:col-span-3" placeholder="Task name" value={quickContent} onChange={e=>setQuickContent(e.target.value)} />
            <input className="input-glass" type="date" value={quickDue} onChange={e=>setQuickDue(e.target.value)} />
            <select className="input-glass" value={quickPriority} onChange={e=>setQuickPriority(Number(e.target.value) as 1|2|3|4)}>
              <option value={1}>Priority 4 (low)</option>
              <option value={2}>Priority 3</option>
              <option value={3}>Priority 2</option>
              <option value={4}>Priority 1 (high)</option>
            </select>
            <button className="btn btn-primary" type="submit">Add</button>
          </form>

          {/* Task lists */}
          {isProjectView ? (
            <div className="space-y-6">
              {Object.keys(groupedBySection).length===0 && <p className="text-secondary">No tasks</p>}
              {Object.entries(groupedBySection).map(([secId, list]) => (
                <div key={secId} className="space-y-3">
                  <h3 className="text-sm uppercase tracking-wider text-secondary">
                    {secId==='inbox' ? 'No Section' : sections.find(s=>String(s.id)===secId)?.name || 'Section'}
                  </h3>
                  {list.map(task => (
                    <div key={String(task.id)} className="card flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={task.isCompleted} onChange={()=>toggleComplete(task)} />
                        <div>
                          <p className={`font-medium ${task.isCompleted? 'line-through text-secondary':''}`}>{task.content}</p>
                          <div className="text-xs text-secondary flex items-center gap-2">
                            {task.dueDate && <span>{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>}
                            <span>Priority {task.priority}</span>
                          </div>
                        </div>
                      </div>
                      <button className="text-danger-500 hover:text-danger-400" onClick={()=>removeTask(task)}>Delete</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.filter(t=>{
                if (view==='today'){
                  if (!t.dueDate) return false;
                  const d = new Date(t.dueDate);
                  const now = new Date();
                  return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth() && d.getDate()===now.getDate();
                }
                if (view==='upcoming'){
                  return t.dueDate ? new Date(t.dueDate) >= new Date() : false;
                }
                return !t.isCompleted;
              }).map(task => (
                <div key={String(task.id)} className="card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={task.isCompleted} onChange={()=>toggleComplete(task)} />
                    <div>
                      <p className={`font-medium ${task.isCompleted? 'line-through text-secondary':''}`}>{task.content}</p>
                      <div className="text-xs text-secondary flex items-center gap-2">
                        {task.dueDate && <span>{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>}
                        <span>Priority {task.priority}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-danger-500 hover:text-danger-400" onClick={()=>removeTask(task)}>Delete</button>
                </div>
              ))}
              {tasks.length===0 && <p className="text-secondary">No tasks. Add your first above.</p>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

