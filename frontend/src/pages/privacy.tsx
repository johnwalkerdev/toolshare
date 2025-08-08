export default function Privacy() {
  return (
    <main className="min-h-screen bg-primary text-primary max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Política de Privacidade</h1>
      <p className="text-secondary mb-4">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
      <p className="mb-4">Valorizamos sua privacidade. Esta política explica como coletamos, usamos e protegemos seus dados ao utilizar a ToolShare.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Dados coletados</h2>
      <p className="mb-4">Coletamos informações de conta (nome, email), dados de uso (logs de acesso), e dados de pagamento via provedor terceirizado.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Uso de dados</h2>
      <p className="mb-4">Usamos seus dados para autenticação, faturamento, prevenção de fraude, auditoria e melhoria de produto.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Compartilhamento</h2>
      <p className="mb-4">Não vendemos dados. Compartilhamos somente com serviços essenciais (pagamentos, e‑mail, observabilidade) sob contratos e DPA.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Segurança</h2>
      <p className="mb-4">Senhas com bcrypt, segredos com AES‑256‑GCM, acesso mínimo necessário, auditoria e backups.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Seus direitos</h2>
      <p className="mb-4">Você pode solicitar acesso, correção ou exclusão de dados conforme a LGPD. Contato: suporte@toolshare.com.</p>
    </main>
  );
}


