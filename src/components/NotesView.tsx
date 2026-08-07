import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Edit3, Trash2, Pin, Check, Copy, Download, 
  FileText, Tag, Calendar, Sparkles, Filter, X, Eye, ChevronRight,
  Crown, Briefcase, TrendingUp, GraduationCap, Compass, Users,
  ShieldCheck, ClipboardCheck, AlertTriangle, Sliders, Award, BookOpen,
  Target, CheckSquare, Zap, Building2, PieChart, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  color: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  responsavel?: string;
  supabaseId?: string;
}

export type NoteProfileRole = 'ceo' | 'mentor' | 'qualidade' | 'geral';

export const getNoteProfileRole = (profileKey: string, userObj?: any, userProfilesObj?: any): NoteProfileRole => {
  const profile = userProfilesObj?.[profileKey];
  const label = (profile?.label || profileKey || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const email = (profile?.email || userObj?.email || profileKey || '').toLowerCase();

  // CEO / Administrativo: Núbia, Lucas, Luan
  if (
    label.includes('nubia') || label.includes('lucas') || label.includes('luan') ||
    email.includes('nubia') || email.includes('lucas') || email.includes('luan') ||
    label.includes('ceo') || label.includes('diretoria')
  ) {
    return 'ceo';
  }

  // Mentor: CAE / Caetano
  if (
    label.includes('cae') || label.includes('caetano') || email.includes('caetano') ||
    label.includes('mentor')
  ) {
    return 'mentor';
  }

  // Gestor de Qualidade: Vagner
  if (
    label.includes('vagner') || email.includes('vagner') ||
    label.includes('qualidade') || label.includes('sgq')
  ) {
    return 'qualidade';
  }

  return 'geral';
};

const ROLE_CONFIGS: Record<NoteProfileRole, {
  role: NoteProfileRole;
  badge: string;
  badgeColor: string;
  titleSuffix: string;
  subtitle: (userName: string) => string;
  categories: string[];
  defaultCategory: string;
  bannerGradient: string;
  accentColor: string;
  primaryButtonBg: string;
  iconBg: string;
  iconColor: string;
  mainIcon: React.ElementType;
  templates: {
    id: string;
    label: string;
    description: string;
    category: string;
    color: string;
    title: string;
    content: string;
    icon: React.ElementType;
  }[];
}> = {
  ceo: {
    role: 'ceo',
    badge: 'CEO & Diretoria Executiva',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    titleSuffix: 'Executivas & Gestão',
    subtitle: (userName) => `Painel executivo exclusivo de ${userName}. Foco em diretrizes de alto nível, investimentos, metas globais, decisões de diretoria e governança.`,
    categories: ['Todas', 'Decisões Estratégicas', 'Metas Globais', 'Finanças & Diretoria', 'Governança & Adm', 'Investimentos', 'Geral'],
    defaultCategory: 'Decisões Estratégicas',
    bannerGradient: 'from-slate-900 via-amber-950/20 to-purple-950/30 border-amber-500/30',
    accentColor: 'amber',
    primaryButtonBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.25)]',
    iconBg: 'bg-amber-500/10 border-amber-500/20',
    iconColor: 'text-amber-400',
    mainIcon: Crown,
    templates: [
      {
        id: 'ata_diretoria',
        label: 'Ata de Diretoria',
        description: 'Reunião executiva e deliberações',
        category: 'Decisões Estratégicas',
        color: 'amber',
        title: 'Ata de Reunião de Diretoria - [Data]',
        content: `📌 PAUTA DA REUNIÃO:\n1. \n2. \n\n🎯 DECISÕES E DELIBERAÇÕES TOMADAS:\n- \n- \n\n👤 RESPONSÁVEIS E METAS:\n- Responsável: \n- Prazo: \n\n💰 IMPACTO FINANCEIRO / ORÇAMENTÁRIO:\n- Valor estimado: R$ \n- Parecer: Aprovado`,
        icon: Crown
      },
      {
        id: 'plan_estrategico',
        label: 'Planejamento Estratégico',
        description: 'OKRs e metas de longo prazo',
        category: 'Metas Globais',
        color: 'purple',
        title: 'Planejamento Estratégico - [Trimestre/Ano]',
        content: `🚀 OBJETIVOS ESTRATÉGICOS GLOBAIS:\n1. \n2. \n\n📈 OKRs E INDICADORES DE SUCESSO:\n- Metric 1: \n- Metric 2: \n\n💵 ALOCAÇÃO DE RECURSOS:\n- Budget Aprovado: R$ \n\n🗓️ CRONOGRAMA DE EXECUÇÃO:\n- Q1: \n- Q2: `,
        icon: TrendingUp
      },
      {
        id: 'diretriz_adm',
        label: 'Diretriz Administrativa',
        description: 'Políticas e regras de gestão',
        category: 'Governança & Adm',
        color: 'emerald',
        title: 'Diretriz Administrativa - [Assunto]',
        content: `📋 ESCOPO E APLICAÇÃO:\n- Setores / Colaboradores afetados: \n\n📜 REGRA / DIRETRIZ:\n1. \n2. \n\n⚠️ INSTRUÇÕES DE CUMPRIMENTO:\n- Data de início de vigência: \n- Responsável pela fiscalização: `,
        icon: Briefcase
      },
      {
        id: 'decisao_investimento',
        label: 'Decisão de Investimento',
        description: 'Análise de orçamento e ROI',
        category: 'Investimentos',
        color: 'blue',
        title: 'Análise de Investimento - [Projeto]',
        content: `💵 VALOR SOLICITADO: R$ \n\n📊 RETORNO ESPERADO (ROI):\n- \n\n⚖️ ANÁLISE DE RISCO:\n- Risco Principal: \n- Mitigação: \n\n✅ STATUS:\n- [ ] Aprovado pela Diretoria`,
        icon: Building2
      }
    ]
  },
  mentor: {
    role: 'mentor',
    badge: 'Mentor & Desenvolvimento de Pessoas',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    titleSuffix: 'Mentoria & Orientação',
    subtitle: (userName) => `Painel de mentoria exclusivo de ${userName}. Foco em Planos de Desenvolvimento (PDI), sessões de mentoria, feedback estruturado e acompanhamento de carreira.`,
    categories: ['Todas', 'Planos de PDI', 'Sessão de Mentoria', 'Feedback & Acompanhamento', 'Direcionamento', 'Metas Pessoais', 'Geral'],
    defaultCategory: 'Sessão de Mentoria',
    bannerGradient: 'from-slate-900 via-purple-950/20 to-cyan-950/30 border-purple-500/30',
    accentColor: 'purple',
    primaryButtonBg: 'bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-[0_0_25px_rgba(168,85,247,0.25)]',
    iconBg: 'bg-purple-500/10 border-purple-500/20',
    iconColor: 'text-purple-400',
    mainIcon: GraduationCap,
    templates: [
      {
        id: 'plano_pdi',
        label: 'Plano de PDI',
        description: 'Desenvolvimento individual do mentorado',
        category: 'Planos de PDI',
        color: 'purple',
        title: 'PDI - [Nome do Mentorado]',
        content: `👤 MENTORADO(A): \n📅 PERÍODO DE ACOMPANHAMENTO: \n\n⭐ PONTOS FORTES ATUAIS:\n1. \n2. \n\n🎯 OPORTUNIDADES DE DESENVOLVIMENTO:\n1. \n2. \n\n🚀 PLANO DE AÇÃO (O QUE / COMO / QUANDO):\n- Ação 1: \n- Ação 2: \n\n📊 MÉTRICA DE SUCESSO:\n- `,
        icon: GraduationCap
      },
      {
        id: 'sessao_mentoria',
        label: 'Sessão de Mentoria',
        description: 'Ata de sessão e direcionamentos',
        category: 'Sessão de Mentoria',
        color: 'cyan',
        title: 'Mentoria - [Mentorado] - [Data]',
        content: `💡 TÓPICOS DISCUTIDOS:\n- \n- \n\n🧠 INSIGHTS E REFLEXÕES DISCUTIDAS:\n- \n\n🤝 COMPROMISSOS PARA O PRÓXIMO ENCONTRO:\n1. \n2. \n\n📅 PRÓXIMA SESSÃO: `,
        icon: Compass
      },
      {
        id: 'feedback_estruturado',
        label: 'Feedback Estruturado',
        description: 'Avaliação orientada e construtiva',
        category: 'Feedback & Acompanhamento',
        color: 'emerald',
        title: 'Feedback - [Pessoa / Equipe]',
        content: `📌 CONTEXTO E OBSERVAÇÕES:\n- \n\n👏 PONTOS POSITIVOS E DESTAQUES:\n- \n\n💡 OPORTUNIDADES DE EVOLUÇÃO:\n- \n\n🎯 EXPECTATIVAS E PRÓXIMOS PASSOS:\n- `,
        icon: Users
      },
      {
        id: 'direcionamento_carreira',
        label: 'Direcionamento de Carreira',
        description: 'Metas e soft/hard skills',
        category: 'Direcionamento',
        color: 'amber',
        title: 'Alinhamento de Carreira - [Mentorado]',
        content: `🔮 OBJETIVOS DE MÉDIO / LONGO PRAZO:\n- \n\n🛠️ HABILIDADES A DESENVOLVER:\n- Hard Skills: \n- Soft Skills: \n\n📚 RECOMENDAÇÕES (LIVROS/CURSOS):\n- `,
        icon: BookOpen
      }
    ]
  },
  qualidade: {
    role: 'qualidade',
    badge: 'Gestor de Qualidade & SGQ',
    badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    titleSuffix: 'Qualidade & Processos',
    subtitle: (userName) => `Painel de gestão de qualidade exclusivo de ${userName}. Foco em auditorias internas, Não Conformidades (NC), procedimentos padrão (POPs), indicadores (KPIs) e melhoria contínua.`,
    categories: ['Todas', 'Auditoria & Conformidade', 'Processos & POPs', 'Indicadores (KPIs)', 'Não Conformidades (NC)', 'Melhoria Contínua', 'Geral'],
    defaultCategory: 'Auditoria & Conformidade',
    bannerGradient: 'from-slate-900 via-teal-950/20 to-sky-950/30 border-teal-500/30',
    accentColor: 'teal',
    primaryButtonBg: 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-[0_0_25px_rgba(20,184,166,0.25)]',
    iconBg: 'bg-teal-500/10 border-teal-500/20',
    iconColor: 'text-teal-400',
    mainIcon: ShieldCheck,
    templates: [
      {
        id: 'auditoria_interna',
        label: 'Relatório de Auditoria',
        description: 'Verificação de processos e evidências',
        category: 'Auditoria & Conformidade',
        color: 'teal',
        title: 'Auditoria Interna - [Processo/Setor]',
        content: `🔎 ESCOPO DA AUDITORIA:\n- Processo / Setor: \n- Auditor responsável: Vagner\n- Data: \n\n✅ CONFORMIDADES CONSTATADAS:\n1. \n2. \n\n⚠️ ACHADOS / OPORTUNIDADES DE MELHORIA:\n1. \n2. \n\n📋 PARECER FINAL:\n- Conforme / Necessita Ação Corretiva`,
        icon: ClipboardCheck
      },
      {
        id: 'nao_conformidade_rnc',
        label: 'Registro de NC (RNC)',
        description: 'Análise de causa raiz e 5 Porquês',
        category: 'Não Conformidades (NC)',
        color: 'rose',
        title: 'RNC #[Número] - [Descrição do Desvio]',
        content: `🚨 DESCRIÇÃO DA NÃO CONFORMIDADE:\n- \n\n🔍 ANÁLISE DE CAUSA RAIZ (5 PORQUÊS):\n1. Por que ocorreu? \n2. Por que? \n3. Por que? \n\n🛠️ AÇÃO CORRETIVA E PREVENTIVA:\n- \n\n⏱️ PRAZO E RESPONSÁVEL:\n- Responsável: \n- Prazo final: `,
        icon: AlertTriangle
      },
      {
        id: 'processo_pop',
        label: 'Procedimento POP',
        description: 'Mapeamento de processo padrão',
        category: 'Processos & POPs',
        color: 'blue',
        title: 'POP #[CÓDIGO] - [Nome do Processo]',
        content: `🎯 OBJETIVO DO PROCEDIMENTO:\n- \n\n👤 RESPONSÁVEL PELA EXECUÇÃO:\n- \n\n📝 PASSO A PASSO DETALHADO:\n1. \n2. \n3. \n\n🚨 CRITÉRIOS DE ACEITAÇÃO / CONTROLE:\n- `,
        icon: Sliders
      },
      {
        id: 'analise_kpi',
        label: 'Análise de KPI',
        description: 'Desvios de metas e ações',
        category: 'Indicadores (KPIs)',
        color: 'amber',
        title: 'Análise de Indicador (KPI) - [Mês/Setor]',
        content: `📊 INDICADOR ANALISADO:\n- Meta Estabelecida: \n- Resultado Medido: \n\n📈 ANÁLISE DO DESVIO:\n- \n\n🚀 PLANO DE AÇÃO PARA RECUPERAÇÃO:\n1. \n2. `,
        icon: Activity
      }
    ]
  },
  geral: {
    role: 'geral',
    badge: 'Bloco de Notas Privado',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    titleSuffix: 'Pessoais & Lembretes',
    subtitle: (userName) => `Aba de anotações exclusiva de ${userName}. Suas anotações são privativas e sincronizadas apenas com o seu usuário.`,
    categories: ['Todas', 'Geral', 'Finanças', 'Contabilidade', 'Impostos', 'Lembretes', 'Urgente'],
    defaultCategory: 'Geral',
    bannerGradient: 'from-slate-900 via-slate-900/90 to-emerald-950/40 border-slate-800',
    accentColor: 'emerald',
    primaryButtonBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.25)]',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    iconColor: 'text-emerald-400',
    mainIcon: FileText,
    templates: [
      {
        id: 'lembrete_geral',
        label: 'Lembrete Rápido',
        description: 'Tarefas e anotações do dia a dia',
        category: 'Lembretes',
        color: 'emerald',
        title: 'Lembrete - [Assunto]',
        content: `📌 NOTA RÁPIDA:\n- \n\n⏰ PRAZO OU DATA HORA:\n- `,
        icon: Zap
      },
      {
        id: 'resumo_financeiro',
        label: 'Resumo Financeiro',
        description: 'Observações de caixa e pagamentos',
        category: 'Finanças',
        color: 'amber',
        title: 'Observação Financeira - [Data]',
        content: `💵 MOVIMENTAÇÃO / RESUMO:\n- \n\n⚠️ PONTOS DE ATENÇÃO:\n- `,
        icon: PieChart
      }
    ]
  }
};

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badgeBg: string; badgeText: string }> = {
  emerald: {
    bg: 'bg-emerald-950/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
  },
  amber: {
    bg: 'bg-amber-950/20',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
  },
  blue: {
    bg: 'bg-blue-950/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
  },
  purple: {
    bg: 'bg-purple-950/20',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-400',
  },
  cyan: {
    bg: 'bg-cyan-950/20',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
  },
  teal: {
    bg: 'bg-teal-950/20',
    border: 'border-teal-500/30',
    text: 'text-teal-400',
    badgeBg: 'bg-teal-500/10',
    badgeText: 'text-teal-400',
  },
  rose: {
    bg: 'bg-rose-950/20',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-400',
  },
  slate: {
    bg: 'bg-slate-900/50',
    border: 'border-slate-800',
    text: 'text-slate-300',
    badgeBg: 'bg-slate-800',
    badgeText: 'text-slate-400',
  }
};

