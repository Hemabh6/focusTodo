import React, { useState } from 'react';
import { Play, Pause, Trash2, ShieldCheck } from 'lucide-react';
import { useDeepWork } from '../hooks/useDeepWork';

const CIRCUMFERENCE = 754; // 2π × r ≈ 2π × 120

const THEME_COLORS = {
  default: { ring: 'text-indigo-600',  btn: 'bg-indigo-600',  label: 'text-indigo-400'  },
  forest:  { ring: 'text-green-600',   btn: 'bg-green-600',   label: 'text-green-400'   },
  ocean:   { ring: 'text-sky-500',     btn: 'bg-sky-500',     label: 'text-sky-400'     },
  sunset:  { ring: 'text-orange-500',  btn: 'bg-orange-500',  label: 'text-orange-400'  },
};

export default function FocusTab({ activeSession, setActiveSession, theme = 'default' }) {
  const [isStrictMode, setIsStrictMode] = useState(false);
  useDeepWork({ isStrictMode, activeSession });

  const tc = THEME_COLORS[theme] ?? THEME_COLORS.default;

  const focusMins = activeSession?.configMinutes || 25;
  const breakMins = activeSession?.breakMinutes ?? 5;

  const totalSecs = Math.max(
    1,
    (activeSession?.isFocus ? focusMins : breakMins) * 60,
  );
  const dashOffset =
    CIRCUMFERENCE - (CIRCUMFERENCE * (activeSession?.timeLeft || 0)) / totalSecs;

  const timeDisplay =
    activeSession?.timeLeft !== undefined
      ? `${Math.floor(activeSession.timeLeft / 60)}:${(activeSession.timeLeft % 60)
          .toString()
          .padStart(2, '0')}`
      : `${focusMins}:00`;

  const handleFocusChange = (e) => {
    const mins = parseInt(e.target.value);
    setActiveSession((prev) => ({
      ...prev,
      configMinutes: mins,
      breakMinutes: prev?.breakMinutes ?? 5,
      timeLeft: mins * 60,
      isRunning: false,
      isFocus: true,
      task: { title: 'Focus Session' },
    }));
  };

  const handleBreakChange = (e) => {
    const bMins = parseInt(e.target.value);
    setActiveSession((prev) => ({
      ...prev,
      breakMinutes: bMins,
      configMinutes: prev?.configMinutes || 25,
      timeLeft: (prev?.configMinutes || 25) * 60,
      isRunning: false,
      isFocus: true,
      task: { title: 'Focus Session' },
    }));
  };

  const handleStart = () =>
    setActiveSession((prev) => ({
      ...prev,
      configMinutes: prev?.configMinutes || 25,
      breakMinutes: prev?.breakMinutes ?? 5,
      timeLeft: (prev?.configMinutes || 25) * 60,
      isRunning: true,
      isFocus: true,
      task: {
        title: 'Focus Session',
        pomodoroConfig: { break: prev?.breakMinutes ?? 5 },
      },
    }));

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Focus Session</h2>
        <p className="text-slate-400 text-sm">Design your flow state</p>
      </div>

      {/* Circle timer */}
      <div className="relative w-64 h-64 mb-8">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="128" cy="128" r="120"
            stroke="currentColor" strokeWidth="8" fill="transparent"
            className="text-slate-100"
          />
          <circle
            cx="128" cy="128" r="120"
            stroke="currentColor" strokeWidth="8" fill="transparent"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className={`${activeSession?.isFocus ? tc.ring : 'text-emerald-500'} transition-all duration-1000 ease-linear`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-mono font-bold text-slate-800">
            {timeDisplay}
          </span>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${
              activeSession?.isFocus ? tc.label : 'text-emerald-500'
            }`}
          >
            {activeSession?.isRunning
              ? activeSession.isFocus
                ? 'Focusing'
                : 'Break Time'
              : 'Ready'}
          </span>
        </div>
      </div>

      {/* Controls when not running */}
      {(!activeSession || !activeSession.isRunning) && (
        <div className="w-full max-w-xs space-y-4">
          <div className="px-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Focus Duration
              </label>
              <span className={`text-xs font-bold ${tc.label}`}>{focusMins} min</span>
            </div>
            <input
              type="range" min="1" max="120" value={focusMins}
              onChange={handleFocusChange}
              className={`w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-${
                theme === 'default' ? 'indigo' : theme === 'forest' ? 'green' : theme === 'ocean' ? 'sky' : 'orange'
              }-600`}
            />
          </div>

          <div className="px-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Break Duration
              </label>
              <span className="text-xs font-bold text-emerald-600">
                {breakMins === 0 ? 'None' : `${breakMins} min`}
              </span>
            </div>
            <input
              type="range" min="0" max="30" value={breakMins}
              onChange={handleBreakChange}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Deep Work toggle */}
          <div
            className={`flex items-center justify-between px-3 py-3 rounded-2xl border transition-colors ${
              isStrictMode ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className={isStrictMode ? 'text-rose-500' : 'text-slate-400'} />
              <div>
                <p className="text-xs font-bold text-slate-700">Deep Work Mode</p>
                <p className="text-[10px] text-slate-400">Alert if you leave the app</p>
              </div>
            </div>
            <button
              onClick={() => setIsStrictMode((p) => !p)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isStrictMode ? 'bg-rose-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  isStrictMode ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <button
            onClick={handleStart}
            className={`w-full ${tc.btn} text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all`}
          >
            <Play size={24} /> Start Flow
          </button>
        </div>
      )}

      {/* Controls while running */}
      {activeSession?.isRunning && (
        <div className="flex gap-4">
          <button
            onClick={() => setActiveSession((p) => ({ ...p, isRunning: !p.isRunning }))}
            className="bg-slate-800 text-white p-5 rounded-2xl shadow-lg"
          >
            {activeSession.isRunning ? <Pause size={28} /> : <Play size={28} />}
          </button>
          <button
            onClick={() => setActiveSession(null)}
            className="bg-rose-100 text-rose-600 p-5 rounded-2xl shadow-lg"
          >
            <Trash2 size={28} />
          </button>
        </div>
      )}
    </div>
  );
}
