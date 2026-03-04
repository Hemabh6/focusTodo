import React, { useState } from 'react';
import { X } from 'lucide-react';
import { dbService } from '../services/db';

const MOODS = [
  { emoji: '😞', label: 'Rough',   value: 1 },
  { emoji: '😐', label: 'Okay',    value: 2 },
  { emoji: '🙂', label: 'Good',    value: 3 },
  { emoji: '🤩', label: 'Amazing', value: 4 },
];

export default function WindDownModal({ user, completedToday, onClose }) {
  const [selected, setSelected] = useState(null);
  const [saved, setSaved]       = useState(false);

  const handleSave = async () => {
    if (!selected) return;
    await dbService.saveMoodLog(user.uid, selected.value, completedToday);
    setSaved(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Evening Review
            </p>
            <h3 className="text-lg font-bold text-slate-800">
              How was your focus today?
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 mt-0.5">
            <X size={20} />
          </button>
        </div>

        {saved ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">✅</p>
            <p className="font-bold text-slate-700">Mood logged — sleep well!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 mb-5">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setSelected(m)}
                  className={`flex flex-col items-center py-3 rounded-2xl border transition-all ${
                    selected?.value === m.value
                      ? 'bg-indigo-50 border-indigo-400 scale-105'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[10px] font-bold text-slate-500 mt-1">{m.label}</span>
                </button>
              ))}
            </div>

            <p className="text-xs text-center text-slate-400 mb-4">
              You completed {completedToday} task{completedToday !== 1 ? 's' : ''} today.
            </p>

            <button
              onClick={handleSave}
              disabled={!selected}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              Save &amp; Sleep Well 🌙
            </button>
          </>
        )}
      </div>
    </div>
  );
}
