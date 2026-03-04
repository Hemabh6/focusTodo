import React from 'react';
import { Play, Pause, Trash2 } from 'lucide-react';

export default function PomodoroBar({ activeSession, setActiveSession, phaseAlert, stopSession }) {
  if (!activeSession) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-indigo-900 text-white p-4 rounded-2xl shadow-2xl z-50">
      {phaseAlert && (
        <div className="text-center text-xs font-bold text-emerald-300 mb-2">
          {phaseAlert}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold text-indigo-300 uppercase">
            {activeSession.isFocus ? 'Focus' : 'Break'}
          </span>
          <p className="font-bold">{activeSession.task?.title}</p>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-2xl font-mono">
            {Math.floor(activeSession.timeLeft / 60)}:
            {(activeSession.timeLeft % 60).toString().padStart(2, '0')}
          </span>
          <button
            onClick={() => setActiveSession((p) => ({ ...p, isRunning: !p.isRunning }))}
            className="p-2 bg-indigo-500 rounded-full"
          >
            {activeSession.isRunning ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={stopSession}
            className="p-2 bg-rose-500/20 text-rose-300 rounded-full"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
