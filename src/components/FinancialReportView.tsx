import React, { useMemo, useState } from 'react';
import { generateExecutiveReport } from '../utils/pdfGenerator';
import { Download, ArrowUpCircle, Plus, DollarSign, TrendingUp, TrendingDown, Activity, FileText, PieChart, BarChart3, CreditCard, Edit3, Trash2 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';

const Card = ({ children, className = "" }: any) => (
  <div className={`bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick = () => {}, variant = "primary", className = "", type = "button", disabled = false }: any) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-emerald-500 text-slate-950 hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] shadow-lg shadow-emerald-500/20",
    secondary: "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 hover:border-slate-600",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  );
};

export default function FinancialReportView({ transactions, permissions, setEditingId, setFormData, setIsModalOpen, setItemToDelete, onDownload }: any) {

  const handleDownloadFinance = () => {
    generateExecutiveReport({
      title: 'Relatório Financeiro Executivo',
      period: 'Todos os registros',
      cards: [
        { label: 'Receita Total', value: `R$ ${totalIncome.toLocaleString('pt-BR', {minimumFractionDigits:2})}`, color: [34, 197, 94] },
        { label: 'Despesas', value: `R$ ${totalExpense.toLocaleString('pt-BR', {minimumFractionDigits:2})}`, color: [239, 68, 68] },
        { label: 'Lucro Líquido', value: `R$ ${totalProfit.toLocaleString('pt-BR', {minimumFractionDigits:2})}`, color: [37, 99, 235] }
      ],
      mainTable: {
        title: 'Resumo Detalhado (Entradas e Saídas)',
        head: [['Indicador', 'Entradas (Receitas)', 'Saídas (Despesas)']],
        body: [
          ['Quantidade de Registros', incomeCount.toString(), expenseCount.toString()],
          ['Valor Total', `R$ ${totalIncome.toLocaleString('pt-BR', {minimumFractionDigits:2})}`, `R$ ${totalExpense.toLocaleString('pt-BR', {minimumFractionDigits:2})}`],
          ['Ticket Médio', `R$ ${avgIncome.toLocaleString('pt-BR', {minimumFractionDigits:2})}`, `R$ ${avgExpense.toLocaleString('pt-BR', {minimumFractionDigits:2})}`]
        ]
      },
      additionalTables: [
        {
          title: 'Últimas Transações',
          head: [['Data', 'Descrição / Cliente', 'Categoria', 'Conta', 'Valor', 'Status']],
          body: transactions.slice(0, 30).map((t: any) => [
            new Date(t.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}),
            t.cliente || t.descricao || '-',
            t.categoria || '-',
            t.conta || 'Conta Principal',
            `R$ ${Number(t.valor).toLocaleString('pt-BR', {minimumFractionDigits:2})}`,
            t.status === 'paid' ? 'Pago' : t.status === 'pending' ? 'Pendente' : 'Cancelado'
          ]),
          didParseCell: function(data: any) {
            if (data.section === 'body' && data.column.index === 4) {
              const originalTransaction = transactions[data.row.index];
              if (originalTransaction && originalTransaction.type === 'income') {
                data.cell.styles.textColor = [34, 197, 94];
              } else if (originalTransaction && originalTransaction.type === 'expense') {
                data.cell.styles.textColor = [239, 68, 68];
              }
            }
          }
        }
      ],
      summary: `A operação apresentou um total de ${transactions.length} registros no período selecionado. O lucro líquido, que é o valor final descontadas todas as despesas da receita bruta, ficou em R$ ${totalProfit.toLocaleString('pt-BR', {minimumFractionDigits:2})}, resultando em uma margem de rentabilidade de ${profitMargin}%.`,
      filename: `relatorio_financeiro_executivo_${new Date().toISOString().split('T')[0]}.pdf`
    });
  };

  const [activeTab, setActiveTab] = useState('resumo');

  const incomeTransactions = transactions.filter((t: any) => t.type === 'income');
  const expenseTransactions = transactions.filter((t: any) => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce((acc: any, t: any) => acc + Number(t.valor), 0);
  const totalExpense = expenseTransactions.reduce((acc: any, t: any) => acc + Number(t.valor), 0);
  const totalProfit = totalIncome - totalExpense;

  const incomeCount = incomeTransactions.length;
  const expenseCount = expenseTransactions.length;

  const avgIncome = incomeCount > 0 ? totalIncome / incomeCount : 0;
  const avgExpense = expenseCount > 0 ? totalExpense / expenseCount : 0;

  const maxIncome = incomeCount > 0 ? Math.max(...incomeTransactions.map((t: any) => Number(t.valor))) : 0;
  const minIncome = incomeCount > 0 ? Math.min(...incomeTransactions.map((t: any) => Number(t.valor))) : 0;

  const maxExpense = expenseCount > 0 ? Math.max(...expenseTransactions.map((t: any) => Number(t.valor))) : 0;
  const minExpense = expenseCount > 0 ? Math.min(...expenseTransactions.map((t: any) => Number(t.valor))) : 0;

  const profitMargin = totalIncome > 0 ? ((totalProfit / totalIncome) * 100).toFixed(1) : '0.0';

  const incomeByCategory = incomeTransactions.reduce((acc: any, t: any) => {
    const cat = t.categoria || 'Geral';
    acc[cat] = (acc[cat] || 0) + Number(t.valor);
    return acc;
  }, {});

  const expenseByCategory = expenseTransactions.reduce((acc: any, t: any) => {
    const cat = t.categoria || 'Geral';
    acc[cat] = (acc[cat] || 0) + Number(t.valor);
    return acc;
  }, {});

  const PIE_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

  const incomePieData = Object.keys(incomeByCategory).map(key => ({ name: key, value: incomeByCategory[key] }));
  const expensePieData = Object.keys(expenseByCategory).map(key => ({ name: key, value: expenseByCategory[key] }));

  const dailyData = useMemo(() => {
    const days: any = {};
    [...incomeTransactions, ...expenseTransactions].forEach(t => {
      const date = t.data ? new Date(t.data).toISOString().split('T')[0] : 'Desconhecido';
      if (!days[date]) days[date] = { date, entradas: 0, saidas: 0, saldo: 0 };
      if (t.type === 'income') days[date].entradas += Number(t.valor);
      if (t.type === 'expense') days[date].saidas += Number(t.valor);
    });
    
    const sortedDays = Object.values(days).sort((a: any, b: any) => a.date.localeCompare(b.date));
    let currentBalance = 0;
    return sortedDays.map((d: any) => {
      currentBalance += (d.entradas - d.saidas);
      d.saldo = currentBalance;
      return d;
    });
  }, [incomeTransactions, expenseTransactions]);

  const StatCard = ({ title, value, icon, trend, desc, colorClass }: any) => (
    <Card className="p-5 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass.bg} ${colorClass.text}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">{title}</p>
        <h4 className={`text-2xl font-black mt-1 ${colorClass.value || 'text-white'}`}>{value}</h4>
        {desc && <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{desc}</p>}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter">Relatório Executivo</h2>
          <p className="text-sm text-slate-400">Visão financeira estratégica e resultados operacionais</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button onClick={onDownload} variant="secondary" className="flex-1 sm:flex-none px-4 py-2.5 text-[11px] uppercase tracking-widest gap-2">
            <Download size={14} /> PDF
          </Button>
          {permissions.canEdit('financial_control') && (
            <Button onClick={() => { setEditingId(null); setFormData({ type: 'income', status: 'pending', data: new Date().toISOString().split('T')[0], forma_pagamento: 'PIX', categoria: 'Serviços' }); setIsModalOpen(true); }} className="flex-1 sm:flex-none py-2.5 px-4 text-[11px] uppercase tracking-widest gap-2">
              <Plus size={14} /> Novo Lançamento
            </Button>
          )}
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {['resumo', 'movimentacoes', 'graficos', 'analise'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
          >
            {tab === 'resumo' && 'Visão Geral'}
            {tab === 'movimentacoes' && 'Lançamentos'}
            {tab === 'graficos' && 'Gráficos'}
            {tab === 'analise' && 'Análise de IA'}
          </button>
        ))}
      </div>

      {activeTab === 'resumo' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2"><DollarSign size={16} className="text-emerald-500" /> Resumo Executivo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Receita Total" value={`R$ ${totalIncome.toLocaleString('pt-BR', {minimumFractionDigits:2})}`} icon={<ArrowUpCircle size={20}/>} colorClass={{bg: 'bg-emerald-500/20', text: 'text-emerald-500', value: 'text-emerald-400'}} desc="Soma de todos os lançamentos do tipo Entrada." />
              <StatCard title="Despesas" value={`R$ ${totalExpense.toLocaleString('pt-BR', {minimumFractionDigits:2})}`} icon={<TrendingDown size={20}/>} colorClass={{bg: 'bg-red-500/20', text: 'text-red-500', value: 'text-red-400'}} desc="Soma de todos os lançamentos do tipo Saída." />
              <StatCard title="Lucro Líquido" value={`R$ ${totalProfit.toLocaleString('pt-BR', {minimumFractionDigits:2})}`} icon={<Activity size={20}/>} colorClass={{bg: 'bg-indigo-500/20', text: 'text-indigo-500', value: 'text-indigo-400'}} desc="Receita Total - Despesas" />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Resumo das Entradas</h3>
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Quantidade de Receitas</span><span className="font-mono text-emerald-400 font-bold">{incomeCount}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Receita Média (Ticket Médio)</span><span className="font-mono text-emerald-400 font-bold">R$ {avgIncome.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Maior Receita</span><span className="font-mono text-emerald-400 font-bold">R$ {maxIncome.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Menor Receita</span><span className="font-mono text-emerald-400 font-bold">R$ {minIncome.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Resumo das Saídas</h3>
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Quantidade de Despesas</span><span className="font-mono text-red-400 font-bold">{expenseCount}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Despesa Média</span><span className="font-mono text-red-400 font-bold">R$ {avgExpense.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Maior Despesa</span><span className="font-mono text-red-400 font-bold">R$ {maxExpense.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Menor Despesa</span><span className="font-mono text-red-400 font-bold">R$ {minExpense.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Indicadores Financeiros</h3>
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Margem de Lucro</span><span className="font-mono text-purple-400 font-bold">{profitMargin}%</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">ROI (Retorno sobre Investimento)</span><span className="font-mono text-blue-400 font-bold">{totalExpense > 0 ? (((totalIncome - totalExpense) / totalExpense) * 100).toFixed(1) : 0}%</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Custo sobre Faturamento</span><span className="font-mono text-orange-400 font-bold">{totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : 0}%</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Fluxo de Caixa</span><span className={`font-mono font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{totalProfit >= 0 ? 'Positivo' : 'Negativo'}</span></div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'movimentacoes' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="p-0 overflow-hidden border border-slate-800">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2"><FileText size={16} className="text-emerald-500" /> Movimentação Financeira Detalhada</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-800">
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Data</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Tipo</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cliente/Fornecedor</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Categoria</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Forma Pgto</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Valor</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Status</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {transactions.sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-slate-400 font-mono text-xs">{new Date(t.data).toLocaleDateString('pt-BR', {timeZone:'UTC'})}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {t.type === 'income' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-200">{t.cliente || t.descricao || '--'}</td>
                      <td className="p-4 text-slate-400 text-xs">{t.categoria || 'Geral'}</td>
                      <td className="p-4 text-slate-400 text-xs">{t.forma_pagamento || 'PIX'}</td>
                      <td className={`p-4 text-right font-mono font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.type === 'income' ? '+' : '-'} R$ {Number(t.valor).toLocaleString('pt-BR', {minimumFractionDigits:2})}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${t.type === 'expense' ? 'bg-red-500/10 text-red-400' : (t.status === 'received' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400')}`}>
                          {t.type === 'expense' ? 'Registrada' : (t.status === 'received' ? 'Recebido' : 'Pendente')}
                        </span>
                      </td>
                      <td className="p-4 flex justify-center gap-2">
                        {permissions?.canEdit('financial_control') && (
                          <button onClick={() => {setFormData(t); setEditingId(t.id); setIsModalOpen(true);}} className="p-2 text-slate-500 hover:text-emerald-500 transition-colors bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-lg shadow-sm" title="Editar">
                            <Edit3 size={16} />
                          </button>
                        )}
                        {permissions?.canDelete('financial_control') && (
                          <button onClick={() => setItemToDelete({ id: t.id, type: 'transactions' })} className="p-2 text-slate-500 hover:text-red-500 transition-colors bg-slate-900 border border-slate-800 hover:border-red-500/50 rounded-lg shadow-sm" title="Excluir">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 italic">Nenhuma movimentação registrada no período.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'graficos' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2"><PieChart size={16} className="text-emerald-500" /> Receitas por Categoria</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={incomePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {incomePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits:2})}`} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2"><PieChart size={16} className="text-red-500" /> Despesas por Categoria</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={expensePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {expensePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits:2})}`} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6 lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2"><BarChart3 size={16} className="text-indigo-500" /> Fluxo de Caixa (Entradas x Saídas)</h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickFormatter={(val) => val.split('-').reverse().slice(0,2).join('/')} />
                    <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `R$${val > 1000 ? (val/1000).toFixed(1)+'k' : val}`} />
                    <Tooltip 
                      formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits:2})}`} 
                      labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="entradas" name="Entradas" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="saidas" name="Saídas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'analise' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="p-8 border border-purple-500/20 bg-purple-950/10">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Activity size={16} /> Análise do Período</h3>
            
            <div className="space-y-6 text-slate-300 leading-relaxed text-sm">
              <p>Com base nas movimentações financeiras processadas, apresentamos o seguinte parecer executivo:</p>
              
              <ul className="space-y-4 pl-4 border-l-2 border-slate-800">
                <li>
                  <strong className="text-emerald-400">Faturamento:</strong> A empresa processou um faturamento de <strong>R$ {totalIncome.toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong> ao longo de {incomeCount} transações, resultando num ticket médio de <strong>R$ {avgIncome.toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong> por entrada.
                </li>
                <li>
                  <strong className="text-red-400">Custos Operacionais:</strong> As saídas totalizaram <strong>R$ {totalExpense.toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong>. As despesas representaram <strong>{totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : 0}%</strong> das receitas no período.
                </li>
                <li>
                  <strong className="text-blue-400">Resultado Líquido:</strong> O lucro líquido alcançado no período avaliado foi de <strong>R$ {totalProfit.toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong>, perfazendo uma margem de rentabilidade de <strong>{profitMargin}%</strong>.
                </li>
                {Object.keys(incomeByCategory).length > 0 && (
                  <li>
                    <strong className="text-indigo-400">Ponto de Força:</strong> A categoria de entrada com maior volume financeiro foi <strong>{Object.entries(incomeByCategory).sort((a:any, b:any) => b[1] - a[1])[0][0]}</strong>.
                  </li>
                )}
                {Object.keys(expenseByCategory).length > 0 && (
                  <li>
                    <strong className="text-orange-400">Ponto de Atenção:</strong> A maior fonte de custos da operação está categorizada em <strong>{Object.entries(expenseByCategory).sort((a:any, b:any) => b[1] - a[1])[0][0]}</strong>.
                  </li>
                )}
              </ul>
              
              <div className={`mt-8 p-4 rounded-xl border ${totalProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
                <strong>Diagnóstico do Fluxo de Caixa:</strong> {totalProfit >= 0 ? 'O fluxo de caixa permaneceu positivo durante o período. A operação está saudável e gerando capital excedente para reinvestimento ou distribuição de lucros.' : 'O fluxo de caixa apresentou saldo negativo no período. Recomenda-se revisão imediata dos custos operacionais e adoção de estratégias para o aumento acelerado de receita.'}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
