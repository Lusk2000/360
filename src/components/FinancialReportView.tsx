import React, { useMemo, useState } from 'react';
import { generateExecutiveReport } from '../utils/pdfGenerator';
import { getFixedExpensesTasks, parseFixedExpense } from '../utils/fixedExpenses';
import { Search, Download, ArrowUpCircle, Plus, DollarSign, TrendingUp, TrendingDown, Activity, FileText, PieChart, BarChart3, CreditCard, Edit3, Trash2, CalendarIcon, CheckCircle, X } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';
import { FinancialDisplay, DisplayModeToggle } from './FinancialDisplay';

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

export default function FinancialReportView({ transactions, tasks = [], fetchCollections, currentUserProfile, user, supabase, permissions, setEditingId, setFormData, setIsModalOpen, setItemToDelete, onDownload, financialDisplayMode = 'both', setFinancialDisplayMode }: any) {
  const formatVal = (val: number, base: number, mode?: string) => {
    if (financialDisplayMode === 'currency') return `R$ ${val.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
    const pct = base > 0 ? ((Math.abs(val) / base) * 100).toFixed(1) + '%' : '0.0%';
    if (financialDisplayMode === 'percentage') return pct;
    return `R$ ${val.toLocaleString('pt-BR', {minimumFractionDigits:2})} (${pct})`;
  };

  const handleDownloadFinance = () => {
    generateExecutiveReport({
      title: 'Relatório Financeiro Executivo',
      period: 'Todos os registros',
      cards: [
        { label: 'Receita Total', value: formatVal(totalIncome, totalIncome, financialDisplayMode), color: [34, 197, 94] },
        { label: 'Despesas', value: formatVal(totalExpense, totalIncome, financialDisplayMode), color: [239, 68, 68] },
        { label: 'Lucro Líquido', value: formatVal(totalProfit, totalIncome, financialDisplayMode), color: [37, 99, 235] }
      ],
      mainTable: {
        title: 'Resumo Detalhado (Entradas e Saídas)',
        head: [['Indicador', 'Entradas (Receitas)', 'Saídas (Despesas)']],
        body: [
          ['Quantidade de Registros', incomeCount.toString(), expenseCount.toString()],
          ['Valor Total', formatVal(totalIncome, totalIncome, financialDisplayMode), formatVal(totalExpense, totalIncome, financialDisplayMode)],
          ['Ticket Médio', formatVal(avgIncome, totalIncome, financialDisplayMode), formatVal(avgExpense, totalExpense, financialDisplayMode)]
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
            formatVal(Number(t.valor), t.type === 'income' ? totalIncome : totalExpense, financialDisplayMode),
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
      summary: `A operação apresentou um total de ${transactions.length} registros no período selecionado. O lucro líquido, que é o valor final descontadas todas as despesas da receita bruta, ficou em ${formatVal(totalProfit, totalIncome, financialDisplayMode)}, resultando em uma margem de rentabilidade de ${profitMargin}%.`,
      filename: `relatorio_financeiro_executivo_${new Date().toISOString().split('T')[0]}.pdf`
    });
  };

  const [activeTab, setActiveTab] = useState('resumo');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
  const [isFixedExpenseModalOpen, setIsFixedExpenseModalOpen] = useState(false);
  const [fixedExpenseForm, setFixedExpenseForm] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fixedExpensesTasks = useMemo(() => getFixedExpensesTasks(tasks).map(parseFixedExpense).filter(Boolean), [tasks]);
  
  
  const handleDownloadGastosFixos = () => {
    const tableData = fixedExpensesTasks.map((ft: any) => [
      ft.name || ft.titulo?.replace('[GASTO_FIXO] ', ''),
      ft.category,
      ft.recurrence,
      'Dia ' + ft.day,
      formatVal(Number(ft.value), totalExpense, financialDisplayMode),
      ft.active ? 'Ativo' : 'Inativo'
    ]);
    
    generateExecutiveReport({
      title: 'Relatório de Gastos Fixos (Despesas Recorrentes)',
      period: 'Posição Atual',
      cards: [
        { label: 'Total de Gastos Fixos', value: fixedExpensesTasks.length, color: [37, 99, 235] },
        { label: 'Ativos', value: fixedExpensesTasks.filter((f: any) => f.active).length, color: [34, 197, 94] },
        { label: 'Valor Total Estimado (Mês)', value: formatVal(fixedExpensesTasks.filter((f: any) => f.active).reduce((acc: number, f: any, financialDisplayMode) => acc + Number(f.value), 0), totalExpense), color: [239, 68, 68] }
      ],
      mainTable: {
        title: 'Lista de Gastos Fixos',
        head: [['Despesa', 'Categoria', 'Recorrência', 'Vencimento', 'Valor', 'Status']],
        body: tableData
      },
      filename: `gastos_fixos_${new Date().toISOString().split('T')[0]}.pdf`
    });
  };

  const handleSaveFixedExpense = async (e: any) => {
    e.preventDefault();
    if (!fixedExpenseForm.name || !fixedExpenseForm.value || !fixedExpenseForm.day) return;
    
    setIsProcessing(true);
    const isNew = !fixedExpenseForm.id;
    const payload: any = {
      titulo: '[GASTO_FIXO] ' + fixedExpenseForm.name,
      descricao: JSON.stringify({
        name: fixedExpenseForm.name,
        value: fixedExpenseForm.value,
        category: fixedExpenseForm.category,
        day: fixedExpenseForm.day,
        recurrence: fixedExpenseForm.recurrence,
        paymentMethod: fixedExpenseForm.paymentMethod,
        obs: fixedExpenseForm.obs
      }),
      status: fixedExpenseForm.active === false ? 'done' : 'pending',
      is_recurring: true,
      updated_at: new Date().toISOString()
    };
    
    if (isNew) {
      payload.created_at = new Date().toISOString();
      if (user?.id) payload.user_id = user.id;
    }
    
    try {
      if (isNew) {
        const { error } = await supabase.from('tasks').insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tasks').update(payload).eq('id', fixedExpenseForm.id);
        if (error) throw error;
      }
    } catch (err: any) {
      if(err?.message?.includes('Failed to fetch')) { console.warn('Erro ao salvar:', err); } else { console.error('Erro ao salvar:', err); }
      alert('Erro ao salvar Gasto Fixo: ' + err.message);
      setIsProcessing(false);
      return;
    }
    
    setIsProcessing(false);
    setIsFixedExpenseModalOpen(false);
    fetchCollections('tasks');
  };


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

  const StatCard = ({ title, value, numValue, baseValue, icon, trend, desc, colorClass, displayMode, tooltip }: any) => (
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
        {numValue !== undefined ? (
          <FinancialDisplay value={numValue} base={baseValue} mode={displayMode || 'both'} className={`mt-1 ${colorClass.value || 'text-white'}`} currencyClassName="text-2xl font-black" tooltip={tooltip} />
        ) : (
          <h4 className={`text-2xl font-black mt-1 ${colorClass.value || 'text-white'}`}>{value}</h4>
        )}
        {desc && <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{desc}</p>}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter">Relatório Executivo</h2>
          <p className="text-sm text-slate-400">Visão financeira estratégica e resultados operacionais</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {permissions.canExportReport('finance') && (
            <Button onClick={onDownload} variant="secondary" className="flex-1 sm:flex-none px-4 py-2.5 text-[11px] uppercase tracking-widest gap-2">
              <Download size={14} /> PDF
            </Button>
          )}
          {permissions.canEdit('financial_control') && (
            <Button onClick={() => { setEditingId(null); setFormData({ type: 'income', status: 'pending', data: new Date().toISOString().split('T')[0], forma_pagamento: 'PIX', categoria: 'Serviços' }); setIsModalOpen(true); }} className="flex-1 sm:flex-none py-2.5 px-4 text-[11px] uppercase tracking-widest gap-2">
              <Plus size={14} /> Novo Lançamento
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-2">
        {['resumo', 'movimentacoes', 'graficos', 'analise', 'gastos_fixos'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 sm:flex-none px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
          >
            {tab === 'resumo' && 'Visão Geral'}
            {tab === 'movimentacoes' && 'Lançamentos'}
            {tab === 'graficos' && 'Gráficos'}
            {tab === 'analise' && 'Análise de IA'}
            {tab === 'gastos_fixos' && 'Gastos Fixos'}
          </button>
        ))}
      </div>

      {activeTab === 'resumo' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2"><DollarSign size={16} className="text-emerald-500" /> Resumo Executivo</h3>
              <DisplayModeToggle mode={financialDisplayMode} setMode={setFinancialDisplayMode} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Receita Total" numValue={totalIncome} baseValue={totalIncome} displayMode={financialDisplayMode} tooltip="100% da Receita Total" icon={<ArrowUpCircle size={20}/>} colorClass={{bg: 'bg-emerald-500/20', text: 'text-emerald-500', value: 'text-emerald-400'}} desc="Soma de todos os lançamentos do tipo Entrada." />
              <StatCard title="Despesas" numValue={totalExpense} baseValue={totalIncome} displayMode={financialDisplayMode} tooltip="% em relação à Receita Total" icon={<TrendingDown size={20}/>} colorClass={{bg: 'bg-red-500/20', text: 'text-red-500', value: 'text-red-400'}} desc="Soma de todos os lançamentos do tipo Saída." />
              <StatCard title="Lucro Líquido" numValue={totalProfit} baseValue={totalIncome} displayMode={financialDisplayMode} tooltip="Margem de Lucro (% da Receita)" icon={<Activity size={20}/>} colorClass={{bg: 'bg-indigo-500/20', text: 'text-indigo-500', value: 'text-indigo-400'}} desc="Receita Total - Despesas" />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Resumo das Entradas</h3>
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Quantidade de Receitas</span><span className="font-mono text-emerald-400 font-bold">{incomeCount}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Receita Média (Ticket Médio)</span><FinancialDisplay value={avgIncome} base={totalIncome} mode={financialDisplayMode} className="font-mono text-emerald-400 font-bold" /></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Maior Receita</span><FinancialDisplay value={maxIncome} base={totalIncome} mode={financialDisplayMode} className="font-mono text-emerald-400 font-bold" /></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Menor Receita</span><FinancialDisplay value={minIncome} base={totalIncome} mode={financialDisplayMode} className="font-mono text-emerald-400 font-bold" /></div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Resumo das Saídas</h3>
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Quantidade de Despesas</span><span className="font-mono text-red-400 font-bold">{expenseCount}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Despesa Média</span><FinancialDisplay value={avgExpense} base={totalExpense} mode={financialDisplayMode} className="font-mono text-red-400 font-bold" /></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Maior Despesa</span><FinancialDisplay value={maxExpense} base={totalExpense} mode={financialDisplayMode} className="font-mono text-red-400 font-bold" /></div>
                <div className="flex justify-between items-center"><span className="text-slate-400 text-sm">Menor Despesa</span><FinancialDisplay value={minExpense} base={totalExpense} mode={financialDisplayMode} className="font-mono text-red-400 font-bold" /></div>
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
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <FileText size={16} className="text-emerald-500" /> Movimentação Financeira Detalhada
              </h3>
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full sm:w-auto items-center">
                <div className="flex bg-slate-950/50 rounded-lg p-1 border border-slate-800 w-full sm:w-auto">
                  <button onClick={() => setTransactionTypeFilter('all')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${transactionTypeFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    Todas
                  </button>
                  <button onClick={() => setTransactionTypeFilter('income')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${transactionTypeFilter === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-emerald-500/50'}`}>
                    Entradas
                  </button>
                  <button onClick={() => setTransactionTypeFilter('expense')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${transactionTypeFilter === 'expense' ? 'bg-red-500/20 text-red-400' : 'text-slate-500 hover:text-red-500/50'}`}>
                    Saídas
                  </button>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Buscar movimentação..." 
                    value={transactionSearch}
                    onChange={(e) => setTransactionSearch(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto w-full max-w-full">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-800">
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Data</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cliente/Fornecedor</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Forma Pgto</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Valor</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {transactions.filter((t: any) => {
                    if (transactionTypeFilter !== 'all' && t.type !== transactionTypeFilter) return false;
                    if (!transactionSearch) return true;
                    const s = transactionSearch.toLowerCase();
                    return (t.cliente?.toLowerCase().includes(s) || t.descricao?.toLowerCase().includes(s) || t.categoria?.toLowerCase().includes(s));
                  }).sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-slate-400 font-mono text-xs">{new Date(t.data).toLocaleDateString('pt-BR', {timeZone:'UTC'})}</td>
                      <td className="p-4 font-medium text-slate-200">{t.cliente || t.descricao || '--'}</td>
                      <td className="p-4 text-slate-400 text-xs">{t.forma_pagamento || 'PIX'}</td>
                      <td className={`p-4 text-right font-mono font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.type === 'income' ? '+' : '-'} <FinancialDisplay value={Number(t.valor)} base={t.type === 'income' ? totalIncome : totalExpense} mode={financialDisplayMode} className="inline-flex" />
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
                      <td colSpan={5} className="p-8 text-center text-slate-500 italic">Nenhuma movimentação registrada no período.</td>
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
                    <Tooltip formatter={(value: any) => { const percentage = totalIncome > 0 ? (value / totalIncome) * 100 : 0; return `R$ ${value.toLocaleString("pt-BR", {minimumFractionDigits:2})} (${percentage.toFixed(2)}%)`; }} contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#f8fafc" }} />
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
                    <Tooltip formatter={(value: any) => { const percentage = totalExpense > 0 ? (value / totalExpense) * 100 : 0; return `R$ ${value.toLocaleString("pt-BR", {minimumFractionDigits:2})} (${percentage.toFixed(2)}%)`; }} contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#f8fafc" }} />
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
                      formatter={(value: any, name: any) => { let percentage = 0; if (name === "Entradas") { percentage = totalIncome > 0 ? (value / totalIncome) * 100 : 0; } else if (name === "Saídas") { percentage = totalExpense > 0 ? (value / totalExpense) * 100 : 0; } return `R$ ${value.toLocaleString("pt-BR", {minimumFractionDigits:2})} (${percentage.toFixed(2)}%)`; }}
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
                  <strong className="text-emerald-400">Faturamento:</strong> A empresa processou um faturamento de <strong><FinancialDisplay value={totalIncome} base={totalIncome} mode={financialDisplayMode} className="inline-flex" tooltip="100% da Receita Total" /></strong> ao longo de {incomeCount} transações, resultando num ticket médio de <strong><FinancialDisplay value={avgIncome} base={totalIncome} mode={financialDisplayMode} className="inline-flex" tooltip="% em relação à Receita Total" /></strong> por entrada.
                </li>
                <li>
                  <strong className="text-red-400">Custos Operacionais:</strong> As saídas totalizaram <strong><FinancialDisplay value={totalExpense} base={totalIncome} mode={financialDisplayMode} className="inline-flex" tooltip="% em relação à Receita Total" /></strong>.
                </li>
                <li>
                  <strong className="text-blue-400">Resultado Líquido:</strong> O lucro líquido alcançado no período avaliado foi de <strong><FinancialDisplay value={totalProfit} base={totalIncome} mode={financialDisplayMode} className="inline-flex" tooltip="Margem de Lucro (% da Receita)" /></strong>.
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

      {activeTab === 'gastos_fixos' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black text-white tracking-tighter">Despesas Recorrentes</h3>
              <p className="text-sm text-slate-400">Gerencie seus gastos fixos e evite esquecimentos.</p>
            </div>
            
            <button onClick={handleDownloadGastosFixos} className="bg-slate-800 text-slate-300 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700 flex items-center gap-2">
              <Download size={14} /> PDF
            </button>
            {permissions?.canEdit('financial_control') && (
            <button onClick={() => { setFixedExpenseForm({ recurrence: 'Mensal', category: 'Operacional', paymentMethod: 'PIX', active: true }); setIsFixedExpenseModalOpen(true); }} className="bg-emerald-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2">

              <Plus size={14} /> Adicionar
            </button>
            )}
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto w-full max-w-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800">
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Despesa</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Recorrência</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Vencimento</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Valor</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">Status</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {fixedExpensesTasks.map((ft: any) => (
                    <tr key={ft.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm">{ft.name || ft.titulo?.replace('[GASTO_FIXO] ', '')}</div>
                        <div className="text-xs text-slate-500 mt-1">{ft.category} • {ft.paymentMethod}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 font-medium">{ft.recurrence}</td>
                      <td className="px-6 py-4 text-sm text-slate-300 font-mono">Dia {ft.day}</td>
                      <td className="px-6 py-4 text-sm text-red-400 font-black font-mono text-right">
                        <FinancialDisplay value={Number(ft.value)} base={totalExpense} mode={financialDisplayMode} className="inline-flex" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-widest font-bold ${ft.active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                          {ft.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => {
                          setFixedExpenseForm({ ...ft, name: ft.name || ft.titulo?.replace('[GASTO_FIXO] ', '') });
                          setIsFixedExpenseModalOpen(true);
                        }} className="p-2 text-slate-500 hover:text-emerald-400 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-lg shadow-sm transition-all" title="Editar">
                          <Edit3 size={14} />
                        </button>
                        {permissions?.canDelete('financial_control') && (
                          <button onClick={() => {
                            setItemToDelete({ id: ft.id, type: 'tasks', collName: 'tasks' });
                          }} className="p-2 text-slate-500 hover:text-red-400 bg-slate-900 border border-slate-800 hover:border-red-500/50 rounded-lg shadow-sm transition-all" title="Excluir">
                          <Trash2 size={14} />
                        </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {fixedExpensesTasks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <p className="text-slate-500 text-sm italic mb-2">Nenhum gasto fixo cadastrado.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}


      {isFixedExpenseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 flex-shrink-0">
              <h3 className="text-xl font-black text-white tracking-tighter">
                {fixedExpenseForm.id ? 'Editar Gasto Fixo' : 'Novo Gasto Fixo'}
              </h3>
              <button onClick={() => setIsFixedExpenseModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome da Despesa</label>
                <input type="text" required value={fixedExpenseForm.name || ''} onChange={(e) => setFixedExpenseForm({...fixedExpenseForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" placeholder="Ex: Aluguel" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Categoria</label>
                  <select value={fixedExpenseForm.category || 'Operacional'} onChange={(e) => setFixedExpenseForm({...fixedExpenseForm, category: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50">
                    <option value="Operacional">Operacional</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Ferramentas">Ferramentas</option>
                    <option value="Impostos">Impostos</option>
                    <option value="Pessoal">Pessoal</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Valor (R$)</label>
                  <input type="number" step="0.01" required value={fixedExpenseForm.value || ''} onChange={(e) => setFixedExpenseForm({...fixedExpenseForm, value: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dia do Vencimento</label>
                  <input type="number" min="1" max="31" required value={fixedExpenseForm.day || ''} onChange={(e) => setFixedExpenseForm({...fixedExpenseForm, day: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" placeholder="Ex: 15" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recorrência</label>
                  <select value={fixedExpenseForm.recurrence || 'Mensal'} onChange={(e) => setFixedExpenseForm({...fixedExpenseForm, recurrence: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50">
                    <option value="Mensal">Mensal</option>
                    <option value="Quinzenal">Quinzenal</option>
                    <option value="Semanal">Semanal</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Forma de Pagamento</label>
                <select value={fixedExpenseForm.paymentMethod || 'PIX'} onChange={(e) => setFixedExpenseForm({...fixedExpenseForm, paymentMethod: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50">
                  <option value="PIX">PIX</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Transferência">Transferência</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Observações</label>
                <textarea value={fixedExpenseForm.obs || ''} onChange={(e) => setFixedExpenseForm({...fixedExpenseForm, obs: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 h-20 resize-none" />
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <input type="checkbox" id="fe_active" checked={fixedExpenseForm.active !== false} onChange={(e) => setFixedExpenseForm({...fixedExpenseForm, active: e.target.checked})} className="w-4 h-4 accent-emerald-500 rounded bg-slate-800 border-slate-700" />
                <label htmlFor="fe_active" className="text-sm font-bold text-slate-300">Gasto Fixo Ativo (Gerar lançamentos)</label>
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex gap-3 flex-shrink-0 bg-slate-900">
              <button disabled={isProcessing} onClick={() => setIsFixedExpenseModalOpen(false)} className="flex-1 py-3 text-slate-400 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button disabled={isProcessing} onClick={handleSaveFixedExpense} className="flex-1 py-3 text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                {isProcessing ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
