import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Edit3, Trash2, Pin, Check, Copy, Download, 
  FileText, Tag, Calendar, Sparkles, Filter, X, Eye, ChevronRight
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

const CATEGORIES = ['Geral', 'Finanças', 'Contabilidade', 'Impostos', 'Lembretes', 'Urgente'];

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

  // Modal Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('Finanças');
  const [formColor, setFormColor] = useState('emerald');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const localKey = useMemo(() => `notes_cache_${currentUserProfile}`, [currentUserProfile]);

  // Load notes from local storage and Supabase tasks table
  useEffect(() => {
    // 1. Load from localStorage
    try {
      const saved = localStorage.getItem(localKey);
      if (saved) {
        setNotes(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Erro ao carregar anotações locais:', e);
    }

    // 2. Extract notes from Supabase tasks table (tasks starting with [ANOTACAO])
    if (tasks && tasks.length > 0) {
      const dbNotes: Note[] = tasks
        .filter((t: any) => t.titulo && t.titulo.startsWith('[ANOTACAO]'))
        .map((t: any) => {
          let title = t.titulo.replace('[ANOTACAO]', '').trim();
          let category = 'Finanças';
          let color = 'emerald';
          let isPinned = false;

          // Check if metadata encoded in JSON inside description
          let content = t.descricao || '';
          try {
            if (content.startsWith('{') && content.endsWith('}')) {
              const parsed = JSON.parse(content);
              if (parsed.content) {
                content = parsed.content;
                category = parsed.category || category;
                color = parsed.color || color;
                isPinned = parsed.isPinned || false;
              }
            }
          } catch (_) {
            // plain text
          }

          return {
            id: t.id,
            supabaseId: t.id,
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

      if (dbNotes.length > 0) {
        setNotes(prev => {
          // Merge local notes and db notes by id
          const map = new Map<string, Note>();
          prev.forEach(n => map.set(n.id, n));
          dbNotes.forEach(n => map.set(n.id, n));
          const merged = Array.from(map.values());
          localStorage.setItem(localKey, JSON.stringify(merged));
          return merged;
        });
      }
    }
  }, [tasks, localKey, currentUserProfile]);

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
    setFormCategory('Finanças');
    setFormColor('emerald');
    setFormIsPinned(false);
    setIsModalOpen(true);
  };

  // Open modal for editing note
  const handleOpenEdit = (note: Note) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormCategory(note.category || 'Finanças');
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
    if (!window.confirm('Tem certeza que deseja excluir esta anotação?')) return;

    if (supabase && supabaseId) {
      try {
        await supabase.from('tasks').delete().eq('id', supabaseId);
        if (fetchCollections) fetchCollections('tasks');
      } catch (err) {
        console.warn('Erro ao excluir no Supabase:', err);
      }
    }

    const updated = notes.filter(n => n.id !== id);
    saveLocalNotes(updated);
    if (viewingNote?.id === id) setViewingNote(null);
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

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg">
                <FileText size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500 block">
                  Bloco de Notas & Controle
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Anotações de {userName}
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Registre observações financeiras, lembretes contábeis, instruções de relatórios e resumos operacionais com sincronização automática.
            </p>
          </div>

          <button
            onClick={handleOpenNew}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-4 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(16,185,129,0.25)] cursor-pointer group"
          >
            <Plus size={18} className="group-hover:scale-110 transition-transform" />
            Nova Anotação
          </button>
        </div>
      </div>

      {/* Controls Bar: Search & Category Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar por título, conteúdo ou tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('Todas')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              selectedCategory === 'Todas'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            Todas ({notes.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = notes.filter(n => n.category === cat).length;
            const isSel = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  isSel
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
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
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center space-y-4">
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
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            <Plus size={16} /> Criar Anotação Agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => {
            const colorCfg = COLOR_MAP[note.color] || COLOR_MAP.emerald;
            return (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl ${colorCfg.bg} ${colorCfg.border} hover:border-slate-600 bg-slate-900/80 backdrop-blur-sm`}
              >
                {/* Card Top Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${colorCfg.badgeBg} ${colorCfg.badgeText} border border-slate-800/50`}>
                      {note.category || 'Geral'}
                    </span>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleTogglePin(note)}
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
                        onClick={() => handleOpenEdit(note)}
                        className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id, note.supabaseId)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Note Title */}
                  <h3 
                    onClick={() => setViewingNote(note)}
                    className="text-base font-black text-white hover:text-emerald-400 transition-colors cursor-pointer line-clamp-1 mb-2 tracking-tight"
                  >
                    {note.title}
                  </h3>

                  {/* Note Content Excerpt */}
                  <p 
                    onClick={() => setViewingNote(note)}
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
                      onClick={() => handleCopyNote(note)}
                      className="p-1 text-slate-500 hover:text-slate-200 transition-colors flex items-center gap-1"
                      title="Copiar texto"
                    >
                      {copiedId === note.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                    <button
                      onClick={() => handleDownloadNote(note)}
                      className="p-1 text-slate-500 hover:text-slate-200 transition-colors"
                      title="Baixar em arquivo .txt"
                    >
                      <Download size={12} />
                    </button>
                    <button
                      onClick={() => setViewingNote(note)}
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all font-medium"
                    >
                      {CATEGORIES.map(cat => (
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
