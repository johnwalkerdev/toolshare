import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

interface User {
  id: string;
  nome: string;
  email: string;
  plan: { nome: string };
  ativo: boolean;
  createdAt: string;
}

interface Tool {
  id: number;
  nome: string;
  slug: string;
  categoria: { nome: string };
  ativo: boolean;
  limiteUsuarios: number;
}

interface ProxyRow {
  id: number;
  nome: string;
  host: string;
  porta: number;
  tipo: string;
  ativo: boolean;
  regiao?: string;
  latenciaMedia?: number;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsNow, setAnalyticsNow] = useState<{activeSessions:number; onlineUsers:number; activeTools:number} | null>(null);

  const [newTool, setNewTool] = useState({
    nome: '', urlAcesso: '', descricao: '', icone: '', categoriaId: '', proxyId: '', limiteUsuarios: 1, planosPermitidos: ''
  });
  const [overrideOpenId, setOverrideOpenId] = useState<number | null>(null);
  const [overrideForm, setOverrideForm] = useState<{scope:'user'|'team'; scopeId:string; proxyId:string}>({scope:'user', scopeId:'', proxyId:''});
  const [proxies, setProxies] = useState<ProxyRow[]>([]);

  const [newUser, setNewUser] = useState({ nome: '', email: '', planId: '' });
  const [profiles, setProfiles] = useState<any[]>([]);
  const [newProfile, setNewProfile] = useState({ name: '', toolId: '', userId: '', proxyId: '', userAgent: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    let t: any;
    const loop = async () => {
      try {
        const r = await fetch('/api/admin/analytics/now');
        if (r.ok) setAnalyticsNow((await r.json()).data);
      } catch {}
      t = setTimeout(loop, 5000);
    };
    loop();
    return () => t && clearTimeout(t);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        setUsers(data.data?.users || data);
      } else if (activeTab === 'tools') {
        const response = await fetch('/api/admin/tools');
        const data = await response.json();
        setTools(data.data?.tools || data);
      } else if (activeTab === 'proxies') {
        const r = await fetch('/api/proxies');
        const j = await r.json();
        setProxies(j.data?.proxies || []);
      } else if (activeTab === 'tools') {
        // load profiles alongside tools to show at once
        try { const pr = await fetch('/api/admin/profiles'); const pj = await pr.json(); setProfiles(pj.data?.profiles || []);} catch {}
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const createTool = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      nome: newTool.nome,
      urlAcesso: newTool.urlAcesso,
      descricao: newTool.descricao || undefined,
      icone: newTool.icone || undefined,
      categoriaId: newTool.categoriaId ? Number(newTool.categoriaId) : undefined,
      proxyId: newTool.proxyId ? Number(newTool.proxyId) : undefined,
      limiteUsuarios: Number(newTool.limiteUsuarios) || 1,
      planosPermitidos: newTool.planosPermitidos ? newTool.planosPermitidos.split(',').map(s=>Number(s.trim())).filter(Boolean) : []
    };
    const r = await fetch('/api/admin/tools', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    if (r.ok) {
      setNewTool({ nome: '', urlAcesso: '', descricao: '', icone: '', categoriaId: '', proxyId: '', limiteUsuarios: 1, planosPermitidos: '' });
      fetchData();
    } else {
      alert('Erro ao criar ferramenta');
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try{
      const r = await fetch('/api/admin/users', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nome:newUser.nome, email:newUser.email, planId: newUser.planId? Number(newUser.planId): undefined }) });
      if(!r.ok) throw new Error('erro');
      setNewUser({ nome:'', email:'', planId:'' });
      fetchData();
    }catch{
      alert('Falha ao criar usuário');
    }
  }

  const saveOverride = async (toolId: number) => {
    const r = await fetch(`/api/admin/tools/${toolId}/override`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ scope: overrideForm.scope, scopeId: overrideForm.scopeId, proxyId: Number(overrideForm.proxyId) }) });
    if (r.ok) {
      setOverrideOpenId(null);
      setOverrideForm({ scope: 'user', scopeId: '', proxyId: '' });
      alert('Override salvo');
    } else {
      alert('Falha ao salvar override');
    }
  };

  const createProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload:any = { name:newProfile.name, toolId:newProfile.toolId? Number(newProfile.toolId):undefined, userId:newProfile.userId||undefined, proxyId:newProfile.proxyId? Number(newProfile.proxyId):undefined, userAgent:newProfile.userAgent||undefined };
    const r = await fetch('/api/admin/profiles', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    if (r.ok) { setNewProfile({ name:'', toolId:'', userId:'', proxyId:'', userAgent:'' }); fetchData(); } else { alert('Falha ao criar profile'); }
  };

  const openRemoteBrowser = async (toolId: number) => {
    try {
      const r = await fetch(`/api/tools/${toolId}/session`, { method: 'POST' });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.message || 'Falha ao iniciar sessão');
      // Por ora, abrimos a URL da ferramenta em nova aba.
      // A visualização interativa via noVNC/Guacamole será conectada ao wsEndpoint retornado (j.data.wsEndpoint) em uma próxima etapa.
      window.open(j.data.url, '_blank');
    } catch (e) {
      alert('Não foi possível iniciar o navegador remoto');
    }
  };

  const toggleUserStatus = async (userId: string, status: boolean) => {
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !status })
      });
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const toggleToolStatus = async (toolId: number, status: boolean) => {
    try {
      await fetch(`/api/admin/tools/${toolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !status })
      });
      fetchData();
    } catch (error) {
      console.error('Error updating tool:', error);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-primary">
      {/* Top bar */}
      <header className="nav-glass sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-lg">⚙️</div>
              <h1 className="text-2xl font-bold">ToolShare Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <input
                className="input-glass w-64 hidden md:block"
                placeholder="Buscar..."
              />
              <span className="text-sm text-secondary hidden sm:block">admin@toolshare.com</span>
              <ThemeToggle />
              <button className="btn btn-glass text-danger-500">Sair</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {analyticsNow && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card p-4"><p className="text-sm text-secondary">Usuários online</p><p className="text-2xl font-bold">{analyticsNow.onlineUsers}</p></div>
            <div className="card p-4"><p className="text-sm text-secondary">Sessões ativas</p><p className="text-2xl font-bold">{analyticsNow.activeSessions}</p></div>
            <div className="card p-4"><p className="text-sm text-secondary">Ferramentas ativas</p><p className="text-2xl font-bold">{analyticsNow.activeTools}</p></div>
          </div>
        )}
        {/* Navigation Tabs */}
        <div className="border-b border-primary-200/30 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'users', name: 'Usuários' },
              { id: 'tools', name: 'Ferramentas' },
              { id: 'proxies', name: 'Proxies' },
              { id: 'analytics', name: 'Analytics' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-secondary hover:text-primary hover:border-primary-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="card">
                <div className="px-6 py-4 border-b border-primary-200/20">
                  <h2 className="text-lg font-semibold">
                    Usuários ({users.length})
                  </h2>
                </div>
                {/* Create user */}
                <div className="px-6 py-4 border-b border-primary-200/10">
                  <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <input className="input-glass" placeholder="Nome" required value={newUser.nome} onChange={e=>setNewUser({...newUser, nome:e.target.value})}/>
                    <input className="input-glass" placeholder="Email" type="email" required value={newUser.email} onChange={e=>setNewUser({...newUser, email:e.target.value})}/>
                    <input className="input-glass" placeholder="PlanId (opcional)" value={newUser.planId} onChange={e=>setNewUser({...newUser, planId:e.target.value})}/>
                    <button className="btn btn-primary" type="submit">Adicionar</button>
                  </form>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-primary-200/20">
                    <thead className="bg-tertiary">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                          Plano
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                          Criado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary-200/10">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium">
                              {user.nome}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-secondary">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-500/15 text-primary-400">
                              {user.plan?.nome || 'Sem plano'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.ativo 
                                ? 'bg-success-500/15 text-success-400' 
                                : 'bg-danger-500/15 text-danger-400'
                            }`}>
                              {user.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                            {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => toggleUserStatus(user.id, user.ativo)}
                              className={`${
                                user.ativo 
                                  ? 'text-danger-500 hover:text-danger-400' 
                                  : 'text-success-500 hover:text-success-400'
                              }`}
                            >
                              {user.ativo ? 'Desativar' : 'Ativar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tools Tab */}
            {activeTab === 'tools' && (
              <div className="card">
                <div className="px-6 py-4 border-b border-primary-200/20">
                  <h2 className="text-lg font-semibold">
                    Ferramentas ({tools.length})
                  </h2>
                </div>
                <div className="px-6 py-4 border-b border-primary-200/10">
                  <form onSubmit={createTool} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input className="input-glass" placeholder="Nome" value={newTool.nome} onChange={e=>setNewTool({...newTool, nome:e.target.value})} required />
                    <input className="input-glass" placeholder="URL de acesso" value={newTool.urlAcesso} onChange={e=>setNewTool({...newTool, urlAcesso:e.target.value})} required />
                    <input className="input-glass" placeholder="Descrição" value={newTool.descricao} onChange={e=>setNewTool({...newTool, descricao:e.target.value})} />
                    <input className="input-glass" placeholder="Ícone (emoji/URL)" value={newTool.icone} onChange={e=>setNewTool({...newTool, icone:e.target.value})} />
                    <input className="input-glass" placeholder="Categoria ID" value={newTool.categoriaId} onChange={e=>setNewTool({...newTool, categoriaId:e.target.value})} />
                    <input className="input-glass" placeholder="Proxy ID padrão" value={newTool.proxyId} onChange={e=>setNewTool({...newTool, proxyId:e.target.value})} />
                    <input className="input-glass" placeholder="Limite usuários" type="number" min={1} value={newTool.limiteUsuarios} onChange={e=>setNewTool({...newTool, limiteUsuarios:Number(e.target.value)})} />
                    <input className="input-glass md:col-span-2" placeholder="Planos permitidos (IDs separados por vírgula)" value={newTool.planosPermitidos} onChange={e=>setNewTool({...newTool, planosPermitidos:e.target.value})} />
                    <button type="submit" className="btn btn-primary">Adicionar</button>
                  </form>
                </div>
                {/* Browser profiles (AdsPower-like) */}
                <div className="px-6 py-4 border-b border-primary-200/10">
                  <h3 className="font-semibold mb-3">Perfis de Navegador</h3>
                  <form onSubmit={createProfile} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <input className="input-glass" placeholder="Nome" value={newProfile.name} onChange={e=>setNewProfile({...newProfile, name:e.target.value})} required />
                    <input className="input-glass" placeholder="ToolId" value={newProfile.toolId} onChange={e=>setNewProfile({...newProfile, toolId:e.target.value})} />
                    <input className="input-glass" placeholder="UserId (opcional)" value={newProfile.userId} onChange={e=>setNewProfile({...newProfile, userId:e.target.value})} />
                    <input className="input-glass" placeholder="ProxyId (opcional)" value={newProfile.proxyId} onChange={e=>setNewProfile({...newProfile, proxyId:e.target.value})} />
                    <button className="btn btn-primary" type="submit">Criar perfil</button>
                  </form>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-primary-200/20">
                      <thead className="bg-tertiary">
                        <tr>
                          <th className="px-6 py-2 text-left text-xs font-medium text-secondary uppercase">Nome</th>
                          <th className="px-6 py-2 text-left text-xs font-medium text-secondary uppercase">Tool</th>
                          <th className="px-6 py-2 text-left text-xs font-medium text-secondary uppercase">Proxy</th>
                          <th className="px-6 py-2 text-left text-xs font-medium text-secondary uppercase">Usuário</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary-200/10">
                        {profiles.map(p => (
                          <tr key={p.id}>
                            <td className="px-6 py-2">{p.name}</td>
                            <td className="px-6 py-2 text-sm text-secondary">{p.tool?.nome || '-'}</td>
                            <td className="px-6 py-2 text-sm text-secondary">{p.proxy?.nome || '-'}</td>
                            <td className="px-6 py-2 text-sm text-secondary">{p.user?.email || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-primary-200/20">
                    <thead className="bg-tertiary">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                          Categoria
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Proxy padrão</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                          Limite Usuários
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary-200/10">
                      {tools.map((tool) => (
                        <tr key={tool.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium">
                                  {tool.nome}
                                </div>
                                <div className="text-sm text-secondary">{tool.slug}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-500/10 text-primary-400">
                              {tool.categoria?.nome || 'Sem categoria'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{(tool as any).proxy?.nome || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                            {tool.limiteUsuarios} usuários
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              tool.ativo 
                                ? 'bg-success-500/15 text-success-400' 
                                : 'bg-danger-500/15 text-danger-400'
                            }`}>
                              {tool.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => toggleToolStatus(tool.id, tool.ativo)}
                              className={`mr-4 ${
                                tool.ativo 
                                  ? 'text-danger-500 hover:text-danger-400' 
                                  : 'text-success-500 hover:text-success-400'
                              }`}
                            >
                              {tool.ativo ? 'Desativar' : 'Ativar'}
                            </button>
                            <button className="text-primary-400 hover:text-primary-300 mr-4" onClick={() => setOverrideOpenId(overrideOpenId === tool.id ? null : tool.id)}>Definir Proxy</button>
                            <button className="text-secondary hover:text-primary" onClick={() => openRemoteBrowser(tool.id)}>Abrir via navegador</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {overrideOpenId && (
                  <div className="px-6 py-4 border-t border-primary-200/10">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                      <div>
                        <label className="text-sm text-secondary">Escopo</label>
                        <select className="input-glass" value={overrideForm.scope} onChange={e=>setOverrideForm({...overrideForm, scope: e.target.value as any})}>
                          <option value="user">Usuário</option>
                          <option value="team">Time</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-secondary">ID do usuário/time</label>
                        <input className="input-glass" placeholder="cuid ou ID" value={overrideForm.scopeId} onChange={e=>setOverrideForm({...overrideForm, scopeId:e.target.value})} />
                      </div>
                      <div>
                        <label className="text-sm text-secondary">Proxy ID</label>
                        <input className="input-glass" placeholder="proxyId" value={overrideForm.proxyId} onChange={e=>setOverrideForm({...overrideForm, proxyId:e.target.value})} />
                      </div>
                      <button className="btn btn-primary" onClick={() => saveOverride(overrideOpenId)}>Salvar Override</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Proxies Tab */}
            {activeTab === 'proxies' && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Proxies ({proxies.length})</h2>
                  <button onClick={fetchData} className="btn btn-glass">Atualizar</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-primary-200/20">
                    <thead className="bg-tertiary">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Nome</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Host</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Região</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Latência</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary-200/10">
                      {proxies.map(p => (
                        <tr key={p.id}>
                          <td className="px-6 py-3">{p.nome}</td>
                          <td className="px-6 py-3">{p.tipo}://{p.host}:{p.porta}</td>
                          <td className="px-6 py-3 text-sm text-secondary">{p.regiao || '-'}</td>
                          <td className="px-6 py-3 text-sm text-secondary">{p.latenciaMedia ? `${p.latenciaMedia}ms` : '-'}</td>
                          <td className="px-6 py-3">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.ativo ? 'bg-success-500/15 text-success-400' : 'bg-danger-500/15 text-danger-400'}`}>{p.ativo ? 'Ativo' : 'Inativo'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-secondary truncate">
                          Total de Usuários
                        </dt>
                        <dd className="text-lg font-medium">
                          {users.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-success-600 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-secondary truncate">
                          Ferramentas Ativas
                        </dt>
                        <dd className="text-lg font-medium">
                          {tools.filter(t => t.ativo).length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-warning-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-secondary truncate">
                          Sessões Ativas
                        </dt>
                        <dd className="text-lg font-medium">
                          0
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-danger-600 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-secondary truncate">
                          Uptime Médio
                        </dt>
                        <dd className="text-lg font-medium">
                          99.7%
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}