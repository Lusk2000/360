import { CRMView } from './components/CRMView';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { generateExecutiveReport, ReportCard, ReportTable } from './utils/pdfGenerator';
import { syncFixedExpenses, getPendingFixedExpensesNotifications } from './utils/fixedExpenses';
import { 
  Users, Briefcase, ArrowUpCircle, 
  ArrowDownCircle, DollarSign, Plus, Trash2, Edit3, 
  CheckCircle, Clock, PieChart, Menu, X, Eye, EyeOff,
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Check, Flag, User, Lock, ShieldCheck, AlertCircle, LogOut, 
  ChevronsUpDown, CheckSquare, ListTodo, FileDown, BookOpen, Search, Wallet, TrendingUp, Building2, PiggyBank, Shield
, RefreshCw, FileText, BarChart2, Download, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FinancialReportView from './components/FinancialReportView';
import { FinancialDisplay, DisplayModeToggle } from './components/FinancialDisplay';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { supabase } from './lib/supabase';

export const getBRTDate = (date: Date | string | number = new Date()) => {
  return new Date(new Date(date).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
};

export const getBRTDateString = (date: Date | string | number = new Date()) => {
  const brtDate = getBRTDate(date);
  const yyyy = brtDate.getFullYear();
  const mm = String(brtDate.getMonth() + 1).padStart(2, '0');
  const dd = String(brtDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};


export const formatVal = (val: number, base: number, mode: 'both' | 'currency' | 'percentage') => {
  if (mode === 'currency') return `R$ ${val.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
  const pct = base > 0 ? ((Math.abs(val) / base) * 100).toFixed(1) + '%' : '0.0%';
  if (mode === 'percentage') return pct;
  return `R$ ${val.toLocaleString('pt-BR', {minimumFractionDigits:2})} (${pct})`;
};

const FERIADOS_2026 = [
  { data: '2026-01-01', titulo: 'Ano Novo', tipo: 'feriado' },
  { data: '2026-02-16', titulo: 'Carnaval', tipo: 'feriado' },
  { data: '2026-02-17', titulo: 'Carnaval', tipo: 'feriado' },
  { data: '2026-04-03', titulo: 'Sexta-feira Santa', tipo: 'feriado' },
  { data: '2026-04-21', titulo: 'Tiradentes', tipo: 'feriado' },
  { data: '2026-05-01', titulo: 'Dia do Trabalho', tipo: 'feriado' },
  { data: '2026-06-04', titulo: 'Corpus Christi', tipo: 'feriado' },
  { data: '2026-09-07', titulo: 'Independência do Brasil', tipo: 'feriado' },
  { data: '2026-10-12', titulo: 'Nossa Sra. Aparecida', tipo: 'feriado' },
  { data: '2026-11-02', titulo: 'Finados', tipo: 'feriado' },
  { data: '2026-11-15', titulo: 'Proclamação da República', tipo: 'feriado' },
  { data: '2026-11-20', titulo: 'Dia da Consciência Negra', tipo: 'feriado' },
  { data: '2026-12-25', titulo: 'Natal', tipo: 'feriado' }
];

// --- Lista de Responsáveis e Permissões Detalhadas ---
const USER_PROFILES: any = {
  'lucas360admin@gmail.com': { 
    role: 'gestor', 
    label: 'Lucas',
    email: 'lucas360admin@gmail.com',
    permissions: { 
      allowed_tabs: ['clients', 'servicos', 'financial_control', 'agenda', 'tasks', 'ponto'],
      financial: 'view',
      reports: 'none',
      can_delete: true
    } 
  },
  'nubia360admin@gmail.com': { 
    role: 'administrator', 
    label: 'Nubia',
    email: 'nubia360admin@gmail.com',
    permissions: { 
      allowed_tabs: ['clients', 'servicos', 'financial_control', 'agenda', 'tasks', 'ponto'],
      financial: 'full',
      reports: 'full',
      can_delete: true
    } 
  },
  'vagnergestor360@gmail.com': { 
    role: 'administrator', 
    label: 'Vagner',
    email: 'vagnergestor360@gmail.com',
    permissions: { 
      allowed_tabs: ['clients', 'servicos', 'financial_control', 'agenda', 'tasks', 'ponto'],
      financial: 'full',
      reports: 'full',
      ponto_history_only: true,
      can_delete: true
    } 
  },
  'luan360@gmail.com': { 
    role: 'gestor', 
    label: 'Luan',
    email: 'luan360@gmail.com',
    permissions: { 
      allowed_tabs: ['clients', 'servicos', 'financial_control', 'agenda', 'tasks', 'ponto'],
      financial: 'view',
      reports: 'none',
      can_delete: true
    } 
  },
  'caetanomentor360@gmail.com': { 
    role: 'editor', 
    label: 'Caetano',
    email: 'caetanomentor360@gmail.com',
    permissions: { 
      allowed_tabs: ['clients', 'agenda', 'tasks', 'financial_control'],
      financial: 'view',
      reports: 'none',
      can_delete: true
    } 
  },
  'gabriel360@gmail.com': { 
    role: 'editor', 
    label: 'Gabriel',
    email: 'gabriel360@gmail.com',
    permissions: { 
      allowed_tabs: ['ponto', 'clients', 'agenda', 'tasks'],
      financial: 'none',
      reports: 'none',
      can_delete: true
    } 
  },
  'cassio360@gmail.com': { 
    role: 'editor', 
    label: 'Cassio',
    email: 'cassio360@gmail.com',
    permissions: { 
      allowed_tabs: ['clients', 'tasks'],
      financial: 'none',
      reports: 'none',
      can_delete: true
    } 
  }
};

const RESPONSAVEIS = Object.keys(USER_PROFILES).map(key => ({
  label: USER_PROFILES[key].label,
  value: USER_PROFILES[key].email
}));

// --- Utilitários de Formatação ---
const maskSocial = (value: string) => {
  let v = value.trim();
  if (v.length > 0 && !v.startsWith('@')) {
    return '@' + v;
  }
  return v;
};

const maskEmail = (value: string) => {
  return value.toLowerCase().replace(/\s/g, '');
};

const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value: string) => {
  const cleanValue = value.replace(/\D/g, "");
  let formatted = cleanValue;
  if (cleanValue.length > 0) {
    formatted = "(" + cleanValue;
    if (cleanValue.length > 2) {
      formatted = "(" + cleanValue.slice(0, 2) + ") " + cleanValue.slice(2);
      if (cleanValue.length > 3) {
        formatted = "(" + cleanValue.slice(0, 2) + ") " + cleanValue.slice(2, 3) + " " + cleanValue.slice(3);
        if (cleanValue.length > 7) {
          formatted = "(" + cleanValue.slice(0, 2) + ") " + cleanValue.slice(2, 3) + " " + cleanValue.slice(3, 7) + "-" + cleanValue.slice(7, 11);
        }
      }
    }
  }
  return formatted;
};

// --- Componentes Reutilizáveis ---
const Card = ({ children, className = "", ...props }: any) => (
  <div {...props} className={`bg-slate-900 border border-slate-800 rounded-[2.5rem] p-7 shadow-2xl transition-all duration-300 hover:border-slate-700/50 min-w-0 w-full ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick = () => {}, variant = "primary", className = "", type = "button", disabled = false }: any) => {
  const variants: any = {
    primary: "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    danger: "bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 active:scale-95",
    success: "bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20",
    outline: "border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200",
    ghost: "text-slate-500 hover:bg-slate-800/50 rounded-xl",
  };
  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, rightElement, ...props }: any) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>}
    <div className="relative">
      <input 
        {...props}
        className={`px-5 py-3 rounded-2xl border border-slate-800 bg-slate-950 text-slate-200 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700 w-full ${rightElement ? 'pr-12' : ''}`}
      />
      {rightElement && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-500 transition-colors cursor-pointer">
          {rightElement}
        </div>
      )}
    </div>
  </div>
);

