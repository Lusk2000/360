import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Phone, Mail, Building2, MapPin, Calendar, Clock, DollarSign, Target, CheckCircle2, XCircle, FileText, Download, Users, User, ArrowRight, Trash2, Edit3, MessageCircle } from 'lucide-react';

const CRM_STATUSES = [
  "Novo Lead",
  "Primeiro Contato",
  "Qualificado",
  "Proposta Enviada",
  "Negociação",
  "Aguardando Retorno",
  "Cliente Ativo",
  "Venda Concluída",
  "Lead Perdido"
];

const STATUS_COLORS: Record<string, string> = {
  "Novo Lead": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Primeiro Contato": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "Qualificado": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Proposta Enviada": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Negociação": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Aguardando Retorno": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Cliente Ativo": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Venda Concluída": "bg-green-500/10 text-green-400 border-green-500/20",
  "Lead Perdido": "bg-red-500/10 text-red-400 border-red-500/20"
};

const PRIORITIES = ["Baixa", "Média", "Alta"];

export const CRMView = ({
  clients,
  currentUserProfile,
  user,
  supabase,
  permissions,
  setEditingId,
  setFormData,
  setIsModalOpen,
  setItemToDelete,
  fetchCollections,
  isSystemAdmin, USER_PROFILES,
  setActiveTab,
  setReportType,
  setIsReportModalOpen
}: any) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  
  const allowedNames = ['Luan', 'Lucas', 'Nubia', 'Vagner', 'Caetano'];
  const userLabel = USER_PROFILES && USER_PROFILES[currentUserProfile] ? USER_PROFILES[currentUserProfile].label : '';
  const canViewValor = allowedNames.includes(userLabel);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const filteredClients = useMemo(() => {
    return clients.filter((c: any) => {
      const search = searchTerm.toLowerCase();
      return (
        c.nome?.toLowerCase().includes(search) ||
        c.empresa?.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search) ||
        c.telefone?.toLowerCase().includes(search)
      );
    });
  }, [clients, searchTerm]);

  // Estatísticas
  const stats = useMemo(() => {
    const active = clients.filter((c: any) => c.status === 'Cliente Ativo').length;
    const leads = clients.filter((c: any) => ['Novo Lead', 'Primeiro Contato', 'Qualificado'].includes(c.status)).length;
    const lost = clients.filter((c: any) => c.status === 'Lead Perdido').length;
    const negotiating = clients.filter((c: any) => ['Proposta Enviada', 'Negociação', 'Aguardando Retorno'].includes(c.status)).length;
    const sales = clients.filter((c: any) => c.status === 'Venda Concluída').length;
    const newCount = clients.filter((c: any) => c.status === 'Novo Lead').length;
    
    return { active, leads, lost, negotiating, sales, newCount, total: clients.length };
  }, [clients]);

  const handleDragStart = (e: any, clientId: string) => {
    e.dataTransfer.setData('clientId', clientId);
  };

  const handleDrop = async (e: any, newStatus: string) => {
    e.preventDefault();
    const clientId = e.dataTransfer.getData('clientId');
    if (!clientId || !permissions.canEdit('clients')) return;
    
    const client = clients.find((c: any) => c.id === clientId);
    if (!client || client.status === newStatus) return;

    try {
      const parsedEmail = {
        email: client.email || '',
        servico: client.servico || '',
        valor: client.valor || '',
        rede_social: client.rede_social || '',
        status: newStatus,
        cnpj: client.cnpj || '',
        email_secundario: client.email_secundario || '',
        telefone_secundario: client.telefone_secundario || '',
        empresa: client.empresa || '',
        whatsapp: client.whatsapp || '',
        endereco: client.endereco || '',
        cidade: client.cidade || '',
        estado: client.estado || '',
        origem: client.origem || '',
        responsavel_atendimento: client.responsavel_atendimento || '',
        prioridade: client.prioridade || 'Média',
        anotacoes: client.anotacoes || '',
        timeline: [
           ...(client.timeline || []),
           { date: new Date().toISOString(), type: 'Status', description: `Movido para ${newStatus}`, user: currentUserProfile }
        ]
      };
      
      const payload = {
        email: JSON.stringify(parsedEmail),
        updated_at: new Date().toISOString()
      };

      await supabase.from('clients').update(payload).eq('id', clientId);
      fetchCollections('clients');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
  };

  const openClientDetails = (client: any) => {
    setSelectedClient(client);
    setIsClientModalOpen(true);
  };

  const renderTimelineIcon = (type: string) => {
     switch(type) {
        case 'Ligação': return <Phone size={14} className="text-blue-400" />;
        case 'Mensagem': return <MessageCircle size={14} className="text-emerald-400" />;
        case 'Reunião': return <Users size={14} className="text-purple-400" />;
        case 'Proposta': return <FileText size={14} className="text-amber-400" />;
        case 'Status': return <ArrowRight size={14} className="text-slate-400" />;
        default: return <Clock size={14} className="text-slate-400" />;
     }
  };

  return (
    <div className="h-full flex flex-col relative space-y-6">
      {/* HEADER & STATS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase flex items-center gap-2">
            <Target className="text-emerald-500" /> Cadastro CRM
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de Clientes e Negócios</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
           {permissions.canExportReport('clients') && (
           <button 
             onClick={() => { setReportType('clients'); setIsReportModalOpen(true); }}
             className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
           >
             <Download size={14} /> Relatório
           </button>
           )}
           <button 
             onClick={() => setViewMode('kanban')}
             className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${viewMode === 'kanban' ? 'bg-slate-800 text-white' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}
           >
             Kanban
           </button>
           <button 
             onClick={() => setViewMode('list')}
             className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}
           >
             Lista
           </button>
           {permissions.canEdit('clients') && (
            <button 
              onClick={() => { setEditingId(null); setFormData({}); setIsModalOpen(true); }}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Novo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total de Leads', value: stats.leads, color: 'text-indigo-400' },
          { label: 'Novos Cadastros', value: stats.newCount, color: 'text-blue-400' },
          { label: 'Negociações', value: stats.negotiating, color: 'text-amber-400' },
          { label: 'Vendas Concluídas', value: stats.sales, color: 'text-emerald-400' },
          { label: 'Clientes Ativos', value: stats.active, color: 'text-emerald-400' },
          { label: 'Leads Perdidos', value: stats.lost, color: 'text-red-400' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-center shadow-lg">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
            <div className={`text-3xl font-black ${stat.color} tracking-tighter`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="flex relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-slate-500" />
        </div>
        <input 
          type="text" 
          placeholder="Buscar clientes por nome, empresa, telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-600 font-medium"
        />
      </div>

      {viewMode === 'kanban' ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex gap-4 h-full min-w-max">
            {CRM_STATUSES.map(status => (
              <div 
                key={status} 
                className="w-72 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col h-full"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                <div className="p-4 border-b border-slate-800/80 flex justify-between items-center bg-slate-900 rounded-t-2xl">
                   <h3 className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${STATUS_COLORS[status]}`}>{status}</h3>
                   <span className="text-xs font-black text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                     {filteredClients.filter((c: any) => (c.status || 'Novo Lead') === status).length}
                   </span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
                  {filteredClients.filter((c: any) => (c.status || 'Novo Lead') === status).map((client: any) => (
                    <div 
                      key={client.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, client.id)}
                      onClick={() => openClientDetails(client)}
                      className="bg-slate-800 p-4 rounded-xl cursor-grab active:cursor-grabbing hover:bg-slate-700/80 transition-colors shadow-lg border border-slate-700/50 group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-sm text-white line-clamp-1">{client.nome || 'Sem Nome'}</div>
                        {client.prioridade && (
                          <div className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                            client.prioridade === 'Alta' ? 'bg-red-500/20 text-red-400' :
                            client.prioridade === 'Média' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {client.prioridade}
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1 line-clamp-1">
                        <Building2 size={12} /> {client.empresa || 'Sem Empresa'}
                      </div>
                      <div className="flex gap-2 text-[10px] text-slate-500">
                        {client.telefone && <span className="flex items-center gap-1"><Phone size={10} /> {client.telefone}</span>}
                        {canViewValor && client.valor_servico && <span className="flex items-center gap-1 text-emerald-500/70"><DollarSign size={10} /> {client.valor_servico}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-[10px] uppercase bg-slate-950 text-slate-500 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-4 font-black tracking-widest">Nome / Empresa</th>
                  <th className="px-4 py-4 font-black tracking-widest">Contato</th>
                  <th className="px-4 py-4 font-black tracking-widest">Status</th>
                  <th className="px-4 py-4 font-black tracking-widest">Prioridade</th>
                  {canViewValor && <th className="px-4 py-4 font-black tracking-widest">Valor</th>}
                  <th className="px-4 py-4 font-black tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client: any) => (
                  <tr key={client.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-4 cursor-pointer" onClick={() => openClientDetails(client)}>
                      <div className="font-bold text-white mb-1">{client.nome}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest">{client.empresa || '--'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-mono text-xs text-slate-400 mb-1">{client.telefone || '--'}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{client.email || '--'}</div>
                    </td>
                    <td className="px-4 py-4">
                       <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${STATUS_COLORS[client.status || 'Novo Lead']}`}>
                         {client.status || 'Novo Lead'}
                       </span>
                    </td>
                    <td className="px-4 py-4">
                      {client.prioridade && (
                        <div className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                          client.prioridade === 'Alta' ? 'bg-red-500/20 text-red-400' :
                          client.prioridade === 'Média' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {client.prioridade}
                        </div>
                      )}
                    </td>
                    {canViewValor && (
                    <td className="px-4 py-4 font-mono text-emerald-400/80">
                      {client.valor_servico || '--'}
                    </td>
                  )}
                    <td className="px-4 py-4 flex gap-2">
                       {permissions.canEdit('clients') && (
                         <button onClick={() => { setEditingId(client.id); setFormData(client); setIsModalOpen(true); }} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors">
                           <Edit3 size={14} />
                         </button>
                       )}
                       {permissions.canDelete('clients') && (
                         <button onClick={() => setItemToDelete({ id: client.id, type: 'client', title: client.nome, collName: 'clients' })} className="w-8 h-8 rounded-lg bg-slate-800 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors">
                           <Trash2 size={14} />
                         </button>
                       )}
                    </td>
                  </tr>
                ))}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      <Users size={32} className="mx-auto mb-4 opacity-20" />
                      <p className="font-bold uppercase tracking-widest text-xs">Nenhum cliente encontrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLIENT DETAILS MODAL */}
      <AnimatePresence>
        {isClientModalOpen && selectedClient && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[70] flex flex-col p-4 sm:p-6 bg-slate-950/90 backdrop-blur-xl overflow-y-auto"
           >
             <div className="w-full max-w-5xl mx-auto bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[80vh]">
               {/* HEADER */}
               <div className="bg-slate-800/50 border-b border-slate-700 p-6 sm:p-8 flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-2">{selectedClient.nome}</h2>
                    <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-400">
                      {selectedClient.empresa && <span className="flex items-center gap-1"><Building2 size={14} /> {selectedClient.empresa}</span>}
                      {selectedClient.telefone && <span className="flex items-center gap-1"><Phone size={14} /> {selectedClient.telefone}</span>}
                      {selectedClient.telefone_secundario && <span className="flex items-center gap-1"><Phone size={14} /> {selectedClient.telefone_secundario} (Sec.)</span>}
                      {selectedClient.email && <span className="flex items-center gap-1"><Mail size={14} /> {selectedClient.email}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${STATUS_COLORS[selectedClient.status || 'Novo Lead']}`}>
                      {selectedClient.status || 'Novo Lead'}
                    </span>
                    <button onClick={() => setIsClientModalOpen(false)} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors">
                      <XCircle size={24} />
                    </button>
                  </div>
               </div>

               {/* BODY */}
               <div className="flex-1 flex flex-col md:flex-row">
                 {/* LEFT COL - DETAILS */}
                 <div className="w-full md:w-1/3 border-r border-slate-800 p-6 space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Detalhes do Cadastro</h4>
                      <div className="space-y-3 text-sm">
                         <div className="flex justify-between">
                            <span className="text-slate-500">CPF/CNPJ</span>
                            <span className="font-mono text-slate-300">{selectedClient.cnpj || '--'}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-slate-500">Origem</span>
                            <span className="text-slate-300">{selectedClient.origem || '--'}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-slate-500">Responsável</span>
                            <span className="text-slate-300 line-clamp-1">{selectedClient.responsavel_atendimento || '--'}</span>
                         </div>
                         {canViewValor && (
                           <>
                             <div className="flex justify-between">
                                <span className="text-slate-500">Valor do Serviço</span>
                                <span className="text-slate-300">{selectedClient.valor_servico || '--'}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="text-slate-500">Foi Dividido?</span>
                                <span className="text-slate-300">{selectedClient.dividido || 'Não'}</span>
                             </div>
                             {selectedClient.dividido === 'Sim' && (
                               <>
                                 <div className="flex justify-between">
                                    <span className="text-slate-500">Data Inicial</span>
                                    <span className="text-slate-300">{selectedClient.data_inicial ? new Date(selectedClient.data_inicial + 'T12:00:00').toLocaleDateString('pt-BR') : '--'}</span>
                                 </div>
                                 <div className="flex justify-between">
                                    <span className="text-slate-500">Data Final</span>
                                    <span className="text-slate-300">{selectedClient.data_final ? new Date(selectedClient.data_final + 'T12:00:00').toLocaleDateString('pt-BR') : '--'}</span>
                                 </div>
                                 <div className="flex justify-between">
                                    <span className="text-slate-500">Valor Sugerido</span>
                                    <span className="text-slate-300 font-medium text-emerald-400">{selectedClient.valor_sugerido || '--'}</span>
                                 </div>
                               </>
                             )}
                           </>
                         )}
                         <div className="flex justify-between">
                            <span className="text-slate-500">Cadastrado em</span>
                            <span className="font-mono text-slate-300">
                              {selectedClient.created_at ? new Date(selectedClient.created_at).toLocaleDateString('pt-BR') : '--'}
                            </span>
                         </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Endereço</h4>
                      <div className="text-sm text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
                         {selectedClient.endereco ? (
                           <>
                             <div>{selectedClient.endereco}</div>
                             <div className="text-slate-500 mt-1">{selectedClient.cidade} {selectedClient.estado ? ` - ${selectedClient.estado}` : ''}</div>
                           </>
                         ) : <span className="text-slate-600">Não informado</span>}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Anotações</h4>
                      <div className="text-sm text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 whitespace-pre-wrap min-h-[100px]">
                         {selectedClient.anotacoes || <span className="text-slate-600">Nenhuma anotação...</span>}
                      </div>
                    </div>
                    
                    {permissions.canEdit('clients') && (
                       <button onClick={() => { setIsClientModalOpen(false); setEditingId(selectedClient.id); setFormData(selectedClient); setIsModalOpen(true); }} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                         <Edit3 size={16} /> Editar Cliente
                       </button>
                    )}

                    <div>
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 mt-6">Ações Rápidas (Integrações)</h4>
                      <div className="grid grid-cols-1 gap-2">
                         <button onClick={() => {
                            setIsClientModalOpen(false);
                            setActiveTab('appointments');
                            setEditingId(null);
                            setFormData({
                               titulo: `Reunião - ${selectedClient.nome}`,
                               localizacao: `${selectedClient.telefone}`,
                               data: new Date().toISOString().split('T')[0],
                               hora: '09:00',
                               status: 'scheduled'
                            });
                            setIsModalOpen(true);
                         }} className="w-full py-2.5 bg-slate-900 border border-slate-700 hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-400 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-start px-4 gap-3">
                           <Calendar size={14} className="text-blue-400" /> Agendar Compromisso
                         </button>

                         <button onClick={() => {
                            setIsClientModalOpen(false);
                            setActiveTab('tasks');
                            setEditingId(null);
                            setFormData({
                               titulo: `Follow-up - ${selectedClient.nome}`,
                               descricao: `Contato com ${selectedClient.nome} (${selectedClient.telefone || selectedClient.email})`,
                               data: new Date().toISOString().split('T')[0],
                               prioridade: 'medium',
                               status: 'pending',
                               atribuido_a: currentUserProfile
                            });
                            setIsModalOpen(true);
                         }} className="w-full py-2.5 bg-slate-900 border border-slate-700 hover:bg-amber-500/20 hover:border-amber-500/50 hover:text-amber-400 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-start px-4 gap-3">
                           <CheckCircle2 size={14} className="text-amber-400" /> Criar Tarefa
                         </button>

                         <button onClick={() => {
                            setIsClientModalOpen(false);
                            setActiveTab('financial_control');
                            setEditingId(null);
                            setFormData({
                               type: 'income',
                               status: 'pending',
                               descricao: `Venda - ${selectedClient.nome}`,
                               data: new Date().toISOString().split('T')[0],
                               valor: selectedClient.valor || 0
                            });
                            setIsModalOpen(true);
                         }} className="w-full py-2.5 bg-slate-900 border border-slate-700 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-400 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-start px-4 gap-3">
                           <DollarSign size={14} className="text-emerald-400" /> Lançar Financeiro
                         </button>
                      </div>
                    </div>
                 </div>

                 {/* RIGHT COL - TIMELINE */}
                 <div className="flex-1 bg-slate-900/50 p-6 flex flex-col">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Histórico de Interações (Em breve)</h4>
                    <div className="flex-1 overflow-y-auto">
                       {(!selectedClient.timeline || selectedClient.timeline.length === 0) ? (
                         <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                            <Clock size={48} className="opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest">Nenhuma interação registrada</p>
                         </div>
                       ) : (
                         <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-6">
                            {selectedClient.timeline.map((event: any, idx: number) => (
                              <div key={idx} className="relative">
                                 <div className="absolute -left-9 top-1 bg-slate-900 border border-slate-700 p-1 rounded-full shadow-lg">
                                    {renderTimelineIcon(event.type)}
                                 </div>
                                 <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                                    <div className="flex justify-between items-start mb-2">
                                       <span className="text-xs font-bold text-white uppercase tracking-wider">{event.type}</span>
                                       <span className="font-mono text-[10px] text-slate-500">
                                         {new Date(event.date).toLocaleString('pt-BR')}
                                       </span>
                                    </div>
                                    <p className="text-sm text-slate-400">{event.description}</p>
                                    {event.user && <div className="mt-2 text-[10px] font-medium text-slate-600">Por: {event.user}</div>}
                                 </div>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                 </div>
               </div>
             </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
