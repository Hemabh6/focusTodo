import React, { useState } from 'react';
import { Clock, CalendarDays, Trash2, Zap, Sparkles, Play, Pause, RotateCcw, CheckCircle2, Circle } from 'lucide-react';

export default function TaskCard({ task, onToggle, onDelete, onUpdateFields, activeSession, setActiveSession }) {
  const [showConfig, setShowConfig] = useState(false);
  const [focusInput, setFocusInput] = useState(task.pomodoroConfig?.focus || 25);
  const [breakInput, setBreakInput] = useState(task.pomodoroConfig?.break || 5);

  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleType, setScheduleType] = useState(task.schedule?.type || 'daily');
  const [customDays, setCustomDays] = useState(task.schedule?.days || []);
  const [scheduleTime, setScheduleTime] = useState(task.schedule?.time || '09:00');

  const getLocalYYYYMMDD = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [scheduleDate, setScheduleDate] = useState(task.schedule?.date || getLocalYYYYMMDD());

  const handleStartSession = () => {
    if (Notification.permission === 'default') Notification.requestPermission();
    setActiveSession({
      task: task,
      isFocus: true,
      timeLeft: focusInput * 60,
      isRunning: true
    });
    setShowConfig(false);
  };

  return (
    <div className={`bg-white rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${task.completed ? 'opacity-60 grayscale' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <button onClick={onToggle} className="mt-1 transition-transform active:scale-90">
            {task.completed ? <CheckCircle2 className="text-emerald-500" /> : <Circle className="text-slate-300" />}
          </button>
          <div className="flex-1">
            <h4 className={`font-semibold leading-tight ${task.completed ? 'line-through' : ''}`}>
              {task.title}
            </h4>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-500 uppercase">
                {task.type}
              </span>
              <button 
                onClick={() => { setShowConfig(!showConfig); setShowSchedule(false); }}
                className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-600"
              >
                <Clock size={12} /> {showConfig ? 'Close Pomodoro' : 'Pomodoro'}
              </button>
              <button 
                onClick={() => { setShowSchedule(!showSchedule); setShowConfig(false); }}
                className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-600"
              >
                <CalendarDays size={12} /> {showSchedule ? 'Close Schedule' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
        <button onClick={onDelete} className="text-slate-300 hover:text-rose-500 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>

      {showSchedule && !task.completed && (
        <div className="mt-4 pt-4 border-t border-dashed animate-in zoom-in-95 duration-200">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <div className="mb-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Frequency</span>
              <div className="flex gap-1 bg-slate-200/50 p-1 rounded-lg">
                {['daily', 'weekly', 'custom', 'once'].map(type => (
                  <button
                    key={type}
                    onClick={() => setScheduleType(type)}
                    className={`flex-1 px-2 py-1.5 rounded text-[10px] font-bold capitalize transition-all ${scheduleType === type ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {type === 'once' ? 'Specific Date' : type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              {scheduleType === 'once' && (
                <div className="flex-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Date</span>
                  <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 bg-white" />
                </div>
              )}
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Time</span>
                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 bg-white" />
              </div>
            </div>

            {scheduleType === 'custom' && (
              <div className="mb-4">
                <span className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Select Days</span>
                <div className="flex gap-1 flex-wrap">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                    <button
                      key={day}
                      onClick={() => setCustomDays(customDays.includes(idx) ? customDays.filter(d => d !== idx) : [...customDays, idx])}
                      className={`w-8 h-8 rounded-full text-[10px] font-bold transition-all ${customDays.includes(idx) ? 'bg-blue-500 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={() => {
                if (Notification.permission === 'default') Notification.requestPermission();
                onUpdateFields(task.id, { schedule: { type: scheduleType, days: customDays, time: scheduleTime, date: scheduleDate } });
                setShowSchedule(false);
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Save Schedule
            </button>
          </div>
        </div>
      )}

      {showConfig && !task.completed && (
        <div className="mt-4 pt-4 border-t border-dashed animate-in zoom-in-95 duration-200">
          <div className="bg-indigo-50/50 rounded-xl p-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-indigo-700">Pomodoro Settings</span>
            </div>
            <div className="flex gap-4 items-end mb-4">
               <div className="flex flex-col flex-1">
                  <span className="text-[10px] uppercase text-indigo-400 font-bold mb-1">Work (min)</span>
                  <input type="number" value={focusInput} onChange={(e) => setFocusInput(Number(e.target.value))} className="w-full text-sm font-bold bg-white border border-indigo-100 rounded-lg p-1.5" />
               </div>
               <div className="flex flex-col flex-1">
                  <span className="text-[10px] uppercase text-indigo-400 font-bold mb-1">Break (min)</span>
                  <input type="number" value={breakInput} onChange={(e) => setBreakInput(Number(e.target.value))} className="w-full text-sm font-bold bg-white border border-indigo-100 rounded-lg p-1.5" />
               </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  onUpdateFields(task.id, { pomodoroConfig: { focus: focusInput, break: breakInput } });
                  setShowConfig(false);
                }}
                className="flex-1 bg-white border border-indigo-200 text-indigo-600 py-2 rounded-lg text-xs font-bold hover:bg-indigo-50"
              >
                Save Config
              </button>
              <button onClick={handleStartSession} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-md flex justify-center items-center gap-1">
                <Play size={14} /> Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}