const Select = ({ label, options, ...props }: any) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>}
    <div className="relative group">
      <select 
        {...props}
        className="w-full px-5 py-3 rounded-2xl border border-slate-800 bg-slate-950 text-slate-200 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all cursor-pointer appearance-none"
      >
        {options.map((opt: any, idx: number) => (
          <option key={`${opt.value}-${idx}`} value={opt.value} className="bg-slate-900">{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-emerald-500 transition-colors">
        <ChevronRight size={14} className="rotate-90" />
      </div>
    </div>
  </div>
);

const TextArea = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>}
    <textarea 
      {...props}
      className="px-5 py-3 rounded-2xl border border-slate-800 bg-slate-950 text-slate-200 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all min-h-[120px] placeholder:text-slate-700"
    />
  </div>
);

const navItems = [
  { id: 'ponto', label: 'Ponto Eletrônico', icon: Clock, protected: false },
  { id: 'clients', label: 'Cadastro CRM', icon: Users, protected: false },
  { id: 'agenda', label: 'Agenda', icon: CalendarIcon, protected: false },
  { id: 'tasks', label: 'Tarefas', icon: ListTodo, protected: false },
  { id: 'financial_control', label: 'Finanças', icon: DollarSign, protected: true },
];

// --- Sub-componentes do Dashboard e Visões ---

const AgendaView = ({ currentMonth, setCurrentMonth, permissions, calendarDays, appointments, setFormData, setEditingId, setIsModalOpen, setItemToDelete, isSystemAdmin, onDownload }: any) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(getBRTDateString());

  return (
    <div className="space-y-4 sm:space-y-8 w-full max-w-full min-w-0">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter">Cronograma</h2>
          <p className="text-slate-500 text-[8px] sm:text-[10px] uppercase font-black tracking-[0.2em] mt-1 sm:mt-2 flex items-center gap-2">
            <span className="w-2 h-0.5 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span> Painel de Agendamento Sincronizado
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-slate-950/50 p-1 sm:p-2 rounded-2xl border border-slate-800 shadow-xl w-full lg:w-auto overflow-x-auto backdrop-blur-md">
          <Button variant="ghost" className="px-2" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}><ChevronLeft size={18} /></Button>
          <span className="font-black text-white min-w-[120px] sm:min-w-[180px] text-center uppercase text-[10px] sm:text-xs tracking-[0.2em]">
            {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="ghost" className="px-2" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}><ChevronRight size={18} /></Button>
          <div className="hidden sm:block w-px h-6 bg-slate-800 mx-2"></div>
          {onDownload && (
            <Button onClick={onDownload} className="py-2.5 px-4 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all flex items-center gap-2">
              <Download size={14} /> Relatório PDF
            </Button>
          )}
          {permissions.canEdit('agenda') && (
            <Button onClick={() => { setEditingId(null); setFormData({ data: getBRTDateString() }); setIsModalOpen(true); }} className="py-2.5 px-5 ml-auto lg:ml-0 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all hover:scale-105 active:scale-95"><Plus size={16} /> Novo Agendamento</Button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Calendário Principal */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <div className="grid grid-cols-7 gap-1 sm:gap-4 px-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="py-2 text-center text-[8px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-4">
            {calendarDays.map((d: any, idx: number) => {
              const dayAppointments = appointments.filter((a: any) => a.data === d.date);
              const dayFeriados = FERIADOS_2026.filter(f => f.data === d.date);
              const allEvents = [...dayFeriados, ...dayAppointments];
              const isToday = d.date === getBRTDateString();
              const isSelected = selectedDay === d.date;
              
              return (
                <div 
                  key={d.date || `empty-${idx}`} 
                  onClick={() => d.date && setSelectedDay(d.date)}
                  className={`min-h-[80px] sm:min-h-[140px] p-2 sm:p-4 rounded-xl sm:rounded-[2.5rem] border transition-all duration-500 flex flex-col gap-1 sm:gap-4 cursor-pointer relative group/day ${
                    !d.day ? 'bg-transparent border-transparent' : 
                    isSelected ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/30' :
                    'bg-slate-950 border-slate-900 hover:border-slate-700 hover:bg-slate-900/50'
                  }`}
                >
                  {d.day && (
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] sm:text-sm font-black font-mono flex items-center justify-center rounded-lg transition-colors ${isToday ? 'text-purple-400' : isSelected ? 'text-purple-300' : 'text-slate-700 group-hover/day:text-slate-500'}`}>
                        {d.day.toString().padStart(2, '0')}
                      </span>
                      {isToday && <div className="w-1 sm:w-2 h-1 sm:h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.6)]"></div>}
                    </div>
                  )}
                  
                  {/* Lista de eventos simplificada para desk - agora mais visível */}
                  <div className="hidden sm:flex flex-col gap-1.5 overflow-y-auto max-h-[80px] scrollbar-hide">
                    {allEvents.slice(0, 3).map((evt: any, i: number) => (
                      <div key={evt.id || i} className={`text-[8px] p-2 rounded-xl border backdrop-blur-sm transition-all hover:translate-x-1 ${evt.tipo === 'feriado' ? 'bg-red-500/5 border-red-500/10 text-red-500/60' : 'bg-purple-500/5 border-purple-500/10 text-purple-400/80'}`}>
                        <span className="truncate block font-black uppercase text-[7px] tracking-tighter">{evt.titulo_evento || evt.titulo || evt.nome || 'Evento'}</span>
                      </div>
                    ))}
                    {allEvents.length > 3 && (
                      <div className="text-[7px] text-slate-700 font-black uppercase tracking-widest pl-2">+{allEvents.length - 3} mais</div>
                    )}
                  </div>

                  {/* Desktop Hover Indicator */}
                  {d.day && !isSelected && (
                    <div className="absolute inset-0 bg-purple-500/0 group-hover/day:bg-purple-500/[0.02] transition-all rounded-[2.5rem]"></div>
                  )}

                  {/* Mobile Indicator Tags */}
                  {allEvents.length > 0 && (
                    <div className="flex sm:hidden justify-center mt-auto">
                       <div className="flex gap-0.5">
                         {allEvents.slice(0, 3).map((_, i) => (
                           <div key={i} className="w-1 h-1 rounded-full bg-purple-500"></div>
                         ))}
                         {allEvents.length > 3 && <div className="w-1 h-1 rounded-full bg-slate-700"></div>}
                       </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detalhes do Dia - Visível em todos os tamanhos como Painel Lateral em Desktop */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <Card className="bg-slate-950/80 border-slate-800 p-8 rounded-[2.5rem] sticky top-8 backdrop-blur-xl shadow-2xl">
            <div className="flex justify-between items-start mb-8">
               <div className="space-y-1">
                 <h4 className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-3">
                   <CalendarIcon size={18} className="text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                   Cronograma do Dia
                 </h4>
                 <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Painel de Visualização Detalhada</p>
               </div>
               <span className="text-xs font-black text-purple-400 font-mono bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">{selectedDay ? selectedDay.split('-').reverse().join('/') : '--/--/----'}</span>
            </div>
            
            <div className="space-y-4">
               {selectedDay ? (() => {
                 const dayAppointments = appointments.filter((a: any) => a.data === selectedDay);
                 const dayFeriados = FERIADOS_2026.filter(f => f.data === selectedDay);
                 const allEvents = [...dayFeriados, ...dayAppointments];

                 if (allEvents.length === 0) return (
                   <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                     <Clock size={32} className="text-slate-700 mb-3" />
                     <p className="text-slate-600 text-[10px] uppercase font-black tracking-widest">Sem registros para hoje</p>
                   </div>
                 );

                 return allEvents.map((evt: any, i: number) => (
                   <div 
                     key={evt.id || i}
                     onClick={() => {
                       if (!evt.id) return;
                       if (!permissions.canEdit('agenda')) return;
                       setFormData(evt); 
                       setEditingId(evt.id); 
                       setIsModalOpen(true);
                     }}
                     className={`p-5 rounded-2xl border flex items-center justify-between group transition-all duration-300 ${
                      evt.tipo === 'feriado' 
                      ? 'bg-red-500/5 border-red-500/10 text-red-500/80' 
                      : 'bg-slate-900/50 border-slate-800 text-white hover:bg-slate-900 hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] cursor-pointer active:scale-95'
                     }`}
                   >
                     <div className="flex flex-col gap-2 min-w-0 flex-1">
                        <span className="text-base font-black text-white truncate">
                          {evt.titulo_evento || evt.titulo || evt.nome || 'Compromisso sem título'}
                        </span>
                        
                        {evt.localizacao && (
                          <span className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
                            📍 {evt.localizacao}
                          </span>
                        )}

                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                            🕒 {evt.data ? new Date(evt.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '--/--/----'} {evt.hora ? `• ${evt.hora}` : ''}
                          </span>
                          {evt.tipo === 'feriado' && <span className="text-[9px] font-black uppercase bg-red-500/20 text-red-500 px-2 py-0.5 rounded-md">Feriado</span>}
                          {evt.status && evt.tipo !== 'feriado' && (
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${evt.status === 'Confirmado' ? 'bg-emerald-500/20 text-emerald-500' : evt.status === 'Concluído' ? 'bg-blue-500/20 text-blue-500' : evt.status === 'Cancelado' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                              {evt.status}
                            </span>
                          )}
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                       {evt.id && permissions.canEdit('agenda') && <Edit3 size={16} className="text-slate-600 group-hover:text-purple-500 transition-colors" />}
                       {evt.id && permissions.canDelete('agenda') && (
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             setItemToDelete({ id: evt.id, collName: 'appointments' });
                           }}
                           className="p-2.5 bg-slate-950/50 text-slate-700 hover:text-red-500 rounded-xl border border-slate-800/10 hover:border-red-500/30 transition-all opacity-0 group-hover:opacity-100"
                         >
                           <Trash2 size={14} />
                         </button>
                       )}
                     </div>
                   </div>
                 ));
               })() : null}
            </div>

            {selectedDay && permissions.canEdit('agenda') && (
              <Button 
                onClick={() => { setEditingId(null); setFormData({ data: selectedDay }); setIsModalOpen(true); }}
                variant="outline"
                className="w-full mt-8 py-4 border-dashed border-slate-800 text-slate-500 hover:text-purple-400 hover:border-purple-500/30 transition-all group/add"
              >
                <Plus size={16} className="group-hover/add:scale-110" /> Adicionar Aqui
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

const ListView = ({ title, data, columns, collName, onAdd, permissions, handleToggleStatus, handleSetAgendaStatus, setFormData, setEditingId, setIsModalOpen, setItemToDelete, isSystemAdmin, fetchCollections, extraAction }: any) => (
  <div className="space-y-6 sm:space-y-10 w-full max-w-full min-w-0">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
      <div>
        <h2 className="text-2xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-tight">{title}</h2>
        <p className="text-slate-500 text-[8px] sm:text-[10px] uppercase font-black tracking-[0.3em] mt-2 flex items-center gap-3">
          <span className="w-4 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span> Central de Registros Operacionais
        </p>
      </div>
      <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
        {extraAction && (
          <Button onClick={extraAction.onClick} className="px-6 py-5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs tracking-widest rounded-2xl border border-slate-800 transition-all flex items-center justify-center gap-2">
            {extraAction.icon} {extraAction.label}
          </Button>
        )}
        {permissions.canEdit(collName === 'transactions' ? 'financial_control' : collName) && (
          <Button onClick={onAdd} className="px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs tracking-widest rounded-2xl shadow-[0_15px_30px_rgba(16,185,129,0.2)] transition-all hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"><Plus size={20} /> Novo Registro</Button>
        )}
      </div>
    </div>

    {/* Versão Desktop e Mobile: Tabela Modernizada */}
    <Card className="p-0 overflow-hidden bg-slate-950/20 border-slate-800/60 rounded-[3rem] shadow-2xl backdrop-blur-sm">
      <div className="overflow-x-auto scrollbar-hide w-full max-w-full">
        <table className="w-full text-left border-separate border-spacing-0 min-w-[800px]">
          <thead>
            <tr className="bg-slate-950">
              {collName === 'appointments' && permissions.canEdit('agenda') && (
                <th className="px-6 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50 w-24">Status</th>
              )}
              {columns.map((col: any) => <th key={col.key} className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50">{col.label}</th>)}
              {collName !== 'appointments' && (
                <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50">Responsável</th>
              )}
              <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right whitespace-nowrap border-b border-slate-800/50">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {data.length > 0 ? data.map((item: any, idx: number) => (
              <tr 
                key={item.id ? `row-${item.id}-${idx}` : `row-${idx}`} 
                onClick={() => {
                  if (collName === 'tasks' || collName === 'appointments') {
                    setFormData(item);
                    setEditingId(item.id);
                    setIsModalOpen(true);
                  }
                }}
                className={`group hover:bg-emerald-500/[0.03] transition-all duration-300 ${(collName === 'tasks' || collName === 'appointments') ? 'cursor-pointer' : ''}`}
              >
                {collName === 'appointments' && permissions.canEdit('agenda') && (
                  <td className="px-6 py-7">
                    <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleSetAgendaStatus && handleSetAgendaStatus(item, item.status === 'Concluído' ? 'Pendente' : 'Concluído'); }} className={`p-2.5 rounded-xl border transition-all ${item.status === 'Concluído' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-emerald-500 hover:border-emerald-500'}`} title={item.status === 'Concluído' ? 'Marcar como Pendente' : 'Marcar como Concluído'}><Check size={18} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleSetAgendaStatus && handleSetAgendaStatus(item, item.status === 'Cancelado' ? 'Pendente' : 'Cancelado'); }} className={`p-2.5 rounded-xl border transition-all ${item.status === 'Cancelado' ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-red-500 hover:border-red-500'}`} title={item.status === 'Cancelado' ? 'Marcar como Pendente' : 'Marcar como Cancelado'}><X size={18} /></button>
                    </div>
                  </td>
                )}
                {columns.map((col: any, colIdx: number) => (
                  <td key={colIdx} className="px-10 py-7 text-xs font-bold text-slate-400 group-hover:text-emerald-50 transition-colors">
                    {col.render ? col.render(item[col.key], item) : item[col.key]}
                  </td>
                ))}
                {collName !== 'appointments' && (
                  <td className="px-10 py-7">
                    <div className="flex flex-col gap-1.5">
                      <span className="px-3 py-1.5 bg-slate-950 text-slate-300 rounded-lg text-[9px] font-black border border-slate-800 uppercase tracking-widest w-fit group-hover:border-emerald-500/30 group-hover:text-emerald-400 transition-all">
                        {item.responsavel || 'Sistema'}
                      </span>
                      {isSystemAdmin && item.editor_nome && (
                        <span className="text-[7px] text-slate-600 font-bold uppercase mt-1 px-1 tracking-tighter">Editado por: {item.editor_nome}</span>
                      )}
                    </div>
                  </td>
                )}
                <td className="px-10 py-7 text-right">
                  <div className="flex justify-end gap-3 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                    {collName === 'transactions' && item.type === 'income' && permissions.canEdit('financial_control') && (
                      <button onClick={() => handleToggleStatus(item)} className={`p-2.5 rounded-xl border transition-all ${item.status === 'received' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-emerald-500 hover:border-emerald-500'}`} title="Marcar como Recebido"><Check size={18} /></button>
                    )}
                    {permissions.canEdit(collName === 'transactions' ? 'financial_control' : collName) && (
                      <button onClick={() => {setFormData(item); setEditingId(item.id); setIsModalOpen(true);}} className="p-2.5 bg-slate-950 text-slate-500 hover:text-white rounded-xl border border-slate-800 hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all"><Edit3 size={18} /></button>
                    )}
                    {permissions.canDelete(collName === 'transactions' ? 'financial_control' : collName) && (
                      <button onClick={() => setItemToDelete({ id: item.id, collName })} className="p-2.5 bg-slate-950 text-slate-500 hover:text-red-500 rounded-xl border border-slate-800 hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)] transition-all"><Trash2 size={18} /></button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={columns.length + 2} className="px-8 py-32 text-center text-slate-700 text-xs font-black uppercase tracking-[0.5em] opacity-40">Nenhum registro encontrado no sistema</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>

  </div>
);


const ReportsView = ({ clients, tasks, appointments, transactions, dailyReports, openReportModal, financialDisplayMode, setFinancialDisplayMode }: any) => {
  const usersMap: any = {};
  tasks.forEach((t: any) => {
    const userLabel = t.atribuido_a || 'Sem responsável';
    if (!usersMap[userLabel]) {
      usersMap[userLabel] = { done: 0, pending: 0 };
    }
    if (t.status === 'done') {
      usersMap[userLabel].done++;
    } else {
      usersMap[userLabel].pending++;
    }
  });

  const productivityData = Object.keys(usersMap).map(user => ({
    name: user.split('@')[0], 
    Concluídas: usersMap[user].done,
    'Não Realizadas': usersMap[user].pending,
    Eficiência: usersMap[user].done + usersMap[user].pending > 0 
      ? Math.round((usersMap[user].done / (usersMap[user].done + usersMap[user].pending)) * 100)
      : 0
  }));

  const totalDone = tasks.filter((t: any) => t.status === 'done').length;
  const totalPending = tasks.filter((t: any) => t.status !== 'done').length;
  const totalTasks = totalDone + totalPending;
  const globalEfficiency = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  const prodKpis = [
    { label: 'Total Concluído', value: totalDone },
    { label: 'Não Realizadas', value: totalPending },
    { label: 'Eficiência', value: `${globalEfficiency}%` }
  ];

  const financeData = transactions.reduce((acc: any[], t: any) => {
    const date = new Date(t.data).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    const existing = acc.find(item => item.date === date);
    const value = Number(t.valor);
    if (existing) {
      if (t.type === 'income') existing.Receita += value;
      else existing.Despesa += value;
    } else {
      acc.push({
        date,
        Receita: t.type === 'income' ? value : 0,
        Despesa: t.type === 'expense' ? value : 0
      });
    }
    return acc;
  }, []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalIncome = transactions.filter((t: any) => t.type === 'income').reduce((acc: any, t: any) => acc + Number(t.valor), 0);
  const totalExpense = transactions.filter((t: any) => t.type === 'expense').reduce((acc: any, t: any) => acc + Number(t.valor), 0);
  const totalProfit = totalIncome - totalExpense;

  const activeClientsCount = clients.filter((c: any) => c.status === 'active').length;

  const downloadFinance = () => {
    const incomeTransactions = transactions.filter((t: any) => t.type === 'income');
    const expenseTransactions = transactions.filter((t: any) => t.type === 'expense');

    const incomeTable = incomeTransactions.map((t: any) => [
      t.cliente || t.descricao || 'Receita',
      new Date(t.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}),
      formatVal(Number(t.valor), totalIncome, financialDisplayMode)
    ]);

    const expenseTable = expenseTransactions.map((t: any) => [
      t.descricao || 'Despesa',
      new Date(t.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}),
      formatVal(Number(t.valor), totalExpense, financialDisplayMode)
    ]);

    generateExecutiveReport({
      title: 'Relatório Financeiro',
      period: 'Geral',
      cards: [
        { label: 'Entradas', value: formatVal(totalIncome, totalIncome, financialDisplayMode), color: [34, 197, 94] },
        { label: 'Saídas', value: formatVal(totalExpense, totalIncome, financialDisplayMode), color: [239, 68, 68] },
        { label: 'Lucro Bruto', value: formatVal(totalProfit, totalIncome, financialDisplayMode), color: [37, 99, 235] },
        { label: 'Lucro Líquido', value: formatVal(totalProfit, totalIncome, financialDisplayMode), color: [37, 99, 235] }
      ],
      mainTable: {
        title: 'Entradas',
        head: [['Descrição / Cliente', 'Data', 'Valor']],
        body: incomeTable
      },
      additionalTables: [
        {
          title: 'Saídas',
          head: [['Descrição', 'Data', 'Valor']],
          body: expenseTable
        }
      ],
      finalSummary: `Lucro Bruto: Fórmula: Total de Entradas - Total de Saídas. Representa o valor que sobra após descontar todas as despesas das receitas.

Lucro Líquido: Fórmula: Lucro Bruto - Taxas - Impostos - Descontos - Comissões - Custos Extras. Representa o lucro real da empresa após todos os descontos e custos. Caso não existam custos adicionais, o Lucro Líquido deverá ser igual ao Lucro Bruto.`,
      filename: `relatorio_financeiro_${getBRTDateString()}.pdf`
    });
  };



  const downloadAll = () => {
    const prodTable = productivityData.map(row => [row.name, row.Concluídas, row['Não Realizadas'], `${row.Eficiência}%`]);
    
    const finKpis = [
      { label: 'Receita Total', value: formatVal(totalIncome, totalIncome, financialDisplayMode), color: [34, 197, 94] },
      { label: 'Despesas', value: formatVal(totalExpense, totalIncome, financialDisplayMode), color: [239, 68, 68] },
      { label: 'Lucro Líquido', value: formatVal(totalProfit, totalIncome, financialDisplayMode), color: [37, 99, 235] }
    ];
    
    const finTable = transactions.map((t: any) => [
      t.type === 'income' ? (t.cliente || 'N/A') : (t.descricao || 'N/A'),
      t.type === 'income' ? 'Entrada' : 'Saída',
      formatVal(Number(t.valor), t.type === 'income' ? totalIncome : totalExpense, financialDisplayMode),
      new Date(t.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})
    ]);

    const clientTable = clients.map((c: any) => [
      c.nome,
      c.empresa || '-',
      c.telefone || '-',
      c.status === 'active' ? 'Ativo' : 'Inativo'
    ]);

    const agendaTable = appointments.map((a: any) => [
      `${a.data ? new Date(a.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : ''} ${a.hora || ''}`.trim(),
      a.titulo_evento || a.titulo || 'Sem título',
      a.localizacao || '-',
      a.status === 'Concluído' ? 'Concluído' : a.status === 'Cancelado' ? 'Cancelado' : 'Pendente'
    ]);

    const additionalTables: ReportTable[] = [
      {
        title: 'Balanço Financeiro',
        head: [['Descrição / Cliente', 'Tipo', 'Valor', 'Data']],
        body: finTable,
        didParseCell: function(data: any) {
            if (data.section === 'body' && data.column.index === 1) {
                data.cell.styles.textColor = data.cell.raw === 'Entrada' ? [34, 197, 94] : [239, 68, 68];
            }
        }
      },
      {
        title: 'Carteira de Leads',
        head: [['Nome', 'Empresa/Projeto', 'Telefone', 'Status']],
        body: clientTable,
        didParseCell: function(data: any) {
            if (data.section === 'body' && data.column.index === 3) {
                data.cell.styles.textColor = data.cell.raw === 'Ativo' ? [34, 197, 94] : [239, 68, 68];
            }
        }
      },
      {
        title: 'Agenda e Compromissos',
        head: [['Data/Hora', 'Título', 'Localização', 'Status']],
        body: agendaTable,
        didParseCell: function(data: any) {
            if (data.section === 'body' && data.column.index === 3) {
                if (data.cell.raw === 'Concluído') data.cell.styles.textColor = [34, 197, 94];
                else if (data.cell.raw === 'Cancelado') data.cell.styles.textColor = [239, 68, 68];
                else data.cell.styles.textColor = [245, 158, 11];
            }
        }
      }
    ];

    if (typeof dailyReports !== 'undefined' && dailyReports.length > 0) {
        const users = Array.from(new Set(dailyReports.map((r: any) => r.responsavel)));
        users.forEach((userId, index) => {
             const userReps = dailyReports.filter((r: any) => r.responsavel === userId);
             userReps.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
             const latest = userReps[0];
             if (latest) {
                 const summaryData = [
                    ['Data', new Date(latest.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})],
                    ['Pendências', latest.pendencias || '-'],
                    ['Dificuldades', latest.dificuldades || '-'],
                    ['Prioridades', latest.prioridades || '-']
                 ];
                 additionalTables.push({
                   title: `Resumo Diário - ${USER_PROFILES[String(userId)]?.label || userId}`,
                   head: [['Tópico', 'Descrição']],
                   body: summaryData
                 });
             }
        });
    }

    generateExecutiveReport({
      title: 'Relatório Executivo e Analítico',
      period: 'Geral',
      cards: [
        ...prodKpis,
        ...finKpis as any,
        { label: 'Leads Ativos', value: activeClientsCount, color: [34, 197, 94] }
      ],
      mainTable: {
        title: 'Desempenho da Equipe',
        head: [['Membro da Equipe', 'Concluídas', 'Não Realizadas', 'Eficiência']],
        body: prodTable
      },
      additionalTables,
      filename: `relatorio_executivo_${getBRTDateString()}.pdf`
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 w-full max-w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">Relatórios</h2>
          <p className="text-slate-400 mt-1 text-sm font-medium">Visão detalhada e analítica da agência</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button onClick={() => openReportModal('all')} className="flex-1 md:flex-none bg-white text-slate-950 hover:bg-slate-200 border border-white shadow-none font-bold">
            <FileText size={16} className="mr-2" /> Relatório Geral
          </Button>
        </div>
      </div>



      {/* SECTION: Produtividade */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart2 size={24} className="text-[#1E7F4F]" /> Produtividade
          </h3>
          <Button onClick={() => openReportModal('productivity')} variant="secondary" className="h-8 px-3 text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800">
            <Download size={14} className="mr-2" /> PDF
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="col-span-1 flex flex-col gap-4">
            <Card className="p-5 border-slate-800 bg-slate-900/50 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Concluído</span>
              <span className="text-3xl font-black text-white">{totalDone}</span>
            </Card>
            <Card className="p-5 border-slate-800 bg-slate-900/50 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Pendente</span>
              <span className="text-3xl font-black text-white">{totalPending}</span>
            </Card>
            <Card className="p-5 border-slate-800 bg-slate-900/50 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Eficiência</span>
              <span className="text-3xl font-black text-emerald-500">{globalEfficiency}%</span>
            </Card>
          </div>
          <Card className="col-span-1 lg:col-span-3 p-5 border-slate-800 bg-slate-900/50 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: any, name: any) => { let p = 0; if (name === "Receita") p = totalIncome > 0 ? (value / totalIncome) * 100 : 0; if (name === "Despesa") p = totalExpense > 0 ? (value / totalExpense) * 100 : 0; return `R$ ${value.toLocaleString("pt-BR", {minimumFractionDigits:2})} (${p.toFixed(2)}%)`; }} contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#fff", borderRadius: "12px" }} />
                <Bar dataKey="Concluídas" fill="#1E7F4F" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="Pendentes" fill="#475569" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="Não Realiz." fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="bg-slate-950/50 text-xs text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Concluídas</th>
                  <th className="px-6 py-4">Não Realizadas</th>
                  <th className="px-6 py-4">Eficiência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {productivityData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{row.name}</td>
                    <td className="px-6 py-4 text-slate-300">{row.Concluídas}</td>
                    <td className="px-6 py-4 text-red-400">{row['Não Realizadas']}</td>
                    <td className="px-6 py-4 text-emerald-400 font-bold">{row.Eficiência}%</td>
                  </tr>
                ))}
                {productivityData.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">Sem dados de produtividade</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* SECTION: Financeiro */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign size={24} className="text-[#C9A227]" /> Financeiro
          </h3>
          <div className="flex items-center gap-4">
            <DisplayModeToggle mode={financialDisplayMode} setMode={setFinancialDisplayMode} />
            <Button onClick={() => openReportModal('finance')} variant="secondary" className="h-8 px-3 text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800">
              <Download size={14} className="mr-2" /> PDF
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="col-span-1 flex flex-col gap-4">
            <Card className="p-5 border-slate-800 bg-slate-900/50 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Receita</span>
              <FinancialDisplay value={totalIncome} base={totalIncome} mode={financialDisplayMode} className="text-2xl font-black text-emerald-500" tooltip="100% da Receita Total" />
            </Card>
            <Card className="p-5 border-slate-800 bg-slate-900/50 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Despesa</span>
              <FinancialDisplay value={totalExpense} base={totalIncome} mode={financialDisplayMode} className="text-2xl font-black text-red-500" tooltip="% em relação à Receita Total" />
            </Card>
            <Card className="p-5 border-slate-800 bg-slate-900/50 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lucro</span>
              <FinancialDisplay value={totalProfit} base={totalIncome} mode={financialDisplayMode} className="text-2xl font-black text-white" tooltip="Margem de Lucro (% da Receita)" />
            </Card>
          </div>
          <Card className="col-span-1 lg:col-span-3 p-5 border-slate-800 bg-slate-900/50 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={financeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: any, name: any) => { let p = 0; if (name === "Receita") p = totalIncome > 0 ? (value / totalIncome) * 100 : 0; if (name === "Despesa") p = totalExpense > 0 ? (value / totalExpense) * 100 : 0; return `R$ ${value.toLocaleString("pt-BR", {minimumFractionDigits:2})} (${p.toFixed(2)}%)`; }} contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#fff", borderRadius: "12px" }} />
                <Line type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={3} dot={{r:4, fill:'#10b981', strokeWidth:0}} activeDot={{r:6}} />
                <Line type="monotone" dataKey="Despesa" stroke="#ef4444" strokeWidth={3} dot={{r:4, fill:'#ef4444', strokeWidth:0}} activeDot={{r:6}} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="bg-slate-950/50 text-xs text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Cliente / Descrição</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {transactions.map((t: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-white truncate max-w-[200px]">{t.type === 'income' ? (t.cliente || 'N/A') : (t.descricao || 'N/A')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {t.type === 'income' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">
                      <FinancialDisplay value={Number(t.valor)} base={t.type === 'income' ? totalIncome : totalExpense} mode={financialDisplayMode} className="inline-flex" />
                    </td>
                    <td className="px-6 py-4 text-slate-400">{new Date(t.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                   <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">Nenhum lançamento financeiro</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* SECTION: Agenda */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon size={24} className="text-blue-500" /> Agenda de Compromissos
          </h3>
          <Button onClick={() => openReportModal('agenda')} variant="secondary" className="h-8 px-3 text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800">
            <Download size={14} className="mr-2" /> PDF
          </Button>
        </div>
        
        <Card className="border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="bg-slate-950/50 text-xs text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Data/Hora</th>
                  <th className="px-6 py-4">Título</th>
                  <th className="px-6 py-4">Localização</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {appointments.map((a: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 text-slate-300">{`${a.data ? new Date(a.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : ''} ${a.hora || ''}`.trim()}</td>
                    <td className="px-6 py-4 font-medium text-white">{a.titulo_evento || a.titulo || 'Sem título'}</td>
                    <td className="px-6 py-4 text-slate-300">{a.localizacao || '-'}</td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${a.status === 'Concluído' ? 'bg-emerald-500/10 text-emerald-400' : a.status === 'Cancelado' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                         {a.status === 'Concluído' ? 'Concluído' : a.status === 'Cancelado' ? 'Cancelado' : 'Pendente'}
                       </span>
                    </td>
                  </tr>
                ))}
                {appointments.length === 0 && (
                   <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">Nenhum compromisso agendado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* SECTION: Leads Ativos */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={24} className="text-purple-500" /> Leads
          </h3>
          <Button onClick={() => openReportModal('clients')} variant="secondary" className="h-8 px-3 text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800">
            <Download size={14} className="mr-2" /> PDF
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="p-5 border-slate-800 bg-slate-900/50 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Leads Ativos</span>
              <span className="text-3xl font-black text-white">{activeClientsCount}</span>
            </Card>
            <Card className="p-5 border-slate-800 bg-slate-900/50 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Novos Leads (Mês)</span>
              <span className="text-3xl font-black text-white">
                {clients.filter((c: any) => getBRTDate(c.created_at).getMonth() === getBRTDate().getMonth()).length}
              </span>
            </Card>
            <Card className="p-5 border-slate-800 bg-slate-900/50 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cancelamentos</span>
              <span className="text-3xl font-black text-red-500">
                 {clients.filter((c: any) => c.status === 'inactive').length}
              </span>
            </Card>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="bg-slate-950/50 text-xs text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Empresa</th>
                  <th className="px-6 py-4">Telefone</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {clients.map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{c.nome}</td>
                    <td className="px-6 py-4 text-slate-300">{c.empresa || '-'}</td>
                    <td className="px-6 py-4 text-slate-300 font-mono">{c.telefone || '-'}</td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                         {c.status === 'active' ? 'Ativo' : 'Inativo'}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* SECTION: Resumo Diário da Equipe */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText size={24} className="text-[#1E7F4F]" /> Resumo Diário da Equipe
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dailyReports && dailyReports.length > 0 ? dailyReports.slice(0, 6).map((report: any, idx: number) => (
             <Card key={idx} className="p-5 border-slate-800 bg-slate-900/50 flex flex-col gap-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/10"></div>
                <div className="flex justify-between items-center z-10">
                   <div className="flex flex-col">
                      <span className="text-sm font-black text-white">{USER_PROFILES[report.responsavel]?.label || report.responsavel}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(report.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                   </div>
                </div>
                <div className="z-10 space-y-3 mt-2">
                   <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Pendências</span>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{report.pendencias || '-'}</p>
                   </div>
                   <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Dificuldades</span>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{report.dificuldades || '-'}</p>
                   </div>
                   <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Prioridades</span>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{report.prioridades || '-'}</p>
                   </div>
                </div>
             </Card>
          )) : (
             <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-10 bg-slate-900/50 rounded-2xl border border-slate-800">
                <span className="text-slate-500 text-sm font-medium">Nenhum resumo diário registrado recentemente.</span>
             </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-8 border-t border-slate-800 flex justify-end">
         <Button onClick={() => openReportModal('all')} className="bg-white hover:bg-slate-200 text-slate-950 border border-white py-4 px-8 text-sm uppercase tracking-widest font-bold">
            <FileText size={18} className="mr-2" /> Exportar Tudo em PDF
          </Button>
      </div>
    </div>
  );
};

// --- App Principal ---

const PontoView = ({ currentUserProfile, pontos, setPontos, isSystemAdmin, USER_PROFILES, supabase, permissions }: any) => {
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(() => USER_PROFILES[currentUserProfile]?.permissions?.ponto_history_only || false);
  const [editingPonto, setEditingPonto] = React.useState<any>(null);
  const [editTime, setEditTime] = React.useState('');
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [pendingPonto, setPendingPonto] = React.useState<string | null>(null);
  const [justificativa, setJustificativa] = React.useState('');
  const [showSettings, setShowSettings] = React.useState(false);
  const [showManualAdd, setShowManualAdd] = React.useState(false);
  const [manualAddData, setManualAddData] = React.useState({
    tipo: 'Entrada',
    data: getBRTDateString(),
    hora: '08:00',
    usuario: currentUserProfile,
    justificativa: ''
  });
  const [settingsFormData, setSettingsFormData] = React.useState({
    hora_entrada: '08:00',
    tolerancia_entrada_antes: 15,
    tolerancia_entrada_depois: 15,
    hora_inicio_almoco: '12:00',
    tolerancia_inicio_almoco_antes: 15,
    tolerancia_inicio_almoco_depois: 15,
    hora_fim_almoco: '13:30',
    tolerancia_fim_almoco_antes: 15,
    tolerancia_fim_almoco_depois: 15,
    hora_saida: '18:00',
    tolerancia_saida_antes: 15,
    tolerancia_saida_depois: 15,
    duracao_almoco: 90,
  });

  const baseConfigPonto = React.useMemo(() => {
    const cfgs = pontos.filter((p: any) => p.tipo === 'CONFIG').sort((a: any, b: any) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
    let parsed: any = {
      hora_entrada: '08:00',
      tolerancia_entrada_antes: 15,
      tolerancia_entrada_depois: 15,
      hora_inicio_almoco: '12:00',
      tolerancia_inicio_almoco_antes: 15,
      tolerancia_inicio_almoco_depois: 15,
      hora_fim_almoco: '13:30',
      tolerancia_fim_almoco_antes: 15,
      tolerancia_fim_almoco_depois: 15,
      hora_saida: '18:00',
      tolerancia_saida_antes: 15,
      tolerancia_saida_depois: 15,
      userConfigs: {}
    };
    if (cfgs.length > 0 && cfgs[0].usuario_nome) {
      try {
        const loaded = JSON.parse(cfgs[0].usuario_nome);
        parsed = { ...parsed, ...loaded };
        if (parsed.tolerancia !== undefined && parsed.tolerancia_entrada_antes === undefined) {
          parsed.tolerancia_entrada_antes = parsed.tolerancia;
          parsed.tolerancia_entrada_depois = parsed.tolerancia;
          parsed.tolerancia_inicio_almoco_antes = parsed.tolerancia;
          parsed.tolerancia_inicio_almoco_depois = parsed.tolerancia;
          parsed.tolerancia_fim_almoco_antes = parsed.tolerancia;
          parsed.tolerancia_fim_almoco_depois = parsed.tolerancia;
          parsed.tolerancia_saida_antes = parsed.tolerancia;
          parsed.tolerancia_saida_depois = parsed.tolerancia;
        }
      } catch(e) {}
    }
    return parsed;
  }, [pontos]);

  const configPonto = React.useMemo(() => {
      if (baseConfigPonto.userConfigs && baseConfigPonto.userConfigs[currentUserProfile]) {
          return baseConfigPonto.userConfigs[currentUserProfile];
      }
      return baseConfigPonto;
  }, [baseConfigPonto, currentUserProfile]);

  const [settingsUserFilter, setSettingsUserFilter] = useState('all');

  React.useEffect(() => {
    if (settingsUserFilter === 'all') {
      setSettingsFormData(baseConfigPonto);
    } else {
      setSettingsFormData(baseConfigPonto.userConfigs?.[settingsUserFilter] || baseConfigPonto);
    }
  }, [baseConfigPonto, showSettings, settingsUserFilter]);

  const saveSettings = async () => {
    setIsProcessing(true);
    try {
      let finalConfigToSave = { ...baseConfigPonto };
      if (settingsUserFilter === 'all') {
         finalConfigToSave = { ...finalConfigToSave, ...settingsFormData };
      } else {
         if (!finalConfigToSave.userConfigs) finalConfigToSave.userConfigs = {};
         finalConfigToSave.userConfigs[settingsUserFilter] = settingsFormData;
      }
      
      const payload = {
        usuario_email: 'system_config',
        usuario_nome: JSON.stringify(finalConfigToSave),
        tipo: 'CONFIG',
        data_hora: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('pontos').insert(payload).select();
      if (error) throw error;
      if (data && data.length > 0) {
        setPontos([data[0], ...pontos]);
      } else {
        setPontos([{...payload, id: Math.random()}, ...pontos]);
      }
      setShowSettings(false);
    } catch (e: any) {
      alert('Erro ao salvar config: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const canExportReports = USER_PROFILES[currentUserProfile]?.role === 'administrator';

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const savePonto = async (tipo: string, latitude: number | null, longitude: number | null, isValidLocation: boolean) => {
    try {
      const payload = {
        usuario_email: currentUserProfile,
        usuario_nome: USER_PROFILES[currentUserProfile]?.label || currentUserProfile,
        tipo: tipo,
        data_hora: new Date().toISOString(),
        created_at: new Date().toISOString(),
        latitude: latitude,
        longitude: longitude,
        localizacao_valida: isValidLocation
      };
      // For MVP without id from UI payload initially, when we insert, we get the data back to have the ID
      const { data, error } = await supabase.from('pontos').insert(payload).select();
      if (error) {
        if (error.code === '42P01') {
          alert('Erro: A tabela "pontos" não existe no banco de dados. Execute o SQL de criação primeiro.');
        } else {
          alert('Erro ao registrar ponto: ' + error.message);
        }
      } else if (data && data.length > 0) {
        setPontos([data[0], ...pontos]);
      } else {
         // fallback
         setPontos([{ ...payload, id: Math.random() }, ...pontos]);
      }
    } catch (err: any) {
      if(err?.message?.includes('Failed to fetch')) { console.warn(err); } else { console.error(err); }
    } finally {
      setIsProcessing(false);
    }
  };

  const isOutsideTolerance = (tipo: string, time: Date) => {
    const currentMinutes = time.getHours() * 60 + time.getMinutes();
    let expectedTime = '';
    let tolAntes = 0;
    let tolDepois = 0;
    if (tipo === 'Entrada') {
      expectedTime = configPonto.hora_entrada || '08:00';
      tolAntes = configPonto.tolerancia_entrada_antes ?? 15;
      tolDepois = configPonto.tolerancia_entrada_depois ?? 15;
    } else if (tipo === 'Saída Almoço') {
      expectedTime = configPonto.hora_inicio_almoco || '12:00';
      tolAntes = configPonto.tolerancia_inicio_almoco_antes ?? 15;
      tolDepois = configPonto.tolerancia_inicio_almoco_depois ?? 15;
    } else if (tipo === 'Retorno Almoço') {
      expectedTime = configPonto.hora_fim_almoco || '13:00';
      if (configPonto.duracao_almoco) {
        const todayStr = getBRTDateString(time);
        const saidaAlmoco = pontos.find((p: any) => p.usuario_email === currentUserProfile && p.tipo === 'Saída Almoço' && new Date(p.data_hora).toISOString().startsWith(todayStr));
        if (saidaAlmoco) {
          const saidaTime = getBRTDate(saidaAlmoco.data_hora);
          const expectedReturnMinutes = saidaTime.getHours() * 60 + saidaTime.getMinutes() + Number(configPonto.duracao_almoco);
          const expectedH = Math.floor(expectedReturnMinutes / 60).toString().padStart(2, '0');
          const expectedM = (expectedReturnMinutes % 60).toString().padStart(2, '0');
          expectedTime = `${expectedH}:${expectedM}`;
        }
      }
      tolAntes = configPonto.tolerancia_fim_almoco_antes ?? 15;
      tolDepois = configPonto.tolerancia_fim_almoco_depois ?? 15;
    } else if (tipo === 'Saída') {
      expectedTime = configPonto.hora_saida || '18:00';
      tolAntes = configPonto.tolerancia_saida_antes ?? 15;
      tolDepois = configPonto.tolerancia_saida_depois ?? 15;
    }
    if (!expectedTime) return false;
    const [eh, em] = expectedTime.split(':').map(Number);
    const expectedMinutes = eh * 60 + em;
    return currentMinutes < (expectedMinutes - tolAntes) || currentMinutes > (expectedMinutes + tolDepois);
  };
  const initiatePonto = (tipo: string) => {
    if (isOutsideTolerance(tipo, getBRTDate())) {
      setPendingPonto(tipo);
      setJustificativa('');
    } else {
      handlePonto(tipo);
    }
  };

  const confirmPontoWithJustificativa = () => {
    if (!justificativa.trim()) {
      alert("Por favor, preencha o motivo do atraso/antecipação.");
      return;
    }
    const tipoWithJustificativa = `${pendingPonto}::justificativa::${justificativa.trim()}`;
    setPendingPonto(null);
    handlePonto(tipoWithJustificativa);
  };

  const handlePonto = async (tipo: string) => {
    setIsProcessing(true);

    if (!navigator.geolocation) {
      await savePonto(tipo, null, null, false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const isValidLocation = true;
      await savePonto(tipo, latitude, longitude, isValidLocation);
    }, async (error) => {
      console.warn('Erro de GPS, salvando sem localização:', error);
      await savePonto(tipo, null, null, false);
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  };

  const openEditModal = (p: any) => {
    if (USER_PROFILES[currentUserProfile]?.role !== 'administrator') return;
    setEditingPonto(p);
    setEditTime(p.time);
    setConfirmDelete(false);
  };

  const saveEditPonto = async () => {
    if (!editingPonto || !editTime) return;
    setIsProcessing(true);
    try {
      const dateObj = new Date(editingPonto.fullDate);
      const [hours, minutes] = editTime.split(':');
      dateObj.setHours(parseInt(hours, 10));
      dateObj.setMinutes(parseInt(minutes, 10));
      const newDateStr = dateObj.toISOString();
      const { error } = await supabase.from('pontos').update({ data_hora: newDateStr }).eq('id', editingPonto.id);
      if (error) throw error;
      setPontos((prev: any) => prev.map((p: any) => p.id === editingPonto.id ? { ...p, data_hora: newDateStr } : p));
      setEditingPonto(null);
      alert('Registro editado com sucesso!');
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const deletePonto = async () => {
    if (!editingPonto) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.from('pontos').delete().eq('id', editingPonto.id).select();
      if (error) throw error;
      if (!data || data.length === 0) {
         throw new Error("Não foi possível excluir no banco de dados. Verifique as permissões (RLS) ou se o registro já foi excluído.");
      }
      setPontos((prev: any) => prev.filter((p: any) => p.id !== editingPonto.id));
      setEditingPonto(null);
      setConfirmDelete(false);
      alert('Registro excluído com sucesso!');
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const saveManualPonto = async () => {
    if (!manualAddData.data || !manualAddData.hora || !manualAddData.justificativa) {
      alert("Preencha todos os campos obrigatórios (Data, Hora e Justificativa).");
      return;
    }
    setIsProcessing(true);
    try {
      const dateObj = new Date(`${manualAddData.data}T${manualAddData.hora}:00`);
      if (isNaN(dateObj.getTime())) {
          alert("Data ou hora inválida.");
          return;
      }
      
      const tipoStr = `${manualAddData.tipo}::justificativa::${manualAddData.justificativa}`;
      
      const payload = {
        usuario_email: manualAddData.usuario,
        usuario_nome: USER_PROFILES[manualAddData.usuario]?.label || manualAddData.usuario,
        tipo: tipoStr,
        data_hora: dateObj.toISOString(),
        created_at: new Date().toISOString(),
        latitude: null,
        longitude: null,
        localizacao_valida: false
      };
      const { data, error } = await supabase.from('pontos').insert(payload).select();
      if (error) throw error;
      if (data && data.length > 0) {
        setPontos([data[0], ...pontos]);
      }
      setShowManualAdd(false);
      setManualAddData({ ...manualAddData, justificativa: '' });
      alert('Ponto manual registrado com sucesso!');
    } catch (err: any) {
      alert('Erro ao registrar ponto manual: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const zerarHistorico = async () => {
    if (!window.confirm('Tem certeza que deseja APAGAR TODOS os registros de ponto de TODOS os usuários? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('pontos').delete().neq('tipo', 'CONFIG');
      if (error) throw error;
      
      setPontos((prev: any) => prev.filter((p: any) => p.tipo === 'CONFIG'));
      alert('Histórico de ponto zerado com sucesso.');
    } catch (err: any) {
      alert('Erro ao zerar histórico: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const meusPontos = pontos.filter((p: any) => p.usuario_email === currentUserProfile).sort((a: any, b: any) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
  const todosPontos = [...pontos].sort((a: any, b: any) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
  const displayPontos = (USER_PROFILES[currentUserProfile]?.role === 'administrator' ? todosPontos : meusPontos).filter((p: any) => p.tipo !== 'CONFIG' && new Date(p.data_hora) >= new Date('2026-07-23T00:00:00-03:00'));

  const timeToMin = (t: any) => {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const minToTime = (m: any) => {
    if (m === null || m === undefined || isNaN(m) || m < 0) return '---';
    const h = Math.floor(m / 60);
    const mins = m % 60;
    return `${h.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const groupedPontos = React.useMemo(() => {
    const groups: Record<string, Record<string, any>> = {};
    
    displayPontos.forEach((p: any) => {
      const user = p.usuario_nome || p.usuario_email;
      
      const parts = p.tipo.split('::justificativa::');
      const baseTipo = parts[0];
      const justificativaValue = parts.length > 1 ? parts[1] : null;

      let dateObj = getBRTDate(p.data_hora);
      // Shifts overnight punches (not Entrada) before 07:00 AM to the previous day
      if (baseTipo !== 'Entrada' && dateObj.getHours() < 7) {
          dateObj = new Date(dateObj.getTime() - 24 * 60 * 60 * 1000);
      }

      const dateStr = new Date(p.data_hora).toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'});
      const timeStr = new Date(p.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
      const dayOfWeek = new Date(p.data_hora).toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'America/Sao_Paulo' });
      
      if (!groups[user]) groups[user] = {};
      if (!groups[user][dateStr]) {
        groups[user][dateStr] = {
          dateStr,
          dayOfWeek,
          dateObj,
          'Entrada': null,
          'Saída Almoço': null,
          'Retorno Almoço': null,
          'Saída': null,
        };
      }
      
      if (!groups[user][dateStr][baseTipo]) {
        groups[user][dateStr][baseTipo] = {
          id: p.id,
          time: timeStr,
          fullDate: p.data_hora,
          tipo: baseTipo,
          justificativa: justificativaValue,
          usuario_email: p.usuario_email,
          latitude: p.latitude,
          longitude: p.longitude
        };
      }
    });

    Object.keys(groups).forEach(user => {
       const userEmail = Object.values(groups[user])[0]?.['Entrada']?.usuario_email || user;
       const uConfig = baseConfigPonto.userConfigs?.[userEmail] || baseConfigPonto;
       const expEntrada = timeToMin(uConfig.hora_entrada);
       const expSaidaAlmoco = timeToMin(uConfig.hora_inicio_almoco);
       const expRetornoAlmoco = timeToMin(uConfig.hora_fim_almoco);
       const expSaida = timeToMin(uConfig.hora_saida);
       
       const timeDiff = (start: number | null, end: number | null) => {
           if (start === null || end === null) return 0;
           let diff = end - start;
           if (diff < 0) diff += 1440; // overnight
           return diff;
       };

       const getDiff = (actual: number, expected: number) => {
           let diff = actual - expected;
           if (diff < -720) diff += 1440;
           if (diff > 720) diff -= 1440;
           return diff;
       };

              const tolEntAntes = uConfig.tolerancia_entrada_antes || 5;
       const tolEntDepois = uConfig.tolerancia_entrada_depois || 5;
       const tolSaidaAlmocoAntes = uConfig.tolerancia_inicio_almoco_antes || 5;
       const tolSaidaAlmocoDepois = uConfig.tolerancia_inicio_almoco_depois || 5;
       const tolRetornoAlmocoAntes = uConfig.tolerancia_fim_almoco_antes || 5;
       const tolRetornoAlmocoDepois = uConfig.tolerancia_fim_almoco_depois || 5;
       const tolSaidaAntes = uConfig.tolerancia_saida_antes || 5;
       const tolSaidaDepois = uConfig.tolerancia_saida_depois || 5;

       let expectedTotal = timeDiff(expEntrada, expSaidaAlmoco) + timeDiff(expRetornoAlmoco, expSaida);

       if (expSaidaAlmoco === null && expRetornoAlmoco === null) {
           expectedTotal = timeDiff(expEntrada, expSaida);
       }

       Object.keys(groups[user]).forEach(dateStr => {
          const day = groups[user][dateStr];
          const t1_raw = day['Entrada'] ? timeToMin(day['Entrada'].time) : null;
          const t2_raw = day['Saída Almoço'] ? timeToMin(day['Saída Almoço'].time) : null;
          const t3_raw = day['Retorno Almoço'] ? timeToMin(day['Retorno Almoço'].time) : null;
          const t4_raw = day['Saída'] ? timeToMin(day['Saída'].time) : null;
          
          let extra = 0;
          let delay = 0;
          let hasIncomplete = false;
          let extraDetails: string[] = [];
          let delayDetails: string[] = [];

          const addExtra = (min: number, reason: string) => { 
              extra += min; 
              extraDetails.push(`+${minToTime(min)}: ${reason}`); 
          };
          const addDelay = (min: number, reason: string) => { 
              delay += min; 
              delayDetails.push(`+${minToTime(min)}: ${reason}`); 
          };

          if (!t1_raw && !t2_raw && !t3_raw && !t4_raw) {
              day.workedMin = 0;
              day.extraMin = 0;
              day.delayMin = 0;
              day.extraDetails = [];
              day.delayDetails = [];
              return;
          }

          if (expSaidaAlmoco === null && expRetornoAlmoco === null) {
              if (t1_raw !== null && t4_raw !== null) {
                  let d1 = getDiff(t1_raw, expEntrada);
                  if (d1 < -tolEntAntes) addExtra(Math.abs(d1), 'Entrada antecipada');
                  if (d1 > tolEntDepois) addDelay(d1, 'Entrada em atraso');

                  let d4 = getDiff(t4_raw, expSaida);
                  if (d4 > tolSaidaDepois) addExtra(d4, 'Saída além do horário');
                  if (d4 < -tolSaidaAntes) addDelay(Math.abs(d4), 'Saída antecipada');
              } else {
                  hasIncomplete = true;
                  addDelay(expectedTotal, 'Dia incompleto sem almoço');
              }
          } else {
              const expectedMorning = timeDiff(expEntrada, expSaidaAlmoco);
              const expectedAfternoon = timeDiff(expRetornoAlmoco, expSaida);
              const lunchDuration = uConfig.duracao_almoco ? Number(uConfig.duracao_almoco) : timeDiff(expSaidaAlmoco, expRetornoAlmoco);

              if (t1_raw !== null && t4_raw !== null && t2_raw === null && t3_raw === null) {
                  // Sem registro de saída e retorno do almoço: o período de almoço será considerado como tempo trabalhado (hora extra)
                  let d1 = getDiff(t1_raw, expEntrada);
                  if (d1 < -tolEntAntes) addExtra(Math.abs(d1), 'Entrada antecipada');
                  if (d1 > tolEntDepois) addDelay(d1, 'Entrada em atraso');

                  let d4 = getDiff(t4_raw, expSaida);
                  if (d4 > tolSaidaDepois) addExtra(d4, 'Saída além do horário');
                  if (d4 < -tolSaidaAntes) addDelay(Math.abs(d4), 'Saída antecipada');

                  // addExtra(lunchDuration, 'Almoço não registrado'); // Removido para assumir almoço padrão conforme config
              } else {
                  if (t1_raw !== null && t4_raw !== null) {
                      let d1 = getDiff(t1_raw, expEntrada);
                      if (d1 < -tolEntAntes) addExtra(Math.abs(d1), 'Entrada antecipada');
                      if (d1 > tolEntDepois) addDelay(d1, 'Entrada em atraso');

                      let d4 = getDiff(t4_raw, expSaida);
                      if (d4 > tolSaidaDepois) addExtra(d4, 'Saída além do horário');
                      if (d4 < -tolSaidaAntes) addDelay(Math.abs(d4), 'Saída antecipada');

                      if (t2_raw === null || t3_raw === null) {
                          // Almoço com apenas um registro: conta como atraso
                          if (t2_raw !== null) {
                              let d2 = getDiff(t2_raw, expSaidaAlmoco);
                              if (d2 > tolSaidaAlmocoDepois) addExtra(d2, 'Saída almoço além do horário');
                              if (d2 < -tolSaidaAlmocoAntes) addDelay(Math.abs(d2), 'Saída almoço antecipada');
                          }
                          if (t3_raw !== null) {
                              let d3 = getDiff(t3_raw, expRetornoAlmoco);
                              if (d3 < -tolRetornoAlmocoAntes) addExtra(Math.abs(d3), 'Retorno almoço antecipado');
                              if (d3 > tolRetornoAlmocoDepois) addDelay(d3, 'Retorno almoço em atraso');
                          }
                          // addDelay(lunchDuration, 'Almoço incompleto'); // Removido para não penalizar duplamente, usando a regra padrão do sistema.
                          hasIncomplete = true;
                      } else {
                          const actualLunchDuration = timeDiff(t2_raw, t3_raw);
                          if (actualLunchDuration < lunchDuration) {
                              addExtra(lunchDuration - actualLunchDuration, 'Intervalo de almoço reduzido');
                          } else if (actualLunchDuration > lunchDuration) {
                              addDelay(actualLunchDuration - lunchDuration, 'Intervalo de almoço excedido');
                          }
                      }
                  } else {
                      hasIncomplete = true;
                      if (t1_raw !== null && t2_raw !== null && t3_raw === null && t4_raw === null) {
                          let d1 = getDiff(t1_raw, expEntrada);
                          if (d1 < -tolEntAntes) addExtra(Math.abs(d1), 'Entrada antecipada');
                          if (d1 > tolEntDepois) addDelay(d1, 'Entrada em atraso');

                          let d2 = getDiff(t2_raw, expSaidaAlmoco);
                          if (d2 > tolSaidaAlmocoDepois) addExtra(d2, 'Saída almoço além do horário');
                          if (d2 < -tolSaidaAlmocoAntes) addDelay(Math.abs(d2), 'Saída almoço antecipada');
                          
                          addDelay(expectedAfternoon, 'Falta à tarde');
                      } else if (t1_raw === null && t2_raw === null && t3_raw !== null && t4_raw !== null) {
                          let d3 = getDiff(t3_raw, expRetornoAlmoco);
                          if (d3 < -tolRetornoAlmocoAntes) addExtra(Math.abs(d3), 'Retorno almoço antecipado');
                          if (d3 > tolRetornoAlmocoDepois) addDelay(d3, 'Retorno almoço em atraso');

                          let d4 = getDiff(t4_raw, expSaida);
                          if (d4 > tolSaidaDepois) addExtra(d4, 'Saída além do horário');
                          if (d4 < -tolSaidaAntes) addDelay(Math.abs(d4), 'Saída antecipada');

                          addDelay(expectedMorning, 'Falta de manhã');
                      } else {
                          addDelay(expectedTotal, 'Falta o dia todo ou marcações inconsistentes');
                      }
                  }
              }
          }

          let worked = expectedTotal - delay + extra;
          if (worked < 0) worked = 0;

          day.workedMin = worked;
          day.hasIncomplete = hasIncomplete;
          day.extraMin = extra;
          day.delayMin = delay;
          day.extraDetails = extraDetails;
          day.delayDetails = delayDetails;
       });
    });
    return groups;
  }, [displayPontos, baseConfigPonto]);
    const exportarFolhaPontoPDF = async () => {
    try {
      const [jspdf, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);
      const jsPDF = jspdf.default;
      const autoTable = autoTableModule.default;
      const doc = new jsPDF({ orientation: 'landscape' });
      
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      let isFirstPage = true;

      Object.entries(groupedPontos).forEach(([userName, dates]) => {
        const sortedDays = Object.values(dates).sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime());
        
        // Group days by cycle (10th to 9th)
        const cycles: Record<string, any[]> = {};
        sortedDays.forEach((day: any) => {
            const d = day.dateObj;
            let cycleYear = d.getFullYear();
            let cycleMonth = d.getMonth();
            if (d.getDate() >= 10) {
                cycleMonth += 1; // Ends next month
                if (cycleMonth > 11) {
                    cycleMonth = 0;
                    cycleYear++;
                }
            }
            const cycleKey = `${cycleYear}-${cycleMonth.toString().padStart(2, '0')}`;
            if (!cycles[cycleKey]) cycles[cycleKey] = [];
            cycles[cycleKey].push(day);
        });

        // Recuperar Configurações
        const userEmail = sortedDays.length > 0 ? (sortedDays[0]['Entrada']?.usuario_email || userName) : userName;
        const uConfig = baseConfigPonto.userConfigs?.[userEmail] || baseConfigPonto;
        const expectedMorning = (timeToMin(uConfig.hora_inicio_almoco) - timeToMin(uConfig.hora_entrada));
        const expectedAfternoon = (timeToMin(uConfig.hora_saida) - timeToMin(uConfig.hora_fim_almoco));
        const expectedTotal = (expectedMorning > 0 ? expectedMorning : 0) + (expectedAfternoon > 0 ? expectedAfternoon : 0);
        const expTotalTime = minToTime(expectedTotal);

        Object.keys(cycles).sort().forEach(cycleKey => {
            if (!isFirstPage) {
              doc.addPage();
            }
            isFirstPage = false;
            
            const cycleDays = cycles[cycleKey];
            
            let startDate = '-';
            let endDate = '-';
            if (cycleDays.length > 0) {
                startDate = cycleDays[0].dateStr;
                endDate = cycleDays[cycleDays.length - 1].dateStr;
            }
            
            // Determinar o mês/ano base do ciclo
            const [cYear, cMonth] = cycleKey.split('-');
            const monthNameObj = new Date(parseInt(cYear), parseInt(cMonth), 1);
            const monthName = monthNameObj.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
            const yearNum = cYear;

            // HEADER (Landscape: max width 297, center 148.5, rect width 269)
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(31, 41, 55); // primary #1F2937
            doc.text('CONTROLE DE PONTO - DEPARTAMENTO PESSOAL', 148.5, 20, { align: 'center' });
            
            // Header Fields - Retângulo
            doc.setDrawColor(55, 65, 81); // border #374151
            doc.setLineWidth(0.3);
            doc.rect(14, 25, 269, 20);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Empresa:', 16, 31);
            doc.setFont('helvetica', 'normal');
            doc.text('FREITAS HUB AGÊNCIA', 35, 31);

            doc.setFont('helvetica', 'bold');
            doc.text('Funcionário:', 16, 38);
            doc.setFont('helvetica', 'normal');
            doc.text(userName, 40, 38);
            
            doc.setFont('helvetica', 'bold');
            doc.text('Período:', 110, 31);
            doc.setFont('helvetica', 'normal');
            doc.text(`10/${(parseInt(cMonth) === 0 ? 12 : parseInt(cMonth)).toString().padStart(2, '0')}/${parseInt(cMonth) === 0 ? parseInt(cYear) - 1 : cYear} a 09/${(parseInt(cMonth) + 1).toString().padStart(2, '0')}/${cYear}`, 128, 31);
            
            doc.setFont('helvetica', 'bold');
            doc.text('Mês Ref:', 110, 38);
            doc.setFont('helvetica', 'normal');
            doc.text(`${monthName} / ${yearNum}`, 128, 38);

            // Header Schedule Config
            doc.setFont('helvetica', 'bold');
            doc.text('Jornada:', 200, 31);
            doc.setFont('helvetica', 'normal');
            doc.text(`${uConfig.hora_entrada} às ${uConfig.hora_inicio_almoco} / ${uConfig.hora_fim_almoco} às ${uConfig.hora_saida} (${expTotalTime}h/dia)`, 218, 31);
            
            doc.setFont('helvetica', 'bold');
            doc.text('Tolerância:', 200, 38);
            doc.setFont('helvetica', 'normal');
            doc.text(`${uConfig.tolerancia_entrada_antes || 5} min`, 222, 38);

            const tableRows: any[] = [];
            let totalWorked = 0;
            let totalExtra = 0;
            let totalDelay = 0;
            
            let totalWorkDays = 0;
            let totalSaturdays = 0;
            let totalSundays = 0;
            
            const allObservations: string[] = [];

            cycleDays.forEach((day: any) => {
              if (day.workedMin !== null) totalWorked += day.workedMin || 0;
              totalExtra += day.extraMin || 0;
              totalDelay += day.delayMin || 0;
              
              const dLower = day.dayOfWeek.toLowerCase();
              if (dLower.includes('sáb')) totalSaturdays++;
              else if (dLower.includes('dom')) totalSundays++;
              else totalWorkDays++;
              
              let dayObs = '';
              
              ['Entrada', 'Saída Almoço', 'Retorno Almoço', 'Saída'].forEach(tipo => {
                  if (day[tipo] && day[tipo].justificativa) {
                     dayObs += `${tipo}: ${day[tipo].justificativa} `;
                  }
              });
              

              
              if (dayObs.trim()) {
                  allObservations.push(`${day.dateStr}: ${dayObs.trim()}`);
              }

              tableRows.push([
                day.dateStr,
                day.dayOfWeek,
                day['Entrada'] ? day['Entrada'].time : '-',
                day['Saída Almoço'] ? day['Saída Almoço'].time : '-',
                day['Retorno Almoço'] ? day['Retorno Almoço'].time : '-',
                day['Saída'] ? day['Saída'].time : '-',
                expTotalTime,
                day.workedMin !== null ? minToTime(day.workedMin) : '-',
                day.extraMin > 0 ? minToTime(day.extraMin) : '-',
                day.delayMin > 0 ? minToTime(day.delayMin) : '-',
                '-'
              ]);
            });

            // expected total for month
            const totalExpectedMonth = (totalWorkDays * expectedTotal);

            autoTable(doc, {
                startY: 50,
                head: [["Data", "Dia", "Entrada", "Saída Almoço", "Retorno", "Saída", "Jornada Prevista", "Horas Trab", "Horas Ext", "Atrasos", "Banco"]],
                body: tableRows,
                theme: 'grid',
                headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
                styles: { fontSize: 8, lineColor: [55, 65, 81], lineWidth: 0.1, cellPadding: 1.5, halign: 'center' },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 20 },
                    2: { cellWidth: 20 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 25 },
                    5: { cellWidth: 20 },
                    6: { cellWidth: 30 },
                    7: { cellWidth: 25, fontStyle: 'bold' },
                    8: { cellWidth: 25, textColor: [22, 163, 74] },
                    9: { cellWidth: 25, textColor: [220, 38, 38] },
                    10: { cellWidth: 20 }
                },
                didParseCell: function (data: any) {
                    if (data.section === 'body') {
                        const rowData = data.row.raw;
                        const dayStr = rowData[1].toLowerCase();
                        if (dayStr.includes('sáb') || dayStr.includes('dom')) {
                            data.cell.styles.fillColor = [243, 244, 246]; // weekend #F3F4F6
                        }
                    }
                }
            });

            let currentY = (doc as any).lastAutoTable.finalY + 5;
            
            // Resumo do Banco de Horas
            if (currentY > 170) {
               doc.addPage();
               currentY = 20;
            }

            doc.setDrawColor(55, 65, 81);
            doc.setLineWidth(0.3);
            doc.rect(14, currentY, 269, 20);
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('RESUMO MENSAL', 16, currentY + 6);
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            
            doc.text(`Dias Trabalhados: ${totalWorkDays} | Sábados: ${totalSaturdays} | Domingos: ${totalSundays} | Feriados: 0`, 16, currentY + 14);
            
            doc.setFont('helvetica', 'bold');
            doc.text(`Horas Previstas: ${minToTime(totalExpectedMonth)}`, 120, currentY + 7);
            doc.text(`Horas Trabalhadas: ${minToTime(totalWorked)}`, 120, currentY + 14);
            
            doc.text(`Horas Extras: ${minToTime(totalExtra)}`, 190, currentY + 7);
            doc.text(`Horas Atraso: ${minToTime(totalDelay)}`, 190, currentY + 14);
            
            doc.text('Saldo Banco de Horas: ---', 240, currentY + 14);

            currentY += 25;
            
            if (allObservations.length > 0) {
                if (currentY > 180) {
                   doc.addPage();
                   currentY = 20;
                }
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.text('OBSERVAÇÕES (ATRASOS / ANTECIPAÇÕES / JUSTIFICATIVAS)', 14, currentY);
                currentY += 5;
                
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                allObservations.forEach(obs => {
                    const lines = doc.splitTextToSize(obs, 269);
                    if (currentY + (lines.length * 4) > 190) {
                        doc.addPage();
                        currentY = 20;
                    }
                    doc.text(lines, 14, currentY);
                    currentY += (lines.length * 4) + 1;
                });
            }

            // Signatures
            if (currentY > 180) {
               doc.addPage();
               currentY = 30;
            } else {
               currentY = Math.max(currentY + 15, 185);
            }
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            
            doc.line(30, currentY, 120, currentY);
            doc.line(177, currentY, 267, currentY);
            currentY += 5;
            doc.text('Assinatura do Funcionário', 75, currentY, { align: 'center' });
            doc.text('Assinatura do Gerente', 222, currentY, { align: 'center' });
            
            currentY += 10;
            doc.text(`Data: ____/____/______`, 75, currentY, { align: 'center' });
            doc.text(`Data: ____/____/______`, 222, currentY, { align: 'center' });
        });
      });
      
      if (isFirstPage) { 
          doc.setFontSize(14);
         doc.text('Nenhum registro encontrado no período.', 148.5, 50, { align: 'center' });
      }

      doc.save(`folha_de_ponto_${dateStr.replace(/\//g, '-')}.pdf`);
    } catch (err: any) {
      if(err?.message?.includes("Failed to fetch")) console.warn("Erro ao gerar PDF:", err); else console.error("Erro ao gerar PDF:", err);
      alert("Falha ao gerar o PDF. Verifique sua conexão de rede ou tente novamente.");
    }
  };
  const renderCell = (pointData: any, typeColorClass: string) => {
    if (!pointData) return <span className="text-slate-600">-</span>;
    const justifyIcon = pointData.justificativa ? <span title={pointData.justificativa} className="ml-1 text-[10px] text-red-400 cursor-help">ℹ️</span> : null;
    if (USER_PROFILES[currentUserProfile]?.role === 'administrator') {
      return (
        <button 
          onClick={() => openEditModal(pointData)}
          className={`${typeColorClass} hover:text-white transition-colors cursor-pointer bg-slate-800/40 hover:bg-slate-700 px-2 py-1 rounded w-full border border-transparent hover:border-slate-500 flex items-center justify-center`}
          title={`Editar ou Excluir${pointData.justificativa ? ' | Motivo: ' + pointData.justificativa : ''}`}
        >
          {pointData.time}{justifyIcon}
          <span className="ml-2 text-[10px] text-slate-500 hidden group-hover:inline-block">✎</span>
        </button>
      );
    }
    return <span className={`${typeColorClass} flex items-center justify-center`}>{pointData.time}{justifyIcon}</span>;
  };

  return (
    <div className="space-y-4 sm:space-y-8 max-w-4xl mx-auto relative">
      <div className="text-center space-y-4 mb-8 relative">
        <div className="flex items-center justify-center relative">
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter">Ponto Eletrônico</h2>
          {USER_PROFILES[currentUserProfile]?.role === 'administrator' && (
             <button onClick={() => setShowSettings(true)} className="absolute right-0 text-slate-500 hover:text-emerald-400 transition-colors" title="Configurações de Ponto">
               <Settings size={24} />
             </button>
          )}
        </div>
        <div className="text-5xl sm:text-7xl font-mono font-bold text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
          {currentTime.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
        </div>
        <p className="text-slate-400 font-bold uppercase tracking-widest">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Sao_Paulo' })}</p>
      </div>

      {!USER_PROFILES[currentUserProfile]?.permissions?.ponto_history_only && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button onClick={() => initiatePonto('Entrada')} disabled={isProcessing} className="py-6 px-4 text-sm font-black tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white w-full shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          {isProcessing ? 'Registrando...' : 'ENTRADA'}
        </Button>
        <Button onClick={() => initiatePonto('Saída Almoço')} disabled={isProcessing} className="py-6 px-4 text-sm font-black tracking-widest bg-amber-600 hover:bg-amber-500 text-white w-full shadow-[0_0_15px_rgba(245,158,11,0.3)]">
          {isProcessing ? 'Registrando...' : 'SAÍDA ALMOÇO'}
        </Button>
        <Button onClick={() => initiatePonto('Retorno Almoço')} disabled={isProcessing} className="py-6 px-4 text-sm font-black tracking-widest bg-blue-600 hover:bg-blue-500 text-white w-full shadow-[0_0_15px_rgba(37,99,235,0.3)]">
          {isProcessing ? 'Registrando...' : 'RETORNO ALMOÇO'}
        </Button>
        <Button onClick={() => initiatePonto('Saída')} disabled={isProcessing} className="py-6 px-4 text-sm font-black tracking-widest bg-red-600 hover:bg-red-500 text-white w-full shadow-[0_0_15px_rgba(220,38,38,0.3)]">
          {isProcessing ? 'Registrando...' : 'SAÍDA'}
        </Button>
      </div>
      )}
      
      <div className="flex justify-center mt-8 gap-4 flex-wrap">
        <Button onClick={() => setShowHistory(true)} variant="secondary" className="py-4 px-8 text-sm font-black tracking-widest bg-slate-800 hover:bg-slate-700 text-white">
          VER HISTÓRICO DE PONTO
        </Button>
        {permissions?.canExportReport('ponto') && (
        <Button onClick={exportarFolhaPontoPDF} variant="secondary" className="py-4 px-8 text-sm font-black tracking-widest bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20">
          <Download size={16} className="mr-2" /> RELATÓRIO PDF
        </Button>
        )}
        {USER_PROFILES[currentUserProfile]?.role === 'administrator' && (
        <Button onClick={() => setShowManualAdd(true)} variant="secondary" className="py-4 px-8 text-sm font-black tracking-widest bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20">
          REGISTRAR MANUALMENTE
        </Button>
        )}
      </div>

      {/* MODAL DE ADIÇÃO MANUAL DE PONTO */}
      {showManualAdd && USER_PROFILES[currentUserProfile]?.role === 'administrator' && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-white uppercase flex items-center gap-2">Adicionar Ponto Manual</h4>
              <button onClick={() => setShowManualAdd(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Funcionário</label>
                  <select value={manualAddData.usuario} onChange={(e) => setManualAddData({...manualAddData, usuario: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-emerald-500 font-medium appearance-none">
                     {Object.entries(USER_PROFILES).map(([email, p]: any) => (
                        <option key={email} value={email}>{p.label}</option>
                     ))}
                  </select>
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Tipo de Ponto</label>
                  <select value={manualAddData.tipo} onChange={(e) => setManualAddData({...manualAddData, tipo: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-emerald-500 font-medium appearance-none">
                     <option value="Entrada">Entrada</option>
                     <option value="Saída Almoço">Saída Almoço</option>
                     <option value="Retorno Almoço">Retorno Almoço</option>
                     <option value="Saída">Saída</option>
                  </select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Data</label>
                    <input type="date" value={manualAddData.data} onChange={(e) => setManualAddData({...manualAddData, data: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-emerald-500 font-medium" />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Horário</label>
                    <input type="time" value={manualAddData.hora} onChange={(e) => setManualAddData({...manualAddData, hora: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-emerald-500 font-medium" />
                 </div>
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Justificativa (Obrigatória)</label>
                  <textarea 
                    value={manualAddData.justificativa} 
                    onChange={(e) => setManualAddData({...manualAddData, justificativa: e.target.value})} 
                    placeholder="Ex: Esqueceu de registrar..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-emerald-500 font-medium h-24 resize-none" 
                  />
               </div>
               <div className="pt-4">
                  <Button onClick={saveManualPonto} disabled={isProcessing} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-widest text-xs py-4">
                     {isProcessing ? 'SALVANDO...' : 'REGISTRAR PONTO MANUAL'}
                  </Button>
               </div>
            </div>
          </motion.div>
        </div>
      )}

            {/* MODAL DE JUSTIFICATIVA (ATRASO/ANTECIPAÇÃO) */}
      {pendingPonto && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-white uppercase flex items-center gap-2">Justificativa Necessária</h4>
              <button onClick={() => setPendingPonto(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-400">O registro de <span className="font-bold text-white">{pendingPonto}</span> está fora do horário normal. Por favor, justifique o motivo.</p>
              <div>
                <textarea 
                  value={justificativa} 
                  onChange={(e) => setJustificativa(e.target.value)} 
                  placeholder="Ex: Trânsito, Consulta Médica..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-emerald-500 font-medium h-24 resize-none" 
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={confirmPontoWithJustificativa} disabled={isProcessing} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-widest text-xs py-3">
                  {isProcessing ? 'SALVANDO...' : 'CONFIRMAR'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE PONTO */}
      {editingPonto && USER_PROFILES[currentUserProfile]?.role === 'administrator' && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-white uppercase flex items-center gap-2"><Settings size={20} /> Editar Ponto</h4>
              <button onClick={() => setEditingPonto(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Horário</label>
                  <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-emerald-500 font-medium" />
               </div>
               <div className="flex gap-2 pt-4">
                  <Button onClick={saveEditPonto} disabled={isProcessing} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-widest text-xs py-3">
                     SALVAR
                  </Button>
                  <Button onClick={deletePonto} disabled={isProcessing} className={`flex-1 font-bold tracking-widest text-xs py-3 ${confirmDelete ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-red-400'}`}>
                     {confirmDelete ? 'CONFIRMAR EXCLUSÃO' : 'EXCLUIR'}
                  </Button>
               </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL DE HISTÓRICO DE PONTO */}
      {showHistory && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h4 className="text-xl font-bold text-white uppercase flex items-center gap-2"><Clock size={20} /> Histórico de Ponto</h4>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {Object.entries(groupedPontos).map(([userName, dates]: any) => (
                <div key={userName} className="bg-slate-950 p-6 rounded-2xl border border-slate-800/60">
                   <h5 className="text-lg font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">{userName}</h5>
                   <div className="overflow-x-auto w-full max-w-full">
                     <table className="w-full text-left text-sm text-slate-400 min-w-[600px]">
                       <thead className="text-[10px] uppercase bg-slate-900 text-slate-500">
                         <tr>
                           <th className="px-4 py-3 font-black tracking-widest rounded-tl-lg">Data</th>
                           <th className="px-4 py-3 font-black tracking-widest">Entrada</th>
                           <th className="px-4 py-3 font-black tracking-widest">Saída Almoço</th>
                           <th className="px-4 py-3 font-black tracking-widest">Retorno Almoço</th>
                           <th className="px-4 py-3 font-black tracking-widest">Saída</th>
                           <th className="px-4 py-3 font-black tracking-widest">Horas Trab.</th>
                           <th className="px-4 py-3 font-black tracking-widest">Extras</th>
                           <th className="px-4 py-3 font-black tracking-widest rounded-tr-lg">Atrasos</th>
                         </tr>
                       </thead>
                       <tbody>
                         {Object.values(dates).sort((a: any, b: any) => b.dateObj.getTime() - a.dateObj.getTime()).map((day: any) => (
                           <tr key={day.dateStr} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                             <td className="px-4 py-4 whitespace-nowrap align-top">
                               <div className="font-bold text-slate-300">{day.dateStr}</div>
                               <div className="text-[10px] uppercase tracking-widest text-slate-500">{day.dayOfWeek}</div>
                             </td>
                             <td className="px-4 py-4 align-top">{renderCell(day['Entrada'], 'text-emerald-400')}</td>
                             <td className="px-4 py-4 align-top">{renderCell(day['Saída Almoço'], 'text-amber-400')}</td>
                             <td className="px-4 py-4 align-top">{renderCell(day['Retorno Almoço'], 'text-blue-400')}</td>
                             <td className="px-4 py-4 align-top">{renderCell(day['Saída'], 'text-red-400')}</td>
                             <td className="px-4 py-4 font-mono font-bold text-slate-300 flex items-center gap-2 align-top">
                                {day.workedMin !== null ? minToTime(day.workedMin) : '-'}
                                {day.hasIncomplete && <span className="text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest font-black">Inc.</span>}
                             </td>
                             <td className="px-4 py-4 font-mono font-bold text-emerald-400 align-top">
                                {day.extraMin > 0 ? (
                                    <div>
                                        <div>{minToTime(day.extraMin)}</div>
                                        {day.extraDetails && day.extraDetails.length > 0 && (
                                            <div className="text-[9px] font-sans text-emerald-500/70 font-normal uppercase mt-1 space-y-0.5 whitespace-nowrap">
                                                {day.extraDetails.map((det: string, i: number) => <div key={i}>{det}</div>)}
                                            </div>
                                        )}
                                    </div>
                                ) : '-'}
                             </td>
                             <td className="px-4 py-4 font-mono font-bold text-red-400 align-top">
                                {day.delayMin > 0 ? (
                                    <div>
                                        <div>{minToTime(day.delayMin)}</div>
                                        {day.delayDetails && day.delayDetails.length > 0 && (
                                            <div className="text-[9px] font-sans text-red-500/70 font-normal uppercase mt-1 space-y-0.5 whitespace-nowrap">
                                                {day.delayDetails.map((det: string, i: number) => <div key={i}>{det}</div>)}
                                            </div>
                                        )}
                                    </div>
                                ) : '-'}
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                   <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest border-t border-slate-800 pt-4">
                      <div className="text-slate-400">Total Trab: <span className="text-white">{minToTime(Object.values(dates).reduce((acc: number, curr: any) => acc + (curr.workedMin || 0), 0))}</span></div>
                      <div className="text-emerald-400">Total Extras: <span className="text-white">{minToTime(Object.values(dates).reduce((acc: number, curr: any) => acc + (curr.extraMin || 0), 0))}</span></div>
                      <div className="text-red-400">Total Atrasos: <span className="text-white">{minToTime(Object.values(dates).reduce((acc: number, curr: any) => acc + (curr.delayMin || 0), 0))}</span></div>
                   </div>
                </div>
              ))}
              {Object.keys(groupedPontos).length === 0 && (
                <div className="text-center py-12 text-slate-500">
                   <Clock size={48} className="mx-auto mb-4 opacity-20" />
                   <p className="font-bold uppercase tracking-widest text-sm">Nenhum registro encontrado</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL DE CONFIGURAÇÕES */}
      {showSettings && USER_PROFILES[currentUserProfile]?.role === 'administrator' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-slate-800 flex-shrink-0 flex justify-between items-center">
              <h4 className="text-xl font-bold text-white uppercase flex items-center gap-2"><Settings size={20} /> Configurações de Horários</h4>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
            <div className="mb-6 bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Configurar Para</label>
               <select 
                 value={settingsUserFilter} 
                 onChange={(e) => setSettingsUserFilter(e.target.value)}
                 className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-emerald-500 font-medium"
               >
                 <option value="all">Padrão da Empresa (Todos)</option>
                 {RESPONSAVEIS.map((r: any) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                 ))}
               </select>
            </div>
            <div className="space-y-6">
              {/* ENTRADA */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <h5 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4">Entrada</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Horário</label>
                    <input type="time" value={settingsFormData.hora_entrada || '08:00'} onChange={(e) => setSettingsFormData({...settingsFormData, hora_entrada: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-emerald-500 outline-none text-sm text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Tolerância Antes (min)</label>
                    <input type="number" min="0" value={settingsFormData.tolerancia_entrada_antes ?? 15} onChange={(e) => setSettingsFormData({...settingsFormData, tolerancia_entrada_antes: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-emerald-500 outline-none text-sm text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Tolerância Depois (min)</label>
                    <input type="number" min="0" value={settingsFormData.tolerancia_entrada_depois ?? 15} onChange={(e) => setSettingsFormData({...settingsFormData, tolerancia_entrada_depois: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-emerald-500 outline-none text-sm text-center" />
                  </div>
                </div>
              </div>

              {/* INÍCIO ALMOÇO */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <h5 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4">Saída Almoço</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Horário</label>
                    <input type="time" value={settingsFormData.hora_inicio_almoco || '12:00'} onChange={(e) => setSettingsFormData({...settingsFormData, hora_inicio_almoco: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-emerald-500 outline-none text-sm text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Tolerância Antes (min)</label>
                    <input type="number" min="0" value={settingsFormData.tolerancia_inicio_almoco_antes ?? 15} onChange={(e) => setSettingsFormData({...settingsFormData, tolerancia_inicio_almoco_antes: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-emerald-500 outline-none text-sm text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Tolerância Depois (min)</label>
                    <input type="number" min="0" value={settingsFormData.tolerancia_inicio_almoco_depois ?? 15} onChange={(e) => setSettingsFormData({...settingsFormData, tolerancia_inicio_almoco_depois: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-emerald-500 outline-none text-sm text-center" />
                  </div>
                </div>
              </div>

              {/* DURACAO ALMOCO */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 mb-4">
                <h5 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4">Tempo de Almoço (Opcional)</h5>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Duração (minutos)</label>
                    <input type="number" min="0" value={settingsFormData.duracao_almoco ?? ''} onChange={(e) => setSettingsFormData({...settingsFormData, duracao_almoco: Number(e.target.value) || 0})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-emerald-500 outline-none text-sm text-center" />
                  </div>
                </div>
              </div>
              {/* FIM ALMOÇO */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <h5 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">Retorno Almoço</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Horário</label>
                    <input type="time" value={settingsFormData.hora_fim_almoco || '13:30'} onChange={(e) => setSettingsFormData({...settingsFormData, hora_fim_almoco: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-emerald-500 outline-none text-sm text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Tolerância Antes (min)</label>
                    <input type="number" min="0" value={settingsFormData.tolerancia_fim_almoco_antes ?? 15} onChange={(e) => setSettingsFormData({...settingsFormData, tolerancia_fim_almoco_antes: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-emerald-500 outline-none text-sm text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Tolerância Depois (min)</label>
                    <input type="number" min="0" value={settingsFormData.tolerancia_fim_almoco_depois ?? 15} onChange={(e) => setSettingsFormData({...settingsFormData, tolerancia_fim_almoco_depois: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-emerald-500 outline-none text-sm text-center" />
                  </div>
                </div>
              </div>

              {/* SAÍDA */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <h5 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-4">Saída</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Horário</label>
                    <input type="time" value={settingsFormData.hora_saida || '18:00'} onChange={(e) => setSettingsFormData({...settingsFormData, hora_saida: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-emerald-500 outline-none text-sm text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Tolerância Antes (min)</label>
                    <input type="number" min="0" value={settingsFormData.tolerancia_saida_antes ?? 15} onChange={(e) => setSettingsFormData({...settingsFormData, tolerancia_saida_antes: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-emerald-500 outline-none text-sm text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Tolerância Depois (min)</label>
                    <input type="number" min="0" value={settingsFormData.tolerancia_saida_depois ?? 15} onChange={(e) => setSettingsFormData({...settingsFormData, tolerancia_saida_depois: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-emerald-500 outline-none text-sm text-center" />
                  </div>
                </div>
              </div>

            </div>

            </div>
            <div className="p-6 border-t border-slate-800 flex-shrink-0 bg-slate-900">
              <Button onClick={saveSettings} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-500 text-white w-full font-bold tracking-widest text-xs py-4">
                {isProcessing ? '...' : 'SALVAR CONFIGURAÇÕES'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportDateStart, setReportDateStart] = useState('');
  const [reportDateEnd, setReportDateEnd] = useState('');
  const [reportType, setReportType] = useState<string>('');
  const [reportModalUser, setReportModalUser] = useState('all');
  const [user, setUser] = useState<any>(null);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState('');
  const [activeTab, setActiveTab] = useState('ponto');
  const [loading, setLoading] = useState(true);
  const [showGreeting, setShowGreeting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chartMonthOffset, setChartMonthOffset] = useState(0);
  const [financialDisplayMode, setFinancialDisplayMode] = useState<'both' | 'currency' | 'percentage'>('both');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  
  
  // Estados dos Dados
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [pontos, setPontos] = useState<any[]>([]);
  const [agendaFilter, setAgendaFilter] = useState('Pendente');
  const [agendaSearch, setAgendaSearch] = useState('');
  const [taskFilterPerson, setTaskFilterPerson] = useState(currentUserProfile);
  const [taskFilterStatus, setTaskFilterStatus] = useState('Pendentes');
  const [taskSearch, setTaskSearch] = useState('');

  const [reportFilterUser, setReportFilterUser] = useState('all');
  const [reportFilterDateStart, setReportFilterDateStart] = useState(() => getBRTDateString());
  const [reportFilterDateEnd, setReportFilterDateEnd] = useState(() => getBRTDateString());
  const [summaryForm, setSummaryForm] = useState({
    atividades: '', pendencias: '', dificuldades: '', observacoes: '', prioridades: ''
  });

  // Estados de Formulário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estado para exclusão
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Gastos Fixos
  const [fixedExpensesNotifications, setFixedExpensesNotifications] = useState<any[]>([]);
  const [clientPaymentNotifications, setClientPaymentNotifications] = useState<any[]>([]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const notifs: any[] = [];
    clients.forEach((c: any) => {
      if (c.status === 'Cliente Ativo') {
        if (c.dia_pagamento) {
          const diaPagamento = parseInt(c.dia_pagamento, 10);
          if (!isNaN(diaPagamento)) {
            const todayRaw = new Date();
            const prevMonth = new Date(todayRaw.getFullYear(), todayRaw.getMonth() - 1, diaPagamento);
            const currentMonth = new Date(todayRaw.getFullYear(), todayRaw.getMonth(), diaPagamento);
            const nextMonth = new Date(todayRaw.getFullYear(), todayRaw.getMonth() + 1, diaPagamento);
            
            const distPrev = (todayRaw.getTime() - prevMonth.getTime()) / (1000 * 3600 * 24);
            const distCurr = (todayRaw.getTime() - currentMonth.getTime()) / (1000 * 3600 * 24);
            const distNext = (todayRaw.getTime() - nextMonth.getTime()) / (1000 * 3600 * 24);
            
            let closestDist = distCurr;
            
            if (Math.abs(distPrev) < Math.abs(closestDist)) { closestDist = distPrev; }
            if (Math.abs(distNext) < Math.abs(closestDist)) { closestDist = distNext; }
            
            // Notify 3 days before up to 3 days after
            if (closestDist >= -3 && closestDist <= 3) {
               let msg = '';
               if (closestDist < -1) msg = `Pagamento vence em ${Math.ceil(Math.abs(closestDist))} dias`;
               else if (closestDist > 1) msg = `Pagamento venceu há ${Math.floor(closestDist)} dias`;
               else if (closestDist > 0 && closestDist <= 1) msg = `Pagamento venceu ontem`;
               else if (closestDist < 0 && closestDist >= -1) msg = `Pagamento vence amanhã`;
               else msg = `Pagamento vence hoje`;
               
               notifs.push({
                 id: c.id + '_pag',
                 title: c.nome || c.empresa,
                 msg: msg,
                 dia: diaPagamento,
                 type: 'pagamento'
               });
            }
          }
        }
        
        if (c.data_fim_contrato) {
          const [year, month, day] = c.data_fim_contrato.split('-');
          if (year && month && day) {
            const endData = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
            endData.setHours(0,0,0,0);
            const diffTime = endData.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays >= -5 && diffDays <= 15) {
               let msg = '';
               if (diffDays === 0) msg = 'Contrato termina hoje';
               else if (diffDays === 1) msg = 'Contrato termina amanhã';
               else if (diffDays > 1) msg = `Contrato termina em ${diffDays} dias`;
               else if (diffDays === -1) msg = 'Contrato terminou ontem';
               else msg = `Contrato terminou há ${Math.abs(diffDays)} dias`;
               
               notifs.push({
                 id: c.id + '_contrato',
                 title: c.nome || c.empresa,
                 msg: msg,
                 dia: c.data_fim_contrato.split('-').reverse().join('/'),
                 type: 'contrato'
               });
            }
          }
        }
      }
    });
    setClientPaymentNotifications(notifs);
  }, [clients]);
  useEffect(() => {
    let mounted = true;
    if (tasks.length > 0 && transactions.length > 0) {
      const notifications = getPendingFixedExpensesNotifications(tasks, transactions);
      if (mounted) setFixedExpensesNotifications(notifications);
      
      syncFixedExpenses(tasks, transactions, supabase).then(inserted => {
        if (inserted && mounted) fetchCollections('transactions');
      }).catch((err: any) => { if(err?.message === 'Failed to fetch') console.warn(err); else if(err?.message?.includes('Failed to fetch')) { console.warn(err); } else { console.error(err); } });
    }
    return () => { mounted = false; };
  }, [tasks, transactions]);

  // Failsafe: Reset processing state if it gets stuck

  // Lógica de Permissões Granulares
  const currentPermissions = useMemo(() => USER_PROFILES[currentUserProfile]?.permissions || {}, [currentUserProfile]);
  const isAdmin = isSystemAdmin; // Administrador do sistema tem controle total

  const permissions = useMemo(() => {
    const p = currentPermissions;
    const canView = (tab: string) => {
      if (!p || !p.allowed_tabs) return false;
      return p.allowed_tabs.includes(tab);
    };
    const canEdit = (tab: string) => {
      if (!p) return false;
      if (tab === 'financial_control' || tab === 'transactions') return p.financial === 'full';
      if (tab === 'agenda' || tab === 'appointments') return p.allowed_tabs?.includes('agenda');
      if (tab === 'servicos') return p.allowed_tabs?.includes('servicos');
      if (tab === 'clients' || tab === 'tasks' || tab === 'ponto') return p.allowed_tabs?.includes(tab);
      return false;
    };
    const canDelete = (tab?: string) => {
      if (!p || p.can_delete === false) return false;
      if (tab === 'financial_control' || tab === 'transactions') return p.financial === 'full';
      if (tab === 'agenda' || tab === 'appointments') return p.allowed_tabs?.includes('agenda');
      if (tab === 'servicos') return p.allowed_tabs?.includes('servicos');
      if (tab === 'clients' || tab === 'tasks' || tab === 'ponto') return p.allowed_tabs?.includes(tab);
      return false;
    };
    const canExportReport = (reportType: string) => {
      if (reportType === 'finance') {
        return currentUserProfile === 'vagnergestor360@gmail.com' || currentUserProfile === 'nubia360admin@gmail.com';
      }
      if (p?.reports === 'full') return true;
      if (reportType === 'tasks' && p?.allowed_tabs?.includes('tasks')) return true;
      return false;
    };
    return { canView, canEdit, canDelete, canExportReport };
  }, [currentPermissions]);

  // Bloqueio de abas protegidas com base em permissões granulares
  useEffect(() => {
    if (!permissions.canView(activeTab)) {
      setActiveTab('ponto');
      setFormData({});
    }
  }, [permissions, activeTab]);

  const handleProfileSwitchRequest = (profileKey: string) => {
    if (profileKey === currentUserProfile) return;
    
    // Rigorosa restrição: apenas administradores podem trocar o perfil
    if (!isSystemAdmin) {
      console.warn("Tentativa de troca de perfil bloqueada: Apenas administradores possuem acesso a esta função.");
      return;
    }

    setCurrentUserProfile(profileKey);
    setTaskFilterPerson(profileKey);
    setSidebarOpen(false);
  };

  useEffect(() => {
    if (user && USER_PROFILES[currentUserProfile]) {
      setShowGreeting(true);
      const timer = setTimeout(() => setShowGreeting(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Auth Observer
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        if(error.message === 'Failed to fetch') { console.warn('Erro na sessão inicial:', error.message); } else { console.error('Erro na sessão inicial:', error.message); }
        setAuthError(`Falha na conexão: ${error.message}`);
      }
      
      const u = session?.user ?? null;
      setUser(u);
      
      if (u?.email) {
        const email = u.email.toLowerCase();
        if (USER_PROFILES[email]) {
          setCurrentUserProfile(email);
          setTaskFilterPerson(email);
          setIsSystemAdmin(USER_PROFILES[email].role === 'administrator' || USER_PROFILES[email].role === 'gestor');
        } else {
          setCurrentUserProfile(email);
          setTaskFilterPerson(email);
          setIsSystemAdmin(false);
        }
      } else {
        setIsSystemAdmin(false);
      }
      setLoading(false);
    }).catch((err: any) => {
      if(err?.message === 'Failed to fetch') { console.warn('Erro ao obter sessão:', err); } else { console.error('Erro ao obter sessão:', err); }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Evento Supabase Auth:', _event, session?.user?.email);
      const u = session?.user ?? null;
      setUser(u);
      
      if (u?.email) {
        const email = u.email.toLowerCase();
        if (USER_PROFILES[email]) {
          setCurrentUserProfile(email);
          setTaskFilterPerson(email);
          setIsSystemAdmin(USER_PROFILES[email].role === 'administrator' || USER_PROFILES[email].role === 'gestor');
        } else {
          setCurrentUserProfile(email);
          setTaskFilterPerson(email);
          setIsSystemAdmin(false);
        }
      } else {
        setIsSystemAdmin(false);
      }
      
      if (_event === 'SIGNED_OUT') {
        setIsSystemAdmin(false);
        setCurrentUserProfile(''); // Reset default
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Funções de Fetch de Dados REUTILIZÁVEIS
  const fetchCollections = async (collectionName?: string) => {
    if (!user) return;

    const collectionsToFetch = collectionName && collectionName !== 'daily_reports'
      ? [{ name: collectionName, setter: getSetter(collectionName) }]
      : [
          { name: 'clients', setter: setClients },
          { name: 'servicos', setter: setServices },
          { name: 'transactions', setter: setTransactions },
          { name: 'appointments', setter: setAppointments },
          { name: 'tasks', setter: setTasks },
          { name: 'pontos', setter: setPontos }
        ];

    const timestamp = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    console.log(`[${timestamp}] 🔄 Iniciando fetch: ${collectionName || 'todas as coleções'}`);

    for (const { name, setter } of collectionsToFetch) {
      if (!setter) continue;

      try {
        // Agora todos os perfis reconhecidos buscam todos os dados para sincronização total
        const { data, error, status } = await supabase
          .from(name)
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          if (status !== 0 && !error?.message?.includes('Failed to fetch')) {
            console.error(`[${timestamp}] ❌ Erro em ${name} (Status ${status}):`, error);
          }
          
          // Tratar JWT Expirado (401 / PGRST303)
          if (status === 401 || error.code === 'PGRST303') {
            console.warn(`[${timestamp}] 🔄 JWT Expirado em ${name}. Tentando atualizar sessão...`);
            const { data: refreshData, error: refreshError } = await supabase.auth.getSession();
            if (refreshError || !refreshData.session) {
              console.error(`[${timestamp}] 🚨 Sessão inválida. Desconectando...`);
              logout();
              return;
            }
            // Se refreshed, a próxima chamada automática ou manual funcionará
            return;
          }

          if (status === 0 || error?.message?.includes('Failed to fetch')) {
            console.warn(`[${timestamp}] ⚠️ Erro de rede (Status 0) ao acessar '${name}'. Isso pode ocorrer se o projeto Supabase estiver pausado, se você estiver offline ou devido a um AdBlocker.`);
            if (!connectionError) {
              setConnectionError("Erro de Rede: Não foi possível conectar ao banco de dados. O projeto pode estar pausado ou a conexão foi bloqueada.");
            }
            setter([]); // Evita travar a UI em loading eterno
            continue;
          } else if (error.code === 'PGRST204') {
            setConnectionError(`Erro de Cache/Esquema em '${name}': O banco de dados mudou. Atualize a página ou verifique as colunas.`);
          } else if (error.code === '42P01' || error.code === 'PGRST205') {
            console.warn(`[${timestamp}] Tabela ${name} não existe. Ignorando.`);
            setter([]);
            if (connectionError && !collectionName) setConnectionError(null);
            continue;
          }
        } else {
          console.log(`[${timestamp}] ✅ ${name} carregado: ${data?.length || 0} registros`);
          
          if (name === 'appointments' && data) {
            const parsedData = data.map((item: any) => {
              if (item.titulo && item.titulo.startsWith('{')) {
                try {
                  const parsed = JSON.parse(item.titulo);
                  return { ...item, status: parsed.status, localizacao: parsed.local, titulo_evento: parsed.titulo_evento, descricao: parsed.desc, hora: parsed.hora, _raw_titulo: item.titulo, titulo: parsed.titulo_evento || parsed.local };
                } catch(e) {}
              }
              return { ...item, localizacao: item.titulo, titulo_evento: item.titulo };
            });
            setter(parsedData);
          } else if (name === 'tasks' && data) {
            const today = new Date();
            today.setHours(0,0,0,0);
            const todayStr = getBRTDateString();
            
            const tasksToRenew = data.filter((t: any) => {
               if (!t.is_recurring) return false;
               if (t.status === 'pending') {
                   // Se está pendente e a data é menor que hoje, trazemos para hoje, ou deixamos sem data se preferir.
                   // Mas se a regra é não ter data, não fazemos nada.
                   return false; 
               }
               // Se está concluída, verificamos quando foi atualizada (concluída)
               if (t.status === 'done') {
                   let updatedDate = null;
                   if (t.updated_at) {
                       const d = new Date(t.updated_at);
                       updatedDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                   }
                   // Se foi concluída ontem ou antes, precisa renovar hoje!
                   if (updatedDate && updatedDate < todayStr) return true;
               }
               return false;
            });

            if (tasksToRenew.length > 0) {
               console.log(`[${timestamp}] 🔄 Renovando ${tasksToRenew.length} tarefas recorrentes...`);
               for (const t of tasksToRenew) {
                  const now = new Date().toISOString();
                  await supabase.from('tasks').update({
                      status: 'pending',
                      updated_at: now
                  }).eq('id', t.id);
                  t.status = 'pending';
                  t.updated_at = now;
               }
            }

            const dailyReps = data.filter((t: any) => t.status === 'daily_report').map((t: any) => {
               try {
                  const parsed = JSON.parse(t.descricao);
                  return {
                     id: t.id,
                     responsavel: t.atribuido_a,
                     data: t.data,
                     created_at: t.created_at,
                     pendencias: parsed.pendencias || '',
                     dificuldades: parsed.dificuldades || '',
                     prioridades: parsed.prioridades || ''
                  };
               } catch(e) {
                  return null;
               }
            }).filter(Boolean);
            setDailyReports(dailyReps);

            setter(data.filter((t: any) => t.status !== 'daily_report'));
          } else {
            if (name === 'clients' && data) {
              const parsedClients = data.map((c: any) => {
                 try {
                    if (c.email && c.email.startsWith('{')) {
                       const parsed = JSON.parse(c.email);
                       return { ...c, ...parsed, _raw_email: c.email };
                    }
                 } catch(e) {}
                 return c;
              });
              setter(parsedClients);
            } else if (name === 'transactions' && data) {
              const parsedTxs = data.map((t: any) => {
                 try {
                    if (t.descricao && t.descricao.startsWith('{')) {
                       const parsed = JSON.parse(t.descricao);
                       return { ...t, ...parsed, _raw_descricao: t.descricao };
                    }
                 } catch(e) {}
                 return t;
              });
              setter(parsedTxs);
            } else {
              setter(data || []);
            }
          }
          if (connectionError && !collectionName) setConnectionError(null);
        }
      } catch (e: any) {
        if (e?.message?.includes('Failed to fetch')) {
          console.warn(`[${timestamp}] ⚠️ Falha de rede em ${name}:`, e);
        } else {
          console.error(`[${timestamp}] 💥 Falha fatal em ${name}:`, e);
        }
      }
    }
  };

  function getSetter(name: string) {
    if (name === 'clients') return setClients;
    if (name === 'servicos') return setServices;
    if (name === 'transactions') return setTransactions;
    if (name === 'appointments') return setAppointments;
    if (name === 'tasks') return setTasks;
    if (name === 'daily_reports') return setDailyReports;
    if (name === 'pontos') return setPontos;
    return null;
  }




    const executeReport = (type: string, start: string, end: string, userFilter: string = 'all') => {
    let periodStr = 'Geral';
    if (start && end) {
      periodStr = `${start.split('-').reverse().join('/')} até ${end.split('-').reverse().join('/')}`;
    } else if (start) {
      periodStr = `A partir de ${start.split('-').reverse().join('/')}`;
    } else if (end) {
      periodStr = `Até ${end.split('-').reverse().join('/')}`;
    }

    if (type === 'agenda') {
      let filtered = appointments;
      if (start) filtered = filtered.filter((a:any) => a.data >= start);
      if (end) filtered = filtered.filter((a:any) => a.data <= end);
      
      const cards = [
        { label: 'Total de Compromissos', value: filtered.length, color: [37, 99, 235] },
        { label: 'Concluídos', value: filtered.filter((a:any) => a.status === 'Concluído').length, color: [34, 197, 94] },
        { label: 'Cancelados', value: filtered.filter((a:any) => a.status === 'Cancelado').length, color: [239, 68, 68] },
        { label: 'Pendentes', value: filtered.filter((a:any) => a.status !== 'Concluído' && a.status !== 'Cancelado').length, color: [245, 158, 11] }
      ];

      const tableData = filtered.map((a: any) => [
        `${a.data ? new Date(a.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : ''} ${a.hora || ''}`.trim(),
        a.titulo_evento || a.titulo || 'Sem título',
        a.localizacao || '-',
        a.descricao || '-',
        a.status === 'Concluído' ? 'Concluído' : a.status === 'Cancelado' ? 'Cancelado' : 'Pendente'
      ]);
      generateExecutiveReport({
        title: 'Agenda de Compromissos',
        period: periodStr,
        cards: cards as any,
        mainTable: {
          title: 'Compromissos',
          head: [['Data/Hora', 'Título', 'Localização', 'Descrição', 'Status']],
          body: tableData,
          didParseCell: function(data: any) {
              if (data.section === 'body' && data.column.index === 4) {
                  if (data.cell.raw === 'Concluído') data.cell.styles.textColor = [34, 197, 94];
                  else if (data.cell.raw === 'Cancelado') data.cell.styles.textColor = [239, 68, 68];
                  else data.cell.styles.textColor = [245, 158, 11];
              }
          }
        },
        filename: `agenda_${getBRTDateString()}.pdf`
      });
    } else if (type === 'clients') {
      let filtered = clients;
      if (start) filtered = filtered.filter((c:any) => (c.created_at || '').substring(0,10) >= start);
      if (end) filtered = filtered.filter((c:any) => (c.created_at || '').substring(0,10) <= end);

      const activeClientsCount = filtered.filter((c: any) => c.status === 'Cliente Ativo').length;
      const leadsCount = filtered.filter((c: any) => ['Proposta Enviada'].includes(c.status || 'Proposta Enviada')).length;
      const negotiatingCount = filtered.filter((c: any) => ['Proposta Enviada', 'Negociação', 'Aguardando Retorno'].includes(c.status)).length;
      const closedSales = filtered.filter((c: any) => c.status === 'Venda Concluída').length;
      const lostLeads = filtered.filter((c: any) => c.status === 'Lead Perdido').length;

      const kpis = [
        { label: 'Total de Leads', value: leadsCount, color: [99, 102, 241] },
        { label: 'Em Neg.', value: negotiatingCount, color: [245, 158, 11] },
        { label: 'Vendas', value: closedSales, color: [34, 197, 94] },
        { label: 'Ativos', value: activeClientsCount, color: [16, 185, 129] },
        { label: 'Perdidos', value: lostLeads, color: [239, 68, 68] }
      ];
      
      const head = [['Nome/Empresa', 'Contato', 'Email', 'Origem', 'Status']];
      
      const tableData = filtered.map((c: any) => {
        return [
          `${c.nome || '-'}\n${c.empresa || ''}`.trim(),
          c.telefone || c.whatsapp || '-',
          c.email || '-',
          c.origem || '-',
          c.status || 'Proposta Enviada'
        ];
      });

      generateExecutiveReport({
        title: 'Relatório Executivo CRM',
        period: periodStr,
        cards: kpis as any,
        mainTable: {
          title: 'Cadastro CRM',
          head: head,
          body: tableData,
          didParseCell: function(data: any) {
              if (data.section === 'body' && data.column.index === 4) {
                  const status = data.cell.raw;
                  if (status === 'Cliente Ativo' || status === 'Venda Concluída') data.cell.styles.textColor = [34, 197, 94];
                  else if (status === 'Lead Perdido') data.cell.styles.textColor = [239, 68, 68];
                  else data.cell.styles.textColor = [99, 102, 241];
              }
          }
        },
        filename: `relatorio_crm_${getBRTDateString()}.pdf`
      });
    } else if (type === 'finance') {
      let filtered = transactions;
      if (start) filtered = filtered.filter((t:any) => t.data >= start);
      if (end) filtered = filtered.filter((t:any) => t.data <= end);
      
      const incTrans = filtered.filter((t: any) => t.type === 'income');
      const expTrans = filtered.filter((t: any) => t.type === 'expense');

      const tIncome = incTrans.reduce((acc: any, t: any) => acc + Number(t.valor || 0), 0);
      const tExpense = expTrans.reduce((acc: any, t: any) => acc + Number(t.valor || 0), 0);
      const tProfit = tIncome - tExpense;
      
      const incCount = incTrans.length;
      const expCount = expTrans.length;
      const avgIncome = incCount > 0 ? tIncome / incCount : 0;
      const avgExpense = expCount > 0 ? tExpense / expCount : 0;

      const cards = [
        { label: 'Receita Total', value: formatVal(tIncome, tIncome, financialDisplayMode), color: [34, 197, 94] },
        { label: 'Despesas', value: formatVal(tExpense, tIncome, financialDisplayMode), color: [239, 68, 68] },
        { label: 'Lucro Líquido', value: formatVal(tProfit, tIncome, financialDisplayMode), color: [37, 99, 235] }
      ];
      
      const resumoTable = [
        ['Quantidade de Registros', incCount.toString(), expCount.toString()],
        ['Valor Total', formatVal(tIncome, tIncome, financialDisplayMode), formatVal(tExpense, tIncome, financialDisplayMode)],
        ['Ticket Médio', formatVal(avgIncome, tIncome, financialDisplayMode), formatVal(avgExpense, tExpense, financialDisplayMode)]
      ];

      const tableData = filtered.map((t: any) => [
        new Date(t.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}),
        t.type === 'income' ? 'Entrada' : 'Saída',
        t.cliente || t.descricao || '--',
        t.categoria || 'Geral',
        t.forma_pagamento || 'PIX',
        formatVal(Number(t.valor), t.type === 'income' ? tIncome : tExpense, financialDisplayMode),
        t.type === 'expense' ? 'Registrada' : (t.status === 'received' ? 'Recebido' : 'Pendente'),
        t.observacao || '--'
      ]);

      const incByCat = incTrans.reduce((acc: any, t: any) => {
        const cat = t.categoria || 'Geral';
        acc[cat] = (acc[cat] || 0) + Number(t.valor || 0);
        return acc;
      }, {});
      
      const expByCat = expTrans.reduce((acc: any, t: any) => {
        const cat = t.categoria || 'Geral';
        acc[cat] = (acc[cat] || 0) + Number(t.valor || 0);
        return acc;
      }, {});

      const incCatData = Object.entries(incByCat).sort((a:any, b:any) => b[1] - a[1]).map(([cat, val]: any) => [
        cat, formatVal(Number(val), tIncome, financialDisplayMode)
      ]);
      const expCatData = Object.entries(expByCat).sort((a:any, b:any) => b[1] - a[1]).map(([cat, val]: any) => [
        cat, formatVal(Number(val), tExpense, financialDisplayMode)
      ]);

      const fixedTasks = tasks.filter((t: any) => t.is_recurring && t.titulo?.startsWith('[GASTO_FIXO]')).map((t: any) => {
          try {
             const data = JSON.parse(t.descricao);
             return { ...data, id: t.id, active: t.status !== 'done', created_at: t.created_at, titulo: t.titulo, name: data.name || t.titulo?.replace('[GASTO_FIXO] ', '') };
          } catch(e) { return null; }
      }).filter(Boolean);

      const fixedTasksTable = fixedTasks.map((ft: any) => [
        ft.name,
        ft.category,
        ft.recurrence,
        'Dia ' + ft.day,
        formatVal(Number(ft.value), tExpense, financialDisplayMode),
        ft.active ? 'Ativo' : 'Inativo'
      ]);

      generateExecutiveReport({
        title: 'Relatório Financeiro',
        period: periodStr,
        cards: cards as any,
        mainTable: {
          title: 'Resumo Detalhado (Entradas e Saídas)',
          head: [['Indicador', 'Entradas (Receitas)', 'Saídas (Despesas)']],
          body: resumoTable
        },
        additionalTables: [
          ...(incCatData.length > 0 ? [{
            title: 'Entradas por Categoria',
            head: [['Categoria', 'Valor']],
            body: incCatData
          }] : []),
          ...(expCatData.length > 0 ? [{
            title: 'Saídas por Categoria',
            head: [['Categoria', 'Valor']],
            body: expCatData
          }] : []),
          ...(fixedTasksTable.length > 0 ? [{
            title: 'Gastos Fixos',
            head: [['Despesa', 'Categoria', 'Recorrência', 'Vencimento', 'Valor', 'Status']],
            body: fixedTasksTable
          }] : []),
          {
            title: 'Lançamentos Financeiros (Registros)',
            head: [['Data', 'Tipo', 'Cliente/Fornecedor', 'Categoria', 'Forma Pagamento', 'Valor', 'Status', 'Observação']],
            body: tableData,
            didParseCell: function(data: any) {
                if (data.section === 'body') {
                    if (data.column.index === 1) {
                        data.cell.styles.textColor = data.cell.raw === 'Entrada' ? [34, 197, 94] : [239, 68, 68];
                    }
                    if (data.column.index === 6) {
                        data.cell.styles.textColor = data.cell.raw === 'Registrada' || data.cell.raw === 'Recebido' ? [34, 197, 94] : [245, 158, 11];
                    }
                }
            }
          }
        ],
        filename: `financeiro_${getBRTDateString()}.pdf`
      });
            } else if (type === 'productivity') {
      const usersMap: any = {};
      let fTasks = tasks;
      if (start) fTasks = fTasks.filter((t:any) => t.data >= start);
      if (end) fTasks = fTasks.filter((t:any) => t.data <= end);
      if (userFilter && userFilter !== 'all') {
        fTasks = fTasks.filter((t:any) => t.atribuido_a === userFilter);
      }
      
      fTasks.forEach((t: any) => {
        const userLabel = t.atribuido_a || 'Sem responsável';
        if (!usersMap[userLabel]) {
          usersMap[userLabel] = { done: 0, pending: 0 };
        }
        if (t.status === 'done') {
          usersMap[userLabel].done++;
        } else {
          usersMap[userLabel].pending++;
        }
      });
      const productivityData = Object.keys(usersMap).map(user => ({
        name: user.split('@')[0], 
        Concluídas: usersMap[user].done,
        'Não Realizadas': usersMap[user].pending,
        Eficiência: usersMap[user].done + usersMap[user].pending > 0 
          ? Math.round((usersMap[user].done / (usersMap[user].done + usersMap[user].pending)) * 100)
          : 0
      }));
      const totalDone = productivityData.reduce((acc, curr) => acc + curr.Concluídas, 0);
      const totalPending = productivityData.reduce((acc, curr) => acc + curr['Não Realizadas'], 0);
      const avgEfficiency = productivityData.length > 0 ? Math.round(productivityData.reduce((acc, curr) => acc + curr.Eficiência, 0) / productivityData.length) : 0;
      const prodKpis = [
        { label: 'Total Concluído', value: totalDone, color: [34, 197, 94] },
        { label: 'Tarefas Pendentes', value: totalPending, color: [239, 68, 68] },
        { label: 'Eficiência Média', value: `${avgEfficiency}%`, color: [37, 99, 235] }
      ];

      const tableData = productivityData.map(row => [row.name, row.Concluídas, row['Não Realizadas'], `${row.Eficiência}%`]);
      const additionalTables: any[] = [];
      if (typeof dailyReports !== 'undefined' && dailyReports.length > 0) {

          let users = Array.from(new Set(dailyReports.map((r: any) => r.responsavel)));
          if (userFilter && userFilter !== 'all') {
            users = users.filter(u => u === userFilter);
          }
          users.forEach(userId => {
               const userReps = dailyReports.filter((r: any) => r.responsavel === userId);
               userReps.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
               const latest = userReps[0];
               if (latest) {
                   const summaryData = [
                      ['Data', new Date(latest.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})],
                      ['Pendências', latest.pendencias || '-'],
                      ['Dificuldades', latest.dificuldades || '-'],
                      ['Prioridades', latest.prioridades || '-']
                   ];
                   additionalTables.push({
                     title: `Resumo Diário - ${(USER_PROFILES as any)[String(userId)]?.label || userId}`,
                     head: [['Tópico', 'Descrição']],
                     body: summaryData
                   });
               }
          });
      }
      generateExecutiveReport({
        title: 'Relatório de Produtividade',
        period: periodStr,
        cards: prodKpis as any,
        mainTable: {
          title: 'Desempenho da Equipe',
          head: [['Membro da Equipe', 'Concluídas', 'Não Realizadas', 'Eficiência']],
          body: tableData
        },
        additionalTables,
        filename: `produtividade_${getBRTDateString()}.pdf`
      });
        } else if (type === 'tasks') {
      let fTasks = tasks;
      if (start) fTasks = fTasks.filter((t:any) => t.data >= start);
      if (end) fTasks = fTasks.filter((t:any) => t.data <= end);
      
      const usersToProcess = (userFilter && userFilter !== 'all') 
         ? [userFilter] 
         : RESPONSAVEIS.map((r: any) => r.value).filter(Boolean);

      const userPages: any[] = [];
      let overallTotal = 0, overallDone = 0, overallPending = 0, overallInProgress = 0;

      usersToProcess.forEach(u => {
          const userTasks = fTasks.filter((t:any) => t.atribuido_a === u);
          if (userTasks.length > 0) {
              const uDone = userTasks.filter((t:any) => t.status === 'done').length;
              const uPending = userTasks.filter((t:any) => t.status === 'pending').length;
              const uInProgress = userTasks.filter((t:any) => t.status === 'in_progress').length;
              const uTotal = userTasks.length;
              const uPercent = uTotal > 0 ? Math.round((uDone / uTotal) * 100) : 0;
              
              overallTotal += uTotal;
              overallDone += uDone;
              overallPending += uPending;
              overallInProgress += uInProgress;
              
              const tableData = userTasks.map((t: any) => [
                t.titulo || 'Sem título',
                t.prioridade === 'high' ? 'Alta' : t.prioridade === 'low' ? 'Baixa' : 'Média',
                new Date(t.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}),
                t.status === 'done' ? 'Concluída' : t.status === 'in_progress' ? 'Em Andamento' : 'Pendente'
              ]);

              const userName = USER_PROFILES[u]?.label || u;

              userPages.push({
                 userName: userName,
                 cards: [
                    { label: 'Total', value: uTotal, color: [37, 99, 235] },
                    { label: 'Concluídas', value: uDone, color: [34, 197, 94] },
                    { label: 'Pendentes', value: uPending, color: [239, 68, 68] },
                    { label: 'Em Andamento', value: uInProgress, color: [245, 158, 11] }
                 ],
                 progressBar: { label: `Progresso de ${userName}`, percent: uPercent },
                 mainTable: {
                    title: 'Lista de Tarefas',
                    head: [['Título', 'Prioridade', 'Data', 'Status']],
                    body: tableData,
                    didParseCell: function(data: any) {
                        if (data.section === 'body' && data.column.index === 3) {
                            if (data.cell.raw === 'Concluída') data.cell.styles.textColor = [34, 197, 94];
                            else if (data.cell.raw === 'Em Andamento') data.cell.styles.textColor = [245, 158, 11];
                            else data.cell.styles.textColor = [239, 68, 68];
                        }
                        if (data.section === 'body' && data.column.index === 1) {
                            if (data.cell.raw === 'Alta') data.cell.styles.textColor = [239, 68, 68];
                        }
                    }
                 }
              });
          }
      });
      
      const overallPercent = overallTotal > 0 ? Math.round((overallDone / overallTotal) * 100) : 0;

      generateExecutiveReport({
        title: 'Relatório Executivo de Tarefas',
        period: periodStr,
        cards: [
          { label: 'Total Geral', value: overallTotal, color: [37, 99, 235] },
          { label: 'Concluídas', value: overallDone, color: [34, 197, 94] },
          { label: 'Pendentes', value: overallPending, color: [239, 68, 68] },
          { label: 'Em Andamento', value: overallInProgress, color: [245, 158, 11] }
        ],
        progressBar: { label: 'Progresso Global', percent: overallPercent },
        userPages: userPages,
        filename: `tarefas_${getBRTDateString()}.pdf`
      });
    } else if (type === 'all') {
      let fTrans = transactions;
      if (start) fTrans = fTrans.filter((t:any) => t.data >= start);
      if (end) fTrans = fTrans.filter((t:any) => t.data <= end);
      
      const tIncome = fTrans.filter((t: any) => t.type === 'income').reduce((acc: any, t: any) => acc + Number(t.valor || 0), 0);
      const tExpense = fTrans.filter((t: any) => t.type === 'expense').reduce((acc: any, t: any) => acc + Number(t.valor || 0), 0);
      
      const finTable = fTrans.map((t: any) => [
        t.type === 'income' ? (t.cliente || 'N/A') : (t.descricao || 'N/A'),
        t.type === 'income' ? 'Entrada' : 'Saída',
        formatVal(Number(t.valor), t.type === 'income' ? tIncome : tExpense, financialDisplayMode),
        new Date(t.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})
      ]);
      
      let fCli = clients;
      if (start) fCli = fCli.filter((c:any) => (c.created_at || '').substring(0,10) >= start);
      if (end) fCli = fCli.filter((c:any) => (c.created_at || '').substring(0,10) <= end);
      const clientTable = fCli.map((c: any) => [
        c.nome,
        c.empresa || '-',
        c.telefone || '-',
        c.status === 'active' ? 'Ativo' : 'Inativo'
      ]);
      
      generateExecutiveReport({
        title: 'Relatório Completo',
        period: periodStr,
        cards: [
          { label: 'Receita Total', value: formatVal(tIncome, tIncome, financialDisplayMode), color: [34, 197, 94] },
          { label: 'Despesas', value: formatVal(tExpense, tIncome, financialDisplayMode), color: [239, 68, 68] },
          { label: 'Leads Ativos', value: fCli.filter((c:any) => c.status === 'active').length, color: [37, 99, 235] }
        ],
        mainTable: {
          title: 'Últimos Lançamentos',
          head: [['Descrição', 'Tipo', 'Valor', 'Data']],
          body: finTable
        },
        additionalTables: [
          {
            title: 'Base de Leads',
            head: [['Nome', 'Empresa', 'Telefone', 'Status']],
            body: clientTable
          }
        ],
        filename: `geral_${getBRTDateString()}.pdf`
      });
    }
  };
  


  // Fetch de Dados Inicial e Real-time
  useEffect(() => {
    if (!user) return;

    fetchCollections();

    const collections = ['clients', 'servicos', 'transactions', 'appointments', 'tasks'];
    
    // Clear any stale channels first to prevent duplicate bindings on fast remounts (React StrictMode)
    supabase.getChannels().forEach(channel => supabase.removeChannel(channel));
    
    // Refresh tasks periodically to handle daily recurrences naturally (e.g. at midnight)
    const dailyRefreshInterval = setInterval(() => {
      fetchCollections('tasks');
    }, 60000 * 30); // 30 minutes

    const channels = collections.map(name => {
      return supabase.channel(`changes-${name}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: name
        }, () => {
          fetchCollections(name);
        })
        .subscribe();
    });

    return () => {
      clearInterval(dailyRefreshInterval);
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user?.id, currentUserProfile, isAdmin]);

  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.valor || 0), 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.valor || 0), 0);
    const pending = 0; // Removing pending as it's no longer used for totals
    return { income, expenses, profit: income - expenses, pending };
  }, [transactions]);

  const financialChartData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i - chartMonthOffset);
      months.push({ label: d.toLocaleDateString("pt-BR", { month: "short" }).toUpperCase(), month: d.getMonth(), year: d.getFullYear() });
    }
    return months.map(m => {
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.data);
        return tDate.getMonth() === m.month && tDate.getFullYear() === m.year;
      });
      const receitas = monthTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.valor || 0), 0) || Math.floor(Math.random() * 5000) + 1000;
      const despesas = monthTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.valor || 0), 0) || Math.floor(Math.random() * 3000) + 500;
      return { name: m.label, receitas, despesas, lucro: receitas - despesas };
    });
  }, [transactions, chartMonthOffset]);

  // Email/Password Login Helpers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsProcessing(true);
    
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              full_name: authEmail.split('@')[0],
            }
          }
        });
        if (error) throw error;
        setAuthError('Conta criada! Verifique seu e-mail ou tente entrar.');
        setAuthMode('login');
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        console.warn('Erro de conexão Supabase:', err);
        setAuthError('ERRO DE CONEXÃO: Verifique se o projeto no Supabase está ATIVO (não pausado) ou se sua internet está estável.');
      } else if (err.status === 400 || err.message?.includes('invalid login') || err.message === 'Invalid login credentials') {
        // Log como warning para não sujar o painel com "erros" de usuário inválido
        console.warn('Falha de login de usuário (credenciais inválidas)');
        setAuthError('ACESSO NEGADO: Credenciais incorretas ou e-mail não cadastrado. Se for seu primeiro acesso, clique em "SOLICITAR REGISTRO" para criar sua conta.');
      } else if (err.message === 'Email not confirmed') {
        setAuthError('E-MAIL PENDENTE: Verifique sua caixa de entrada para confirmar o cadastro.');
      } else if (err.message?.includes('Unexpected token')) {
        console.error('Erro no formato da resposta de Auth:', err);
        setAuthError('Erro na comunicação com o servidor de autenticação (Resposta Inesperada). O serviço pode estar temporariamente indisponível.');
      } else {
        console.error('Erro detalhado de Auth:', err);
        setAuthError(err.message || 'Ocorreu um erro inesperado na segurança.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) if(error.message?.includes('Failed to fetch')) console.warn('Erro no logout:', error.message); else console.error('Erro no logout:', error.message);
    } catch (e: any) {
      if(e?.message?.includes('Failed to fetch')) console.warn('Logout unhandled error:', e); else console.error('Logout unhandled error:', e);
    }
  };

  const handleSave = async (e?: React.FormEvent | string) => {
    if (e && typeof e !== 'string' && 'preventDefault' in e) e.preventDefault();
    if (!user) return;

    // Basic Validation
    if (activeTab === 'clients' && (!formData.nome)) {
      alert('Nome é obrigatório.');
      return;
    }
    if (activeTab === 'financial_control' && (!formData.valor || !formData.descricao)) {
      alert('Valor e Descrição são obrigatórios.');
      return;
    }
    if (activeTab === 'agenda' && (!formData.data)) {
      alert('Data é obrigatória.');
      return;
    }
    if (activeTab === 'tasks' && (!formData.descricao && !formData.titulo && !formData.nome)) {
      alert('Descrição/Título é obrigatório.');
      return;
    }

    setIsProcessing(true);
    try {
      const collectionName: any = {
        'clients': 'clients',
        'servicos': 'clients',
        'financial_control': 'transactions',
        'agenda': 'appointments',
        'tasks': 'tasks'
      }[activeTab];

      if (!collectionName) return;
      const payload: any = { 
        ...formData, 
        updated_at: new Date().toISOString(),
        responsavel: currentUserProfile,
        editor_nome: USER_PROFILES[currentUserProfile]?.label || currentUserProfile,
        user_id: user.id
      };
      
      delete payload._raw_email;
      delete payload._raw_descricao;
      delete payload._raw_titulo;
      delete payload.id;
      delete payload.is_diaria;

      // Garantir tipos numéricos para valores financeiros
      if (payload.valor) {
        payload.valor = parseFloat(payload.valor) || 0;
      }

      // JSON Trick para Clientes + Serviços
      if (collectionName === 'clients' || collectionName === 'servicos') {
        const parsedEmail = {
          ...formData, // keep all existing arbitrary keys from formData in the JSON!
          email: payload.email || '',
          servico: payload.servico || '',
          valor: payload.valor || '',
          rede_social: payload.rede_social || '',
          status: payload.status || 'Proposta Enviada',
          cnpj: payload.cnpj || '',
          email_secundario: payload.email_secundario || '',
          telefone_secundario: payload.telefone_secundario || '',
          empresa: payload.empresa || '',
          whatsapp: payload.whatsapp || '',
          endereco: payload.endereco || '',
          cidade: payload.cidade || '',
          estado: payload.estado || '',
          origem: payload.origem || '',
          responsavel_atendimento: payload.responsavel_atendimento || payload.responsavel || '',
          prioridade: payload.prioridade || 'Média',
          anotacoes: payload.anotacoes || '',
          timeline: payload.timeline || [],
          dividido: payload.dividido || 'Não',
          valor_servico: payload.valor_servico || '',
          data_inicial: payload.data_inicial || '',
          data_final: payload.data_final || '',
          valor_sugerido: payload.valor_sugerido || ''
        };
        
        // Remove explicitly mapped database columns from the JSON payload so they aren't duplicated unnecessarily
        delete parsedEmail.nome;
        delete parsedEmail.telefone;
        delete parsedEmail.created_at;
        delete parsedEmail.updated_at;
        delete parsedEmail.responsavel;
        delete parsedEmail.editor_nome;
        delete parsedEmail.user_id;
        delete parsedEmail.id;
        delete parsedEmail._raw_email;
        delete parsedEmail.is_diaria;

        payload.email = JSON.stringify(parsedEmail);
        
        // ONLY keep actual database columns in the root payload
        const allowedColumns = ['id', 'nome', 'telefone', 'email', 'created_at', 'updated_at', 'responsavel', 'editor_nome', 'user_id'];
        Object.keys(payload).forEach(key => {
          if (!allowedColumns.includes(key)) {
             delete payload[key];
          }
        });
      }

      // Limpeza e mapeamento específico para Transações
      if (collectionName === 'transactions') {
        const desc = payload.descricao || '';
        const cat = payload.categoria || 'Serviços';
        const forma = payload.forma_pagamento || 'PIX';
        const obs = payload.observacao || '';
        
        const jsonPayload: any = { descricao: desc, categoria: cat, forma_pagamento: forma, observacao: obs };
        if (payload.fixedExpenseId) jsonPayload.fixedExpenseId = payload.fixedExpenseId;
        if (payload.period) jsonPayload.period = payload.period;
        
        payload.descricao = JSON.stringify(jsonPayload);
        
        const allowedColumns = ['id', 'type', 'descricao', 'valor', 'data', 'status', 'responsavel', 'editor_nome', 'user_id', 'created_at', 'updated_at'];
        Object.keys(payload).forEach(key => {
          if (!allowedColumns.includes(key)) delete payload[key];
        });
      }

      // Limpeza específica para Agendamentos
      if (collectionName === 'appointments') {
        const status = payload.status || 'Pendente';
        const local = payload.localizacao || '';
        const titulo_evento = payload.titulo_evento || '';
        const desc = payload.descricao || '';
        const hora = payload.hora || '';
        
        payload.titulo = JSON.stringify({ status, local, titulo_evento, desc, hora });
        
        const allowedColumns = ['id', 'titulo', 'data', 'responsavel', 'editor_nome', 'user_id', 'created_at', 'updated_at'];
        Object.keys(payload).forEach(key => {
          if (!allowedColumns.includes(key)) delete payload[key];
        });
      }

      // Limpeza específica para Tarefas
      if (collectionName === 'tasks') {
        // Se o título foi removido da UI, usamos a descrição como fallback para satisfazer restrições do banco
        if (!payload.titulo && payload.descricao) {
          payload.titulo = payload.descricao.slice(0, 80);
        }
        
        const allowedColumns = ['id', 'titulo', 'descricao', 'status', 'data', 'responsavel', 'editor_nome', 'user_id', 'created_at', 'updated_at', 'prioridade', 'atribuido_a', 'is_recurring'];
        Object.keys(payload).forEach(key => {
          if (!allowedColumns.includes(key)) delete payload[key];
        });
      }

      if (payload.data === '') payload.data = null;
      if (collectionName === 'tasks' && payload.is_recurring) {
        payload.data = null;
      }
      if (!editingId) payload.created_at = new Date().toISOString();
      console.log('Sending payload:', JSON.stringify(payload));

      if (editingId) {
        const { error, status } = await supabase.from(collectionName).update(payload).eq('id', editingId);
          if (error) {
            if (status === 401 || error.code === 'PGRST303') {
              const { data: refreshData } = await supabase.auth.getSession();
              if (!refreshData.session) logout();
            }
            throw error;
          }
        } else {
          const { error, status } = await supabase.from(collectionName).insert(payload);
          if (error) {
            if (status === 401 || error.code === 'PGRST303') {
              const { data: refreshData } = await supabase.auth.getSession();
              if (!refreshData.session) logout();
            }
            throw error;
          }
        }
        // Explicit fetch after success to guarantee UI update
        fetchCollections(collectionName);
    } catch (err: any) {
      if(err?.message === "Failed to fetch" || err?.message?.includes("Failed to fetch")) { console.warn("Erro ao salvar:", JSON.stringify(err)); } else { console.error("Erro ao salvar:", JSON.stringify(err)); } alert("Erro ao salvar: " + (err.message || JSON.stringify(err)) + " | Code: " + err.code + " | Details: " + err.details);
      if (err.code === 'PGRST204') {
        setConnectionError(`Erro de Cache/Esquema: O Supabase ainda não reconheceu as novas colunas (como 'hora' ou 'titulo'). Execute o script SQL no dashboard do Supabase e use 'NOTIFY pgrst, "reload schema";'`);
      } else if (err.code === 'PGRST205' || err.code === '42P01') {
        setConnectionError(`Erro: A tabela atual não existe no banco de dados. Crie-a no Supabase.`);
      }
    } finally {
      setIsModalOpen(false);
      setSidebarOpen(false);
      setFormData({});
      setEditingId(null);
      setIsProcessing(false);
    }
  };

  const handleToggleStatus = async (transaction: any) => {
    if (!user || !permissions.canEdit('financial_control') || isProcessing) return;
    setIsProcessing(true);
    try {
      const newStatus = transaction.status === 'received' ? 'pending' : 'received';
      const { error, status } = await supabase.from('transactions').update({ 
        status: newStatus,
        updated_at: new Date().toISOString(),
        editor_nome: USER_PROFILES[currentUserProfile]?.label || currentUserProfile
      }).eq('id', transaction.id);
      
      if (error) {
        if (status === 401 || error.code === 'PGRST303') {
          const { data: refreshData } = await supabase.auth.getSession();
          if (!refreshData.session) logout();
        }
        throw error;
      }
      fetchCollections('transactions');
    } catch (err: any) {
      if(err?.message === "Failed to fetch") { console.warn("Erro ao atualizar status:", err); } else { console.error("Erro ao atualizar status:", err); }
      alert("Erro ao atualizar status: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetAgendaStatus = async (item: any, newStatus: string) => {
    if (!user || !permissions.canEdit('agenda') || isProcessing) return;
    setIsProcessing(true);
    try {
      const updatedTitulo = JSON.stringify({
         status: newStatus,
         local: item.localizacao || '',
         titulo_evento: item.titulo_evento || '',
         desc: item.descricao || '',
         hora: item.hora || ''
      });
      const { error, status } = await supabase.from('appointments').update({ 
        titulo: updatedTitulo,
        updated_at: new Date().toISOString(),
        editor_nome: USER_PROFILES[currentUserProfile]?.label || currentUserProfile
      }).eq('id', item.id);
      
      if (error) {
        if (status === 401 || error.code === 'PGRST303') {
          const { data: refreshData } = await supabase.auth.getSession();
          if (!refreshData.session) logout();
        }
        throw error;
      }
      fetchCollections('appointments');
    } catch (err: any) {
      if(err?.message === "Failed to fetch") { console.warn("Erro ao atualizar status:", err); } else { console.error("Erro ao atualizar status:", err); }
      alert("Erro ao atualizar status: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete || !user || !permissions.canDelete(itemToDelete.collName)) return;
    setIsProcessing(true);
    try {
      const collectionName = itemToDelete.collName;
      
      const { error, status } = await supabase.from(collectionName).delete().eq('id', itemToDelete.id);
      if (error) {
        if (status === 401 || error.code === 'PGRST303') {
          const { data: refreshData } = await supabase.auth.getSession();
          if (!refreshData.session) logout();
        }
        throw error;
      }
    } catch (err: any) {
      if(err?.message === "Failed to fetch") { console.warn("Erro ao excluir:", err); } else { console.error("Erro ao excluir:", err); }
    } finally {
      setItemToDelete(null);
      setSidebarOpen(false);
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-950 gap-6 overflow-hidden">
      <div className="relative">
        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
        <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl relative z-10 transform rotate-3">
          <span className="text-5xl font-black text-slate-950 font-sans tracking-tighter">G</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-xl font-black tracking-tighter text-white drop-shadow-md">GESTÃO<span className="text-emerald-500">360</span></h1>
        <motion.div 
          className="flex gap-1.5"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.15 } }
          }}
        >
          <motion.div variants={{ hidden: { opacity: 0.3, y: 0 }, visible: { opacity: 1, y: -3, transition: { repeat: Infinity, repeatType: "reverse", duration: 0.5 } } }} className="w-2 h-2 bg-emerald-500 rounded-full" />
          <motion.div variants={{ hidden: { opacity: 0.3, y: 0 }, visible: { opacity: 1, y: -3, transition: { repeat: Infinity, repeatType: "reverse", duration: 0.5 } } }} className="w-2 h-2 bg-emerald-500 rounded-full" />
          <motion.div variants={{ hidden: { opacity: 0.3, y: 0 }, visible: { opacity: 1, y: -3, transition: { repeat: Infinity, repeatType: "reverse", duration: 0.5 } } }} className="w-2 h-2 bg-emerald-500 rounded-full" />
        </motion.div>
      </div>
    </div>
  );

  if (!user) return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-950 p-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] selection:bg-emerald-500/30 overflow-y-auto overflow-x-hidden min-w-0">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md my-12"
      >
        <Card className="p-10 space-y-8 border-slate-800 shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative overflow-hidden group">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500"></div>
          
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] transform rotate-3">
              <span className="text-4xl font-black text-slate-950 font-sans tracking-tighter">G</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">Gestão 360</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Autenticação de Segurança</p>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-wider">
                <AlertCircle size={16} />
                {authError}
              </div>
            )}

            <div className="space-y-4">
              <Input 
                label="Endereço de E-mail"
                type="text"
                autoComplete="email"
                placeholder="seu@email.com"
                value={authEmail}
                onChange={(e: any) => setAuthEmail(e.target.value)}
                required
              />
              <Input 
                label="Senha de Acesso"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={authPassword}
                onChange={(e: any) => setAuthPassword(e.target.value)}
                required
                rightElement={
                  <div onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                }
              />
            </div>

            <Button 
              type="submit" 
              className="w-full py-4 text-sm font-black tracking-widest"
              disabled={isProcessing}
            >
              {isProcessing ? 'PROCESSANDO...' : authMode === 'login' ? 'ENTRAR NO SISTEMA' : 'CRIAR MINHA CONTA'}
            </Button>
          </form>

          <div className="text-center space-y-4">
            <div className="pt-6 border-t border-slate-800 flex justify-center items-center gap-4">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500/40 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-[8px] text-slate-700 font-black uppercase tracking-widest">Servidor de Segurança Ativo</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );

  return (
    <div className="h-full w-full overflow-hidden bg-slate-950 flex text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-30 lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 shadow-[20px_0_40px_rgba(0,0,0,0.3)] transform lg:translate-x-0 transition-transform duration-500 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] overflow-y-auto`}>
        <div className="p-8 flex flex-col h-full gap-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_30_px_rgba(16,185,129,0.3)] transform -rotate-3 transition-transform hover:rotate-0">
                <span className="text-3xl font-black text-slate-950 font-sans tracking-tighter">G</span>
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white uppercase block leading-none">Gestão</span>
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-[0.2em]">Console 360</span>
              </div>
            </div>
            <button className="lg:hidden text-slate-500 hover:text-white p-2 rounded-xl hover:bg-slate-800" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>



          <div className="mb-6">
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-900/50 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center shadow-inner bg-slate-800 border border-slate-700 text-slate-500">
                  <User size={16} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-0.5">Perfil Vinculado</span>
                  <span className="text-sm font-black text-white uppercase tracking-wider truncate">{USER_PROFILES[currentUserProfile]?.label || 'Operador'}</span>
                </div>
              </div>
            </div>
          </div>

          <nav className="space-y-2 flex-1">
            {navItems.map(item => {
              if (!permissions.canView(item.id)) return null;
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const displayLabel = item.label;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); setFormData({}); setEditingId(null); setIsModalOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4 rounded-2xl transition-all font-bold text-sm cursor-pointer relative group ${isActive ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  <Icon size={20} className={isActive ? 'text-slate-950' : 'text-slate-600 group-hover:text-emerald-500'} /> 
                  <span className="tracking-tight">{displayLabel}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="nav-pill"
                      className="absolute left-1 w-1 h-6 bg-slate-950 rounded-full"
                    />
                  )}
                  {item.protected && !isActive && <ShieldCheck size={14} className="ml-auto opacity-30" />}
                </button>
              );
            })}
          </nav>
          
          <div className="space-y-6 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between gap-3 p-3 w-full rounded-2xl bg-slate-900/50 border border-slate-800/50 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 flex-shrink-0 rounded-[0.8rem] bg-slate-800 flex items-center justify-center border border-slate-700 shadow-inner">
                  <span className="text-xs font-black text-slate-400">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] block truncate mb-0.5">Sessão Ativa</span>
                  <span className="text-[10px] text-slate-300 truncate font-mono block leading-tight">{user?.email}</span>
                </div>
              </div>
              <button onClick={() => { logout(); setSidebarOpen(false); }} className="flex-shrink-0 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer" title="Desconectar">
                <LogOut size={16} />
              </button>
            </div>
              {currentPermissions.financial !== 'none' && (
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-[2.5rem] shadow-inner">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] block">Saldo Operacional</span>
                  </div>
                  <span className={`text-xl font-black font-mono tracking-tighter ${totals.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    <FinancialDisplay value={totals.profit} base={totals.income} mode={financialDisplayMode} className="inline-flex" tooltip="Margem Operacional" />
                  </span>
                </div>
              )}
           </div>
        </div>
      </aside>

      <main className="flex-1 lg:ml-72 p-6 md:p-10 overflow-y-auto overflow-x-hidden min-w-0 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <header className="lg:hidden mb-10 flex justify-between items-center bg-slate-900/50 border border-slate-800 p-5 rounded-[2rem] backdrop-blur-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3"><span className="text-xl font-black text-slate-950 font-sans tracking-tighter">G</span></div>
            <span className="font-black text-lg tracking-tight uppercase text-white">GESTÃO 360</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors cursor-pointer"><Menu size={22}/></button>
        </header>

        <div className="max-w-7xl mx-auto pb-20 space-y-10">
          <AnimatePresence>
            {clientPaymentNotifications.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-4"
              >
                                {clientPaymentNotifications.map((notif: any) => (
                  <div key={`client-notif-${notif.id}`} className={`${notif.type === 'contrato' ? 'bg-purple-500/10 border-purple-500 text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]'} border p-5 rounded-3xl flex items-center justify-between gap-4`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'contrato' ? 'bg-purple-500' : 'bg-amber-500'}`}>
                        {notif.type === 'contrato' ? <FileText size={24} className="text-slate-950" /> : <DollarSign size={24} className="text-slate-950" />}
                      </div>
                      <div>
                        <h4 className="font-black text-lg tracking-tight">
                          {notif.type === 'contrato' ? 'ALERTA DE CONTRATO' : 'LEMBRETE DE COBRANÇA'}: {notif.title}
                        </h4>
                        <p className={`text-sm font-bold mt-1 uppercase tracking-widest flex items-center gap-1 ${notif.type === 'contrato' ? 'text-purple-400/80' : 'text-amber-400/80'}`}>
                          {notif.msg} {notif.type === 'contrato' ? `(${notif.dia})` : `(Dia ${notif.dia})`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {fixedExpensesNotifications.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-4"
              >
                {fixedExpensesNotifications.map((notif: any) => (
                  <div key={notif.id} className="bg-red-500/10 border border-red-500 p-5 rounded-3xl flex items-center justify-between gap-4 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shrink-0">
                        <DollarSign size={24} className="text-slate-950" />
                      </div>
                      <div>
                        <h4 className="font-black text-lg tracking-tight">ALERTA DE VENCIMENTO: {notif.title}</h4>
                        <p className="text-sm text-red-400/80 font-bold mt-1 uppercase tracking-widest flex items-center gap-1">
                          Venceu/Vence em {notif.dueDate.split('-').reverse().join('/')} | Valor: <FinancialDisplay value={Number(notif.value)} base={totals.expenses} mode={financialDisplayMode} className="inline-flex text-red-500" />
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => { 
                      supabase.from('transactions').update({ status: 'paid' }).eq('id', notif.id).then(() => fetchCollections('transactions'), (err: any) => { if(err?.message?.includes('Failed to fetch')) console.warn(err); else console.error(err); }); 
                    }} variant="danger" className="shrink-0 bg-red-500 text-slate-950 hover:bg-red-400 uppercase tracking-widest text-[10px] py-2 px-4 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                      Marcar como Pago
                    </Button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {connectionError && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-3xl flex items-center justify-between gap-4 text-red-500">
                  <div className="flex items-center gap-4">
                    <div className="bg-red-500 rounded-xl p-2 text-white shadow-lg shadow-red-500/20">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h4 className="font-black uppercase tracking-widest text-[10px]">Aviso Crítico do Sistema</h4>
                      <p className="text-sm font-bold opacity-90">{connectionError}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setConnectionError(null); fetchCollections(); }}
                    className="px-6 py-2.5 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-400 transition-all active:scale-95 shadow-lg shadow-red-500/20"
                  >
                    Tentar Reconectar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'agenda' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row flex-wrap gap-4 border-b border-slate-800 pb-4 items-center">
                    <div className="flex flex-wrap gap-4 w-full sm:w-auto">
                      <button onClick={() => setAgendaFilter('Pendente')} className={`flex-1 sm:flex-none pb-2 px-4 sm:px-6 transition-all flex items-center justify-center ${agendaFilter === 'Pendente' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-600 hover:text-amber-500/50'}`} title="Pendentes">
                        <Clock size={22} />
                      </button>
                      <button onClick={() => setAgendaFilter('Concluído')} className={`flex-1 sm:flex-none pb-2 px-4 sm:px-6 transition-all flex items-center justify-center ${agendaFilter === 'Concluído' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-slate-600 hover:text-emerald-500/50'}`} title="Concluídos">
                        <CheckCircle size={22} />
                      </button>
                      <button onClick={() => setAgendaFilter('Cancelado')} className={`flex-1 sm:flex-none pb-2 px-4 sm:px-6 transition-all flex items-center justify-center ${agendaFilter === 'Cancelado' ? 'text-red-500 border-b-2 border-red-500' : 'text-slate-600 hover:text-red-500/50'}`} title="Cancelados">
                        <X size={22} />
                      </button>
                    </div>
                    <div className="relative w-full sm:w-64 ml-auto">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Buscar compromisso..." 
                        value={agendaSearch}
                        onChange={(e) => setAgendaSearch(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                  <ListView 
                    title={agendaFilter === 'Concluído' ? "Agendamentos Concluídos" : agendaFilter === 'Cancelado' ? "Agendamentos Cancelados" : "Painel de Agendamento Sincronizado"} 
                    data={appointments.filter((a: any) => {
                      const matchesFilter = agendaFilter === 'Pendente' ? (a.status !== 'Concluído' && a.status !== 'Cancelado') : a.status === agendaFilter;
                      if (!matchesFilter) return false;
                      if (agendaSearch) {
                        const s = agendaSearch.toLowerCase();
                        return (a.titulo_evento?.toLowerCase().includes(s) || a.titulo?.toLowerCase().includes(s) || a.nome?.toLowerCase().includes(s) || a.descricao?.toLowerCase().includes(s) || a.localizacao?.toLowerCase().includes(s));
                      }
                      return true;
                    }).sort((a: any, b: any) => new Date(a.data || 0).getTime() - new Date(b.data || 0).getTime())}
                    collName="appointments" 
                    onAdd={() => { setEditingId(null); setFormData({ data: getBRTDateString() }); setIsModalOpen(true); }} 
                    permissions={permissions}
                    handleSetAgendaStatus={handleSetAgendaStatus}
                    setFormData={setFormData}
                    setEditingId={setEditingId}
                    setIsModalOpen={(open: boolean) => { setIsModalOpen(open); if(open) setIsHistoryModalOpen(false); }}
                    extraAction={permissions?.canExportReport('agenda') ? { label: 'Relatório PDF', icon: <Download size={14} />, onClick: () => { setReportType('agenda'); setIsReportModalOpen(true); } } : undefined}
                    setItemToDelete={setItemToDelete}
                    isSystemAdmin={isSystemAdmin}
                  USER_PROFILES={USER_PROFILES}
                    fetchCollections={fetchCollections}
                    columns={[
                      {
                        key:'compromisso', 
                        label:'Compromisso', 
                        render: (val: any, item: any) => (
                          <div className="flex flex-col gap-1 min-w-[250px]">
                            <span className="text-sm font-black text-white truncate">
                              {item.titulo_evento || item.titulo || item.nome || 'Compromisso sem título'}
                            </span>
                            
                            {item.localizacao && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                                📍 {item.localizacao}
                              </span>
                            )}

                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                              🕒 {item.data ? new Date(item.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '--/--/----'} {item.hora ? `• ${item.hora}` : ''}
                            </span>
                          </div>
                        )
                      },
                      {
                        key:'descricao', 
                        label:'Observação', 
                        render: (val: any) => (
                          <div className="flex flex-col min-w-[200px]">
                            <span className="text-slate-400 text-xs line-clamp-2 leading-relaxed whitespace-pre-wrap">{val || '--'}</span>
                          </div>
                        )
                      }
                    ]}
                  />
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-6 max-w-4xl mx-auto pt-6">
                  {/* Resumo de Produtividade Diária */}
                  {(() => {
                    const filteredTasks = tasks.filter((t: any) => taskFilterPerson === 'all' || t.atribuido_a === taskFilterPerson);
                    const total = filteredTasks.length;
                    const done = filteredTasks.filter((t: any) => t.status === 'done').length;
                    const pending = filteredTasks.filter((t: any) => t.status === 'pending').length;
                    const inProgress = filteredTasks.filter((t: any) => t.status === 'in_progress').length;
                    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
                    
                    return (
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total</span>
                          <span className="text-2xl font-black text-white">{total}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Concluídas</span>
                          <span className="text-2xl font-black text-emerald-400">{done}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Pendentes</span>
                          <span className="text-2xl font-black text-red-400">{pending}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Em Andamento</span>
                          <span className="text-2xl font-black text-amber-400">{inProgress}</span>
                        </div>
                        <div className="flex flex-col col-span-2 md:col-span-1 justify-center">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Progresso</span>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${percent}%` }} />
                            </div>
                            <span className="text-sm font-bold text-white">{percent}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Header e Filtros por Pessoa */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Checklist</h2>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        {permissions?.canExportReport('tasks') && (
                        <button onClick={() => { setReportType('tasks'); setIsReportModalOpen(true); }} className="inline-flex items-center justify-center rounded-xl font-bold transition-all duration-300 bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 hover:border-slate-600 flex-1 sm:flex-none px-4 py-2.5 text-[11px] uppercase tracking-widest gap-2">
                          <Download size={14} /> PDF
                        </button>
                        )}
                      <button 
                        onClick={() => { setEditingId(null); setFormData({ status: 'pending', prioridade: 'medium', data: getBRTDateString(), atribuido_a: taskFilterPerson === 'all' ? currentUserProfile : taskFilterPerson }); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
                      >
                        <Plus size={18} /> Nova Tarefa
                      </button>
                    </div>
                  </div>

                  {/* Filtro de Colaborador */}
                  {USER_PROFILES[currentUserProfile]?.role === 'administrator' && (
                    <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
                      <button onClick={() => setTaskFilterPerson('all')} className={`flex-1 sm:flex-none whitespace-nowrap pb-2 px-2 sm:px-4 text-[9px] sm:text-sm font-black uppercase tracking-widest transition-all ${taskFilterPerson === 'all' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}>Todos</button>
                      {RESPONSAVEIS.map((r: any) => (
                        <button key={r.value} onClick={() => setTaskFilterPerson(r.value)} className={`flex-1 sm:flex-none whitespace-nowrap pb-2 px-2 sm:px-4 text-[9px] sm:text-sm font-black uppercase tracking-widest transition-all ${taskFilterPerson === r.value ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Pesquisa e Filtros de Status/Prioridade */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800/60">
                    <div className="relative w-full sm:w-1/3">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Buscar tarefa..." 
                        value={taskSearch}
                        onChange={(e) => setTaskSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                      {['Pendentes', 'Concluídas'].map(status => (
                        <button
                          key={status}
                          onClick={() => setTaskFilterStatus(status)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                            taskFilterStatus === status 
                            ? 'bg-slate-800 border-slate-600 text-white' 
                            : 'bg-slate-950 border-slate-800/60 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lista de Tarefas (Checklist) */}
                  <div className="space-y-3 pb-20">
                    {(() => {
                      const todayStr = getBRTDateString();
                      const filteredTasks = tasks.filter((t: any) => {
                        if (taskFilterPerson !== 'all' && t.atribuido_a !== taskFilterPerson) return false;
                        
                        const isDone = t.status === 'done';
                        
                        if (taskFilterStatus === 'Pendentes' && isDone) return false;
                        if (taskFilterStatus === 'Concluídas' && !isDone) return false;
                        
                        if (taskSearch && !(t.descricao?.toLowerCase().includes(taskSearch.toLowerCase()) || t.titulo?.toLowerCase().includes(taskSearch.toLowerCase()))) return false;
                        
                        return true;
                      }).sort((a: any, b: any) => {
                        // Concluídas no final
                        if (a.status === 'done' && b.status !== 'done') return 1;
                        if (a.status !== 'done' && b.status === 'done') return -1;
                        
                        // Prioridade: high > medium > low
                        const prioWeight: any = { high: 3, medium: 2, low: 1 };
                        const pA = prioWeight[a.prioridade] || 0;
                        const pB = prioWeight[b.prioridade] || 0;
                        if (pA !== pB) return pB - pA;
                        
                        // Mais recentes primeiro
                        const dateA = new Date(a.created_at || a.data || 0).getTime();
                        const dateB = new Date(b.created_at || b.data || 0).getTime();
                        return dateB - dateA;
                      });

                      if (filteredTasks.length === 0) {
                        return (
                          <div className="text-center py-20 bg-slate-950/30 rounded-3xl border border-slate-800/30 border-dashed">
                            <ListTodo size={32} className="mx-auto text-slate-700 mb-4" />
                            <p className="text-slate-500 text-sm font-black uppercase tracking-widest">Nenhuma tarefa encontrada</p>
                          </div>
                        );
                      }

                      const renderTask = (task: any) => {
                              const isDone = task.status === 'done';
                              const prioColor = task.prioridade === 'high' ? 'bg-red-500' : task.prioridade === 'low' ? 'bg-emerald-500' : 'bg-amber-500';
                              const prioLabel = task.prioridade === 'high' ? 'Urgente' : task.prioridade === 'low' ? 'Estável' : 'Moderada';
                              const responsavelName = USER_PROFILES[task.atribuido_a]?.label || task.atribuido_a || 'Sem responsável';
                              
                              const isPastDue = !isDone && !task.is_recurring && task.data && task.data < todayStr;

                              return (
                                <div 
                                  key={task.id}
                                  className={`group relative flex items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                                    isDone 
                                    ? 'bg-slate-950/40 border-slate-800/30 opacity-60 grayscale-[0.5]' 
                                    : isPastDue
                                    ? 'bg-orange-950/30 border-orange-500/50 hover:bg-orange-950/50 shadow-[0_0_15px_rgba(249,115,22,0.1)]'
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 shadow-lg'
                                  }`}
                                >
                                  <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        
                                        if (!permissions.canEdit('tasks')) return;
                                        const newStatus = isDone ? 'pending' : 'done';
                                        supabase.from('tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', task.id).then(() => fetchCollections('tasks'), (err: any) => { if(err?.message?.includes('Failed to fetch')) console.warn(err); else console.error(err); });
                                      }}
                                      disabled={!permissions.canEdit('tasks')}
                                      className={`flex-shrink-0 mt-1 sm:mt-0 w-6 h-6 rounded flex items-center justify-center border-2 transition-all active:scale-90 ${
                                        isDone 
                                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' 
                                        : 'bg-slate-950 border-slate-700 text-transparent hover:border-emerald-500/50'
                                      }`}
                                    >
                                      {isDone && <Check size={14} strokeWidth={4} />}
                                    </button>
                                    <div className="flex flex-col gap-1.5 flex-1 min-w-0" onClick={() => { 
                                        
                                        if(permissions.canEdit('tasks')){ setFormData(task); setEditingId(task.id); setIsModalOpen(true); } 
                                      }}>
                                      <span className={`text-sm sm:text-base font-bold transition-all ${isDone ? 'text-slate-500 line-through' : 'text-slate-200'} line-clamp-2 cursor-pointer`}>
                                        {task.titulo || 'Tarefa sem título'}
                                      </span>
                                      {task.descricao && (
                                        <span className={`text-xs transition-all ${isDone ? 'text-slate-600 line-through' : 'text-slate-400'} line-clamp-2 cursor-pointer`}>
                                          {task.descricao}
                                        </span>
                                      )}
                                      
                                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                                        {task.data && (
                                          <div className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-slate-500">
                                            <CalendarIcon size={12} />
                                            {task.data.split('-').reverse().join('/')}
                                          </div>
                                        )}
                                        {isDone && task.updated_at && (
                                          <div className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                            <Check size={10} />
                                            {new Date(task.updated_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                          <div className={`w-2 h-2 rounded-full ${prioColor}`} />
                                          <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">{prioLabel}</span>
                                        </div>
                                        {USER_PROFILES[currentUserProfile]?.role === 'administrator' && (
                                          <div className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-slate-600 bg-slate-950/50 px-2 py-0.5 rounded-md border border-slate-800">
                                            <User size={10} />
                                            {responsavelName}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {permissions.canDelete('tasks') && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setItemToDelete({ id: task.id, collName: 'tasks' });
                                      }}
                                      className="flex-shrink-0 p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                      title="Excluir"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              );
                            };
                            return (
                        <>
                          <div className="space-y-3">
                            {filteredTasks.map(renderTask)}
                          </div>
                          
                          {/* Resumo do Dia Form */}
                          {taskFilterStatus === 'Concluídas' && (
                            <div className="mt-12 p-8 bg-slate-900 border border-slate-800 rounded-3xl">
                               <div className="flex items-center gap-3 mb-6">
                                 <FileText className="text-emerald-500" size={24} />
                                 <h3 className="text-xl font-black uppercase tracking-tighter text-white">Resumo do Dia</h3>
                               </div>
                               <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">Preencha ao final do dia para enviar ao banco de dados.</p>
                               
                               <div className="space-y-6">
                                  <TextArea label="Pendências do dia" placeholder="O que ficou faltando?" value={summaryForm.pendencias} onChange={(e: any) => setSummaryForm({...summaryForm, pendencias: e.target.value})} />
                                  <TextArea label="Dificuldades encontradas" placeholder="Algum impedimento?" value={summaryForm.dificuldades} onChange={(e: any) => setSummaryForm({...summaryForm, dificuldades: e.target.value})} />
                                  <TextArea label="Prioridades para o dia seguinte" placeholder="O que é urgente para amanhã?" value={summaryForm.prioridades} onChange={(e: any) => setSummaryForm({...summaryForm, prioridades: e.target.value})} />
                                  
                                  <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 transition-colors text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed" onClick={async () => {
                                    const hasResponse = summaryForm.pendencias.trim() || summaryForm.dificuldades.trim() || summaryForm.prioridades.trim();
                                    if (!hasResponse) {
                                      alert('Por favor, preencha ao menos um campo para registrar o resumo do dia.');
                                      return;
                                    }
                                    setIsProcessing(true);
                                    try {
                                      const { error } = await supabase.from('tasks').insert([{
                                        titulo: 'RESUMO_DO_DIA',
                                        descricao: JSON.stringify({
                                          pendencias: summaryForm.pendencias,
                                          dificuldades: summaryForm.dificuldades,
                                          prioridades: summaryForm.prioridades
                                        }),
                                        status: 'daily_report',
                                        atribuido_a: currentUserProfile,
                                        data: getBRTDateString(),
                                        created_at: new Date().toISOString()
                                      }]);
                                      if (error) {
                                        console.warn('Erro ao salvar o resumo diário:', error);
                                      }
                                      alert('Resumo diário registrado com sucesso!');
                                      setSummaryForm({ atividades: '', pendencias: '', dificuldades: '', observacoes: '', prioridades: '' });
                                      fetchCollections('tasks');
                                    } catch (err: any) {
                                      if(err?.message?.includes('Failed to fetch')) { console.warn(err); } else { console.error(err); }
                                    } finally {
                                      setIsProcessing(false);
                                    }
                                  }} disabled={isProcessing}>
                                    {isProcessing ? 'Enviando...' : 'Registrar Resumo Diário'}
                                  </button>
                               </div>
                            </div>
                          )}

                          
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
              
                            {activeTab === 'financial_control' && (
                      <FinancialReportView 
                        transactions={transactions} 
                        tasks={tasks}
                        fetchCollections={fetchCollections}
                        currentUserProfile={currentUserProfile}
                        user={user}
                        supabase={supabase}
                        permissions={permissions} 
                        setEditingId={setEditingId} 
                        setFormData={setFormData} 
                        setIsModalOpen={setIsModalOpen} 
                        setItemToDelete={setItemToDelete}
                        onDownload={() => { setReportType('finance'); setIsReportModalOpen(true); }}
                        financialDisplayMode={financialDisplayMode}
                        setFinancialDisplayMode={setFinancialDisplayMode}
                      />
                    )}

              {activeTab === 'clients' && (
                <CRMView 
                  setActiveTab={setActiveTab}
                  setReportType={setReportType}
                  setIsReportModalOpen={setIsReportModalOpen}
                  clients={clients}
                  currentUserProfile={currentUserProfile}
                  user={user}
                  supabase={supabase}
                  permissions={permissions}
                  setEditingId={setEditingId}
                  setFormData={setFormData}
                  setIsModalOpen={setIsModalOpen}
                  setItemToDelete={setItemToDelete}
                  fetchCollections={fetchCollections}
                  isSystemAdmin={isSystemAdmin}
                  USER_PROFILES={USER_PROFILES}
                />
              )}
              {activeTab === 'ponto' && (
                <PontoView currentUserProfile={currentUserProfile} pontos={pontos} setPontos={setPontos} isSystemAdmin={isSystemAdmin}
                  USER_PROFILES={USER_PROFILES} supabase={supabase} permissions={permissions} />
              )}
            </motion.div>
          </AnimatePresence>
          {/* Modal Overlay History */}
          <AnimatePresence>
            {isHistoryModalOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex flex-col p-2 sm:p-6 bg-slate-950/90 backdrop-blur-xl shadow-2xl"
              >
                <div className="w-full max-w-6xl mx-auto flex flex-col flex-1 relative min-w-0">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-white tracking-tighter">Histórico de Transações</h2>
                    <button onClick={() => setIsHistoryModalOpen(false)} className="p-3 text-slate-400 hover:text-white bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 shadow-lg transition-colors cursor-pointer"><X size={24} /></button>
                  </div>
                  <div className="bg-slate-950 rounded-[24px] border border-slate-800 p-6 flex-1 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-y-auto overflow-x-hidden min-w-0">
                    <ListView 
                        title="Todas as Transações" 
                        data={transactions} 
                    collName="transactions" 
                      onAdd={() => { setEditingId(null); setFormData({ type: 'income', status: 'pending', data: getBRTDateString() }); setIsModalOpen(true); setIsHistoryModalOpen(false); }} 
                      permissions={permissions}
                    handleToggleStatus={handleToggleStatus}
                    setFormData={setFormData}
                    setEditingId={setEditingId}
                    setIsModalOpen={(open: boolean) => { setIsModalOpen(open); if(open) setIsHistoryModalOpen(false); }}
                    extraAction={permissions?.canExportReport('finance') ? { label: 'Relatório PDF', icon: <Download size={14} />, onClick: () => { setReportType('finance'); setIsReportModalOpen(true); } } : undefined}
                    setItemToDelete={setItemToDelete}
                    isSystemAdmin={isSystemAdmin}
                  USER_PROFILES={USER_PROFILES}
                    fetchCollections={fetchCollections}
                    columns={[
                      {
                        key: 'type', 
                        label: 'Tipo', 
                        render: (val: any) => val === 'income' 
                          ? <span className="flex items-center gap-1 text-emerald-400 font-black text-[10px] uppercase tracking-widest"><ArrowUpCircle size={14}/> Entrada</span> 
                          : <span className="flex items-center gap-1 text-red-400 font-black text-[10px] uppercase tracking-widest"><ArrowDownCircle size={14}/> Saída</span>
                      },
                      {
                        key: 'cliente', 
                        label: 'Descrição', 
                        render: (_: any, item: any) => (
                          <span className="font-bold text-white text-sm">
                            {item.cliente || item.descricao || '--'}
                          </span>
                        )
                      },
                      {
                        key: 'valor', 
                        label: 'Valor', 
                        render: (val: any, item: any) => <FinancialDisplay value={Number(val)} base={item.type === 'income' ? totals.income : totals.expenses} mode={financialDisplayMode} className={`font-black font-mono tracking-tighter ${item.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`} />
                      },
                      {
                        key: 'data', 
                        label: 'Data', 
                        render: (val: any) => <span className="font-mono text-slate-400 text-xs">{new Date(val).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                      },
                      {
                        key: 'status', 
                        label: 'Status', 
                        render: (val: any, item: any) => item.type === 'income' ? (
                          val === 'received' 
                            ? <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-[10px] font-bold uppercase tracking-wider">Recebido</span>
                            : <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded-md text-[10px] font-bold uppercase tracking-wider">Pendente</span>
                        ) : (
                          <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-md text-[10px] font-bold uppercase tracking-wider">Pago</span>
                        )
                      }
                    ]}
                  />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Modal de Confirmação de Exclusão */}
          <AnimatePresence>
            {itemToDelete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
              >
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-2">Confirmar Exclusão</h3>
                  <p className="text-sm text-slate-400 mb-6">Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.</p>
                  <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => setItemToDelete(null)} disabled={isProcessing}>Cancelar</Button>
                    <Button variant="danger" className="flex-1" disabled={isProcessing} onClick={async () => {
                      if (!itemToDelete) return;
                      setIsProcessing(true);
                      const { id, type, collName } = itemToDelete;
                      const coll = collName || (type === 'transaction' || type === 'transactions' ? 'transactions' : (type === 'client' ? 'clients' : (type === 'appointment' ? 'appointments' : 'tasks')));
                      try {
                        const { error } = await supabase.from(coll).delete().eq('id', id);
                        if (error) throw error;
                        fetchCollections(coll);
                      } catch (err: any) {
                        alert('Erro ao excluir: ' + err.message);
                      } finally {
                        setItemToDelete(null);
                        setIsProcessing(false);
                      }
                    }}>{isProcessing ? 'Excluindo...' : 'Excluir'}</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
{/* Modal Overlay Principal */}
          <AnimatePresence>
            {isModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm"
              >
                <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden relative">
                  <div className="p-6 md:p-8 flex-shrink-0 border-b border-slate-800">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black text-white tracking-tighter">
                      {editingId ? 'Editar Registro' : 'Novo Registro'}
                    </h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                      <X size={24} />
                    </button>
                  </div>
                  </div>
                  
                  <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-4">
                    {activeTab === 'clients' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome Completo</label>
                             <input type="text" placeholder="Ex: João da Silva" value={formData.nome || ''} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                           </div>
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Empresa</label>
                             <input type="text" placeholder="Ex: Freitas Hub Agência" value={formData.empresa || ''} onChange={(e) => setFormData({...formData, empresa: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                           </div>
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">CPF/CNPJ</label>
                             <input type="text" placeholder="Ex: 00.000.000/0000-00" value={formData.cnpj || ''} onChange={(e) => setFormData({...formData, cnpj: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                           </div>
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Telefone / WhatsApp</label>
                             <input type="text" placeholder="Ex: (11) 99999-9999" value={formData.telefone || ''} onChange={(e) => setFormData({...formData, telefone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                           </div>
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Telefone Secundário</label>
                             <input type="text" placeholder="Ex: (11) 98888-8888" value={formData.telefone_secundario || ''} onChange={(e) => setFormData({...formData, telefone_secundario: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                           </div>
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email</label>
                             <input type="text" autoComplete="off" data-lpignore="true" data-1p-ignore="true" placeholder="Ex: contato@empresa.com" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                           </div>
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Origem do Lead</label>
                             <input type="text" placeholder="Ex: Instagram, Indicação, Google" value={formData.origem || ''} onChange={(e) => setFormData({...formData, origem: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                           </div>
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dia de Pagamento</label>
                             <input type="number" min="1" max="31" placeholder="Ex: 5" value={formData.dia_pagamento || ''} onChange={(e) => setFormData({...formData, dia_pagamento: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                           </div>
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Início do Contrato</label>
                             <input type="date" value={formData.data_inicio_contrato || ''} onChange={(e) => setFormData({...formData, data_inicio_contrato: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                           </div>
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fim do Contrato</label>
                             <input type="date" value={formData.data_fim_contrato || ''} onChange={(e) => setFormData({...formData, data_fim_contrato: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                           </div>
                           <div className="space-y-2 md:col-span-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Endereço Completo (com Cidade e Estado)</label>
                             <input type="text" placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo - SP" value={formData.endereco || ''} onChange={(e) => setFormData({...formData, endereco: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                           </div>
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status (Funil)</label>
                             <select value={formData.status || 'Proposta Enviada'} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50">
                               <option value="Proposta Enviada">Proposta Enviada</option>
                               <option value="Negociação">Negociação</option>
                               <option value="Aguardando Retorno">Aguardando Retorno</option>
                               <option value="Cliente Ativo">Cliente Ativo</option>
                               <option value="Venda Concluída">Venda Concluída</option>
                               <option value="Lead Perdido">Lead Perdido</option>
                             </select>
                           </div>
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Prioridade</label>
                             <select value={formData.prioridade || 'Média'} onChange={(e) => setFormData({...formData, prioridade: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50">
                               <option value="Alta">Alta</option>
                               <option value="Média">Média</option>
                               <option value="Baixa">Baixa</option>
                             </select>
                           </div>
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Qualificação</label>
                             <select value={formData.qualificacao || 'Frio'} onChange={(e) => setFormData({...formData, qualificacao: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50">
                               <option value="Quente">Quente</option>
                               <option value="Morno">Morno</option>
                               <option value="Frio">Frio</option>
                             </select>
                           </div>
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Valor do Serviço</label>
                             <input type="text" placeholder="R$ 0,00" value={formData.valor_servico || ''} onChange={(e) => setFormData({...formData, valor_servico: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                           </div>
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Serviço Dividido?</label>
                             <select value={formData.dividido || 'Não'} onChange={(e) => setFormData({...formData, dividido: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50">
                               <option value="Não">Não</option>
                               <option value="Sim">Sim</option>
                             </select>
                           </div>
                           {formData.dividido === 'Sim' && (
                             <>
                               <div className="space-y-2">
                                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Data Inicial</label>
                                 <input type="date" value={formData.data_inicial || ''} onChange={(e) => setFormData({...formData, data_inicial: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                               </div>
                               <div className="space-y-2">
                                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Data Final</label>
                                 <input type="date" value={formData.data_final || ''} onChange={(e) => setFormData({...formData, data_final: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                               </div>
                               <div className="space-y-2 md:col-span-2">
                                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Valor Sugerido (Parcela)</label>
                                 <input type="text" placeholder="R$ 0,00" value={formData.valor_sugerido || ''} onChange={(e) => setFormData({...formData, valor_sugerido: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                               </div>
                             </>
                           )}
                           <div className="space-y-2 md:col-span-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Anotações / Histórico Inicial</label>
                             <textarea placeholder="Ex: Lead interessado no serviço X, entrou em contato dia..." value={formData.anotacoes || ''} onChange={(e) => setFormData({...formData, anotacoes: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 h-24 resize-none" />
                           </div>
                        </div>
                      </>
                    )}

                    {activeTab === 'tasks' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Título</label>
                          <input type="text" value={formData.titulo || ''} onChange={(e) => setFormData({...formData, titulo: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Descrição</label>
                          <textarea value={formData.descricao || ''} onChange={(e) => setFormData({...formData, descricao: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 h-24 resize-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Data Prevista</label>
                            <input type="date" value={formData.data || ''} onChange={(e) => setFormData({...formData, data: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Prioridade</label>
                            <select value={formData.prioridade || 'medium'} onChange={(e) => setFormData({...formData, prioridade: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50">
                              <option value="low">Baixa</option>
                              <option value="medium">Média</option>
                              <option value="high">Alta</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Responsável</label>
                          <select value={formData.atribuido_a || currentUserProfile} onChange={(e) => setFormData({...formData, atribuido_a: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50">
                            {RESPONSAVEIS.map((r: any) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <input type="checkbox" id="task_diaria" checked={formData.is_recurring || false} onChange={(e) => setFormData({...formData, is_recurring: e.target.checked})} className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500" />
                          <label htmlFor="task_diaria" className="text-sm font-bold text-slate-300">Tarefa Diária (Recorrente)</label>
                        </div>
                      </>
                    )}

                    {activeTab === 'agenda' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Compromisso</label>
                          <input type="text" value={formData.titulo_evento || formData.titulo || ''} onChange={(e) => setFormData({...formData, titulo_evento: e.target.value, titulo: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Localização</label>
                          <input type="text" value={formData.localizacao || ''} onChange={(e) => setFormData({...formData, localizacao: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Data</label>
                            <input type="date" value={formData.data || ''} onChange={(e) => setFormData({...formData, data: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hora</label>
                            <input type="time" value={formData.hora || ''} onChange={(e) => setFormData({...formData, hora: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Observações</label>
                          <textarea value={formData.descricao || ''} onChange={(e) => setFormData({...formData, descricao: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 h-24 resize-none" />
                        </div>
                      </>
                    )}

                    {activeTab === 'financial_control' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tipo</label>
                            <div className="flex gap-2">
                              <button className={`flex-1 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-all border ${formData.type === 'income' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`} onClick={() => setFormData({...formData, type: 'income'})}>Entrada</button>
                              <button className={`flex-1 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-all border ${formData.type === 'expense' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`} onClick={() => setFormData({...formData, type: 'expense'})}>Saída</button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Categoria</label>
                            <select value={formData.categoria || 'Serviços'} onChange={(e) => setFormData({...formData, categoria: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50">
                              {formData.type === 'income' ? (
                                <>
                                  <option value="Serviços">Serviços</option>
                                  <option value="Vendas">Vendas</option>
                                  <option value="Outros">Outros</option>
                                </>
                              ) : (
                                <>
                                  <option value="Operacional">Operacional</option>
                                  <option value="Marketing">Marketing</option>
                                  <option value="Ferramentas">Ferramentas</option>
                                  <option value="Impostos">Impostos</option>
                                  <option value="Pessoal">Pessoal</option>
                                  <option value="Outros">Outros</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formData.type === 'income' ? 'Cliente / Origem' : 'Descrição'}</label>
                          <input type="text" value={formData.cliente || formData.descricao || ''} onChange={(e) => setFormData({...formData, cliente: e.target.value, descricao: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Valor (R$)</label>
                            <input type="number" step="0.01" value={formData.valor || ''} onChange={(e) => setFormData({...formData, valor: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Forma de Pgto</label>
                            <select value={formData.forma_pagamento || 'PIX'} onChange={(e) => setFormData({...formData, forma_pagamento: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50">
                              <option value="PIX">PIX</option>
                              <option value="Cartão de Crédito">Cartão de Crédito</option>
                              <option value="Boleto">Boleto</option>
                              <option value="Transferência">Transferência</option>
                              <option value="Dinheiro">Dinheiro</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Data</label>
                            <input type="date" value={formData.data || ''} onChange={(e) => setFormData({...formData, data: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status</label>
                            <select value={formData.status || (formData.type === 'income' ? 'received' : 'paid')} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50">
                              {formData.type === 'income' ? (
                                <>
                                  <option value="received">Recebido</option>
                                  <option value="pending">Pendente</option>
                                </>
                              ) : (
                                <>
                                  <option value="paid">Pago</option>
                                  <option value="pending">Pendente</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Observação</label>
                          <textarea value={formData.observacao || ''} onChange={(e) => setFormData({...formData, observacao: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 h-24 resize-none" placeholder="Observações adicionais (aparecerá apenas ao abrir o registro)..." />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="p-6 md:p-8 flex-shrink-0 border-t border-slate-800 bg-slate-900 rounded-b-3xl">
                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)} disabled={isProcessing}>Cancelar</Button>
                      <Button variant="primary" className="flex-1" onClick={() => handleSave(activeTab)} disabled={isProcessing}>{isProcessing ? 'Salvando...' : 'Salvar'}</Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      
      <AnimatePresence>
        {isReportModalOpen && (
          <motion.div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800/60 flex-shrink-0 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Download size={20} className="text-emerald-500" /> Gerar Relatório</h3>
                <button onClick={() => setIsReportModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {(reportType === 'tasks' || reportType === 'productivity') && USER_PROFILES[currentUserProfile]?.role === 'administrator' && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Usuário</label>
                    <select
                      value={reportModalUser}
                      onChange={(e) => setReportModalUser(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="all">Todos os Usuários</option>
                      {RESPONSAVEIS.map((r: any) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Data Inicial (opcional)</label>
                  <input
                    type="date"
                    value={reportDateStart}
                    onChange={(e) => setReportDateStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Data Final (opcional)</label>
                  <input
                    type="date"
                    value={reportDateEnd}
                    onChange={(e) => setReportDateEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-800/60 flex-shrink-0 bg-slate-900">
              <Button
                onClick={() => {
                  const finalUser = USER_PROFILES[currentUserProfile]?.role === 'administrator' ? reportModalUser : currentUserProfile;
                  executeReport(reportType, reportDateStart, reportDateEnd, finalUser);
                  setIsReportModalOpen(false);
                }}
                className="w-full py-4 text-xs font-bold uppercase tracking-widest"
              >
                Baixar PDF
              </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </main>
    </div>
  );
}

