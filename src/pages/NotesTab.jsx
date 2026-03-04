import React, { useState } from 'react';
import { X, ArrowRight, Plus } from 'lucide-react';

const NOTE_COLORS = {
  yellow: { bg: 'bg-amber-100',   border: 'border-amber-300',   text: 'text-amber-900'  },
  pink:   { bg: 'bg-pink-100',    border: 'border-pink-300',    text: 'text-pink-900'   },
  blue:   { bg: 'bg-sky-100',     border: 'border-sky-300',     text: 'text-sky-900'    },
  green:  { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-900'},
  purple: { bg: 'bg-violet-100',  border: 'border-violet-300',  text: 'text-violet-900' },
};

export default function NotesTab({ notes, addNote, deleteNote, addTask }) {
  const [draft, setDraft]               = useState('');
  const [selectedColor, setSelectedColor] = useState('yellow');
  const [search, setSearch]             = useState('');

  const handleCapture = () => {
    if (!draft.trim()) return;
    addNote(draft.trim(), selectedColor);
    setDraft('');
  };

  const handleConvertToTask = (note) => {
    addTask('q1', 'task', note.text);
    deleteNote(note.id);
  };

  const filtered = notes.filter((n) =>
    n.text.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      {/* ── Quick capture ─────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm mb-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
          Quick Capture
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Dump your thoughts here…"
          rows={3}
          className="w-full resize-none focus:outline-none text-sm text-slate-700 placeholder:text-slate-300"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCapture();
          }}
        />
        <div className="flex items-center justify-between mt-3">
          {/* Color picker */}
          <div className="flex gap-2">
            {Object.keys(NOTE_COLORS).map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={`w-5 h-5 rounded-full border-2 ${NOTE_COLORS[c].bg} transition-all ${
                  selectedColor === c ? 'border-slate-600 scale-125' : 'border-transparent'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleCapture}
            className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1 active:scale-95 transition-all"
          >
            <Plus size={14} /> Save
          </button>
        </div>
      </div>

      {/* ── Search ───────────────────────────────────────────────── */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search notes…"
        className="w-full bg-white border rounded-2xl px-4 py-2.5 text-sm mb-4 focus:outline-none shadow-sm placeholder:text-slate-300"
      />

      {/* ── Notes grid ───────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <p className="text-center text-slate-400 text-sm mt-10">
          {search ? 'No notes match your search.' : 'No notes yet — capture a thought!'}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((note) => {
          const colors = NOTE_COLORS[note.color] ?? NOTE_COLORS.yellow;
          return (
            <div
              key={note.id}
              className={`${colors.bg} ${colors.border} border p-3 rounded-2xl relative min-h-[100px] flex flex-col`}
            >
              {/* Delete */}
              <button
                onClick={() => deleteNote(note.id)}
                className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={14} />
              </button>

              {/* Content */}
              <p className={`text-sm flex-1 pr-5 leading-relaxed whitespace-pre-wrap ${colors.text}`}>
                {note.text}
              </p>

              {/* Convert to task */}
              <button
                onClick={() => handleConvertToTask(note)}
                className="mt-2 self-start flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <ArrowRight size={10} /> To Task
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