interface NotesViewProps {
  currentUserProfile: string;
  user: any;
  supabase: any;
  USER_PROFILES: any;
  permissions: any;
  tasks?: any[];
  fetchCollections?: (coll?: string) => Promise<void>;
}

export const NotesView: React.FC<NotesViewProps> = ({
  currentUserProfile,
  user,
  supabase,
  USER_PROFILES,
  permissions,
  tasks = [],
  fetchCollections
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  // Profile Role Configuration
  const profileRole = useMemo(() => getNoteProfileRole(currentUserProfile, user, USER_PROFILES), [currentUserProfile, user, USER_PROFILES]);
  const roleConfig = useMemo(() => ROLE_CONFIGS[profileRole], [profileRole]);

  // Modal Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState(roleConfig.defaultCategory);
  const [formColor, setFormColor] = useState('emerald');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const localKey = useMemo(() => `notes_cache_${currentUserProfile}`, [currentUserProfile]);

  // Load notes from local storage and Supabase tasks table
  useEffect(() => {
    let localNotes: Note[] = [];
    try {
      const saved = localStorage.getItem(localKey);
      if (saved) {
        localNotes = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Erro ao carregar anotações locais:', e);
    }

    const deletedKey = `${localKey}_deleted`;
    let deletedIds = new Set<string>();
    try {
      const savedDeleted = localStorage.getItem(deletedKey);
      if (savedDeleted) {
        deletedIds = new Set(JSON.parse(savedDeleted));
      }
    } catch (_) {}

    if (!tasks) {
      setNotes(localNotes.filter(n => !deletedIds.has(n.id) && (!n.supabaseId || !deletedIds.has(n.supabaseId))));
      return;
    }

    const userLabel = USER_PROFILES[currentUserProfile]?.label;
    const userEmail = USER_PROFILES[currentUserProfile]?.email || currentUserProfile;

    const isNoteForCurrentUser = (t: any) => {
      if (!t.titulo || !t.titulo.startsWith('[ANOTACAO]')) return false;
      if (deletedIds.has(String(t.id))) return false;

      const matchResp = t.responsavel && (
        t.responsavel === currentUserProfile || 
        t.responsavel === userEmail || 
        (userLabel && t.responsavel.toLowerCase() === userLabel.toLowerCase())
      );
      const matchAttr = t.atribuido_a && (
        t.atribuido_a === currentUserProfile || 
        t.atribuido_a === userEmail || 
        (userLabel && t.atribuido_a.toLowerCase() === userLabel.toLowerCase())
      );
      const matchEditor = t.editor_nome && userLabel && t.editor_nome.toLowerCase() === userLabel.toLowerCase();
      const matchUserId = user?.id && t.user_id && t.user_id === user.id && userEmail === currentUserProfile;

      if (matchResp || matchAttr || matchEditor) return true;
      if (!t.responsavel && !t.atribuido_a && !t.editor_nome && matchUserId) return true;

      return false;
    };

    // Extract notes from Supabase tasks table (tasks starting with [ANOTACAO]) belonging ONLY to current user/profile
    const dbNotes: Note[] = tasks
      .filter(isNoteForCurrentUser)
      .map((t: any) => {
        let title = t.titulo.replace('[ANOTACAO]', '').trim();
        let category = 'Finanças';
        let color = 'emerald';
        let isPinned = false;

        let content = t.descricao || '';
        try {
          if (content.startsWith('{') && content.endsWith('}')) {
            const parsed = JSON.parse(content);
            if (parsed.content !== undefined) {
              content = parsed.content;
              category = parsed.category || category;
              color = parsed.color || color;
              isPinned = parsed.isPinned || false;
            }
          }
        } catch (_) {}

        return {
          id: String(t.id),
          supabaseId: String(t.id),
          title: title || 'Anotação sem título',
          content,
          category,
          color,
          isPinned,
          createdAt: t.created_at || new Date().toISOString(),
          updatedAt: t.updated_at || new Date().toISOString(),
          responsavel: t.responsavel || currentUserProfile
        };
      });

    const dbNoteIds = new Set(dbNotes.map(n => n.id));

    // Keep local-only notes that have no matching DB entry and were not deleted
    const localOnlyNotes = localNotes.filter(
      n => !deletedIds.has(n.id) && (!n.supabaseId || !deletedIds.has(n.supabaseId)) && n.id.startsWith('note_') && (!n.supabaseId || !dbNoteIds.has(n.supabaseId))
    );

    const merged = [...dbNotes, ...localOnlyNotes];

    merged.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    setNotes(merged);
    try {
      localStorage.setItem(localKey, JSON.stringify(merged));
    } catch (e) {
      console.warn('Erro ao salvar local storage:', e);
    }
  }, [tasks, localKey, currentUserProfile, user, USER_PROFILES]);

  // Save notes array to localStorage
  const saveLocalNotes = (updated: Note[]) => {
    setNotes(updated);
    try {
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar no local storage:', e);
    }
  };

  // Open modal for new note
  const handleOpenNew = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory(roleConfig.defaultCategory);
    setFormColor(roleConfig.accentColor || 'emerald');
    setFormIsPinned(false);
    setIsModalOpen(true);
  };

  // Apply a template preset
  const handleApplyTemplate = (tmpl: typeof roleConfig.templates[0]) => {
    setEditingNote(null);
    setFormTitle(tmpl.title);
    setFormContent(tmpl.content);
    setFormCategory(tmpl.category);
    setFormColor(tmpl.color || roleConfig.accentColor);
    setFormIsPinned(false);
    setIsModalOpen(true);
  };

  // Open modal for editing note
  const handleOpenEdit = (note: Note) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormCategory(note.category || roleConfig.defaultCategory);
    setFormColor(note.color || 'emerald');
    setFormIsPinned(note.isPinned || false);
    setIsModalOpen(true);
  };

  // Save note to state, local storage and Supabase
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() && !formContent.trim()) return;

    setIsSaving(true);
    const now = new Date().toISOString();
    const noteId = editingNote ? editingNote.id : `note_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const jsonDesc = JSON.stringify({
      content: formContent,
      category: formCategory,
      color: formColor,
      isPinned: formIsPinned
    });

    const dbPayload = {
      titulo: `[ANOTACAO] ${formTitle.trim() || 'Anotação'}`,
      descricao: jsonDesc,
      status: 'pending',
      data: now.split('T')[0],
      responsavel: currentUserProfile,
      atribuido_a: currentUserProfile,
      editor_nome: USER_PROFILES[currentUserProfile]?.label || 'Renata',
      user_id: user?.id,
      updated_at: now
    };

    let finalNoteId = noteId;

    if (supabase && user) {
      try {
        if (editingNote && editingNote.supabaseId) {
          await supabase.from('tasks').update(dbPayload).eq('id', editingNote.supabaseId);
        } else {
          const { data, error } = await supabase.from('tasks').insert({
            ...dbPayload,
            created_at: now
          }).select('id').single();

          if (data?.id) {
            finalNoteId = data.id;
          }
        }
        if (fetchCollections) {
          fetchCollections('tasks');
        }
      } catch (err) {
        console.warn('Salvo localmente. Erro ao sincronizar Supabase:', err);
      }
    }

    const updatedNote: Note = {
      id: finalNoteId,
      supabaseId: finalNoteId,
      title: formTitle.trim() || 'Anotação sem título',
      content: formContent,
      category: formCategory,
      color: formColor,
      isPinned: formIsPinned,
      createdAt: editingNote ? editingNote.createdAt : now,
      updatedAt: now,
      responsavel: currentUserProfile
    };

    let updatedList: Note[];
    if (editingNote) {
      updatedList = notes.map(n => n.id === editingNote.id ? updatedNote : n);
    } else {
      updatedList = [updatedNote, ...notes];
    }

    saveLocalNotes(updatedList);
    setIsSaving(false);
    setIsModalOpen(false);
  };

  // Delete note
  const handleDeleteNote = async (id: string, supabaseId?: string) => {
    const targetSupabaseId = supabaseId || (!id.startsWith('note_') ? id : undefined);

    // Save deleted ID to persistent deleted list so useEffect won't resurrect it
    const deletedKey = `${localKey}_deleted`;
    try {
      const savedDeleted = localStorage.getItem(deletedKey);
      const deletedIds = savedDeleted ? JSON.parse(savedDeleted) : [];
      if (id && !deletedIds.includes(id)) deletedIds.push(id);
      if (targetSupabaseId && !deletedIds.includes(targetSupabaseId)) deletedIds.push(targetSupabaseId);
      localStorage.setItem(deletedKey, JSON.stringify(deletedIds));
    } catch (e) {
      console.warn('Erro ao salvar lista de excluídos:', e);
    }

    // Update local state and localStorage immediately
    setNotes(prev => {
      const updated = prev.filter(n => n.id !== id && (!targetSupabaseId || n.supabaseId !== targetSupabaseId));
      try {
        localStorage.setItem(localKey, JSON.stringify(updated));
      } catch (e) {
        console.warn('Erro ao salvar local storage:', e);
      }
      return updated;
    });

    if (viewingNote?.id === id || (targetSupabaseId && viewingNote?.supabaseId === targetSupabaseId)) {
      setViewingNote(null);
    }

    // Delete record from Supabase
    if (supabase && targetSupabaseId) {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', targetSupabaseId);
        if (error) {
          console.warn('Erro ao excluir no Supabase:', error);
        }
        if (fetchCollections) {
          fetchCollections('tasks');
        }
      } catch (err) {
        console.warn('Erro ao excluir no Supabase:', err);
      }
    }
  };

  // Toggle pin
  const handleTogglePin = async (note: Note) => {
    const updatedNote = { ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() };
    const updatedList = notes.map(n => n.id === note.id ? updatedNote : n);
    saveLocalNotes(updatedList);

    if (supabase && note.supabaseId) {
      try {
        const jsonDesc = JSON.stringify({
          content: note.content,
          category: note.category,
          color: note.color,
          isPinned: !note.isPinned
        });
        await supabase.from('tasks').update({ descricao: jsonDesc, updated_at: new Date().toISOString() }).eq('id', note.supabaseId);
      } catch (e) {
        console.warn('Erro ao atualizar pin no Supabase:', e);
      }
    }
  };

  // Copy note content
  const handleCopyNote = (note: Note) => {
    const text = `${note.title}\n\n${note.content}`;
    navigator.clipboard.writeText(text);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download note as txt
  const handleDownloadNote = (note: Note) => {
    const element = document.createElement("a");
    const file = new Blob([`${note.title}\nData: ${new Date(note.createdAt).toLocaleDateString('pt-BR')}\nCategoria: ${note.category}\n\n${note.content}`], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `${note.title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchesSearch = 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = selectedCategory === 'Todas' || n.category === selectedCategory;

      return matchesSearch && matchesCat;
    }).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, searchTerm, selectedCategory]);

  const userName = USER_PROFILES[currentUserProfile]?.label || 'Renata';
  const MainIcon = roleConfig.mainIcon;

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Top Banner / Header Customized per Role */}
      <div className={`bg-gradient-to-r ${roleConfig.bannerGradient} p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden`}>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl ${roleConfig.iconBg} flex items-center justify-center shadow-lg`}>
                <MainIcon size={24} className={roleConfig.iconColor} />
              </div>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border inline-block mb-1 ${roleConfig.badgeColor}`}>
                  {roleConfig.badge}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Anotações de {userName}
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {roleConfig.subtitle(userName)}
            </p>
          </div>

          <button
            id="btn-notes-new-top"
            onClick={handleOpenNew}
            className={`w-full sm:w-auto font-black px-6 py-4 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer group ${roleConfig.primaryButtonBg}`}
          >
            <Plus size={18} className="group-hover:scale-110 transition-transform" />
            Nova Anotação
          </button>
        </div>
      </div>

      {/* Role Preset Templates Bar */}
      {roleConfig.templates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles size={14} className={roleConfig.iconColor} /> Modelos Rápido & Presets de {userName}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Clique para abrir o modelo preenchido</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {roleConfig.templates.map(tmpl => {
              const TmplIcon = tmpl.icon;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 p-4 rounded-2xl text-left transition-all duration-200 group flex flex-col justify-between space-y-3 cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 group-hover:text-white transition-colors">
                      <TmplIcon size={18} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300 flex items-center gap-1 transition-colors">
                      Usar <ChevronRight size={12} />
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white group-hover:text-amber-300 transition-colors">
                      {tmpl.label}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-normal">
                      {tmpl.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls Bar: Search & Category Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="input-notes-search"
            type="text"
            placeholder="Pesquisar por título, conteúdo ou tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 transition-all font-medium"
          />
          {searchTerm && (
            <button
              id="btn-notes-clear-search"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {roleConfig.categories.map(cat => {
            const count = cat === 'Todas' ? notes.length : notes.filter(n => n.category === cat).length;
            const isSel = selectedCategory === cat;
            return (
              <button
                key={cat}
                id={`btn-notes-cat-${cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  isSel
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {cat} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div id="notes-empty-state" className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-500 mx-auto">
            <FileText size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Nenhuma anotação encontrada</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchTerm || selectedCategory !== 'Todas'
                ? 'Tente ajustar sua busca ou filtro de categoria.'
                : 'Clique no botão acima "Nova Anotação" para registrar sua primeira nota.'}
            </p>
          </div>
          <button
            id="btn-notes-new-empty"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            <Plus size={16} /> Criar Anotação Agora
          </button>
        </div>
      ) : (
        <div id="notes-grid-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => {
            const colorCfg = COLOR_MAP[note.color] || COLOR_MAP.emerald;
            return (
              <motion.div
                key={note.id}
                id={`note-card-${note.id}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl ${colorCfg.bg} ${colorCfg.border} hover:border-slate-600 bg-slate-900/80 backdrop-blur-sm`}
              >
                {/* Card Top Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span id={`note-badge-${note.id}`} className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${colorCfg.badgeBg} ${colorCfg.badgeText} border border-slate-800/50`}>
                      {note.category || 'Geral'}
                    </span>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        id={`btn-note-pin-${note.id}`}
                        onClick={(e) => { e.stopPropagation(); handleTogglePin(note); }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          note.isPinned 
                            ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' 
                            : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                        title={note.isPinned ? 'Desfixar anotação' : 'Fixar anotação no topo'}
                      >
                        <Pin size={14} className={note.isPinned ? 'fill-amber-400' : ''} />
                      </button>
                      <button
                        id={`btn-note-edit-${note.id}`}
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(note); }}
                        className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        id={`btn-note-delete-${note.id}`}
                        onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id, note.supabaseId); }}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Note Title */}
                  <h3 
                    id={`note-title-${note.id}`}
                    onClick={(e) => { e.stopPropagation(); setViewingNote(note); }}
                    className="text-base font-black text-white hover:text-emerald-400 transition-colors cursor-pointer line-clamp-1 mb-2 tracking-tight"
                  >
                    {note.title}
                  </h3>

                  {/* Note Content Excerpt */}
                  <p 
                    id={`note-content-${note.id}`}
                    onClick={(e) => { e.stopPropagation(); setViewingNote(note); }}
                    className="text-xs text-slate-400 line-clamp-4 leading-relaxed cursor-pointer font-sans whitespace-pre-wrap"
                  >
                    {note.content}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-slate-600" />
                    <span>{new Date(note.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id={`btn-note-copy-${note.id}`}
                      onClick={(e) => { e.stopPropagation(); handleCopyNote(note); }}
                      className="p-1 text-slate-500 hover:text-slate-200 transition-colors flex items-center gap-1"
                      title="Copiar texto"
                    >
                      {copiedId === note.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                    <button
                      id={`btn-note-download-${note.id}`}
                      onClick={(e) => { e.stopPropagation(); handleDownloadNote(note); }}
                      className="p-1 text-slate-500 hover:text-slate-200 transition-colors"
                      title="Baixar em arquivo .txt"
                    >
                      <Download size={12} />
                    </button>
                    <button
                      id={`btn-note-view-${note.id}`}
                      onClick={(e) => { e.stopPropagation(); setViewingNote(note); }}
                      className="text-emerald-400 font-bold hover:underline flex items-center gap-0.5 ml-1"
                    >
                      Ver <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal Editor / Creator */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight">
                      {editingNote ? 'Editar Anotação' : 'Nova Anotação'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Preencha os detalhes e salve para sincronizar com seu painel.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Título da Anotação
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Resumo do Fechamento Contábil de Julho..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-all font-bold"
                  />
                </div>

                {/* Category and Color Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Categoria
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                    >
                      {roleConfig.categories.filter(c => c !== 'Todas').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Destaque de Cor
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {['emerald', 'amber', 'blue', 'purple', 'rose', 'slate'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormColor(color)}
                          className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                            COLOR_MAP[color].bg
                          } ${COLOR_MAP[color].border} ${
                            formColor === color ? 'scale-110 border-white ring-2 ring-emerald-500/50' : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          {formColor === color && <Check size={12} className={COLOR_MAP[color].text} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Content Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Conteúdo
                  </label>
                  <textarea
                    rows={8}
                    required
                    placeholder="Escreva aqui suas anotações, lembretes, observações contábeis ou de movimentação financeira..."
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-all font-sans leading-relaxed resize-none"
                  />
                </div>

                {/* Pin Checkbox */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isPinnedCheck"
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/50"
                  />
                  <label htmlFor="isPinnedCheck" className="text-xs font-bold text-slate-300 cursor-pointer flex items-center gap-1.5">
                    <Pin size={14} className="text-amber-400" /> Fixar esta anotação no topo do painel
                  </label>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3 rounded-b-2xl pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Anotação'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Note Detail Modal */}
      <AnimatePresence>
        {viewingNote && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-950/50">
                <div className="space-y-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {viewingNote.category || 'Geral'}
                    </span>
                    {viewingNote.isPinned && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Pin size={10} className="fill-amber-400" /> Fixada
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight break-words">
                    {viewingNote.title}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Registrado em: {new Date(viewingNote.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>

                <button
                  onClick={() => setViewingNote(null)}
                  className="text-slate-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar bg-slate-900/60">
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {viewingNote.content}
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
                <button
                  onClick={() => handleDeleteNote(viewingNote.id, viewingNote.supabaseId)}
                  className="text-red-400 hover:text-red-300 font-bold text-xs uppercase tracking-wider px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-1"
                >
                  <Trash2 size={14} /> Excluir
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const n = viewingNote;
                      setViewingNote(null);
                      handleOpenEdit(n);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    <Edit3 size={14} /> Editar
                  </button>

                  <button
                    onClick={() => handleCopyNote(viewingNote)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    <Copy size={14} /> Copiar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotesView;
