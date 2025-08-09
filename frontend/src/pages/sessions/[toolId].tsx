import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function SessionStarter() {
  const router = useRouter();
  const { toolId } = router.query as { toolId?: string };
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<{ wsEndpoint?: string; url?: string } | null>(null);

  useEffect(() => {
    const start = async () => {
      if (!toolId) return;
      try {
        const r = await fetch(`/api/tools/${toolId}/session`, { method: 'POST' });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.message || 'Falha ao iniciar sessão');
        setInfo(j.data);
        // Abrir a ferramenta em nova aba imediatamente
        if (j.data?.url) window.open(j.data.url, '_blank');
      } catch (e: any) {
        setError(e?.message || 'Erro');
      }
    };
    start();
  }, [toolId]);

  return (
    <main className="min-h-screen bg-primary text-primary max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-4">Iniciando sessão…</h1>
      {error && <p className="text-danger-500">{error}</p>}
      {!error && !info && <p className="text-secondary">Preparando seu navegador remoto…</p>}
      {info && (
        <div className="card">
          <p className="text-secondary mb-2">A janela da ferramenta foi aberta em nova aba.</p>
          <p className="text-sm text-secondary">Endpoint da sessão (para viewer):</p>
          <code className="text-xs break-all">{info.wsEndpoint}</code>
        </div>
      )}
    </main>
  );
}


