import React, { useState, useRef } from 'react';
import { Clock, CalendarDays, Trash2, Play, CheckCircle2, Circle, Check, Camera } from 'lucide-react';
import AlarmPlugin from '../services/alarmPlugin';
import { scheduleTaskNotification } from '../services/notifications';

const QUADRANT_BORDER = {
  q1: 'border-l-rose-400',
  q2: 'border-l-sky-400',
  q3: 'border-l-amber-400',
  q4: 'border-l-slate-300',
};

export default function TaskCard({ task, onToggle, onDelete, onUpdateFields, activeSession, setActiveSession, showPhoto = false }) {
  const [showConfig, setShowConfig] = useState(false);
  // Store as strings so full deletion gives '' not 0, preventing leading-zero issues
  const [focusInput, setFocusInput] = useState(String(task.pomodoroConfig?.focus || 25));
  const [breakInput, setBreakInput] = useState(String(task.pomodoroConfig?.break || 5));
  const [savedConfig, setSavedConfig] = useState(false);

  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleType, setScheduleType] = useState(task.schedule?.type || 'daily');
  const [customDays, setCustomDays] = useState(task.schedule?.days || []);
  const [scheduleTime, setScheduleTime] = useState(task.schedule?.time || '09:00');

  const getLocalYYYYMMDD = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [scheduleDate, setScheduleDate] = useState(task.schedule?.date || getLocalYYYYMMDD());

  // Allow free typing (including empty). Strip non-digits and leading zeros via parseInt.
  const handleMinuteInput = (raw, setter) => {
    const digits = raw.replace(/\D/g, '');
    if (digits === '' || digits === '0') { setter(''); return; }
    setter(String(parseInt(digits, 10)));
  };

  // Safe integers used at save/start time — never below 1 or above 60
  const parsedFocus = Math.min(60, Math.max(1, parseInt(focusInput, 10) || 25));
  const parsedBreak = Math.min(60, Math.max(1, parseInt(breakInput, 10) || 5));

  const handleStartSession = () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission();
    setActiveSession({
      task: task,
      isFocus: true,
      timeLeft: parsedFocus * 60,
      isRunning: true,
    });
    setShowConfig(false);
  };

  // Photo capture
  const photoInputRef = useRef(null);
  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const maxSize = 300;
      let w = img.width, h = img.height;
      if (w > h) { if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; } }
      else { if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; } }
      canvas.width = w; canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      onUpdateFields(task.id, { habitPhoto: canvas.toDataURL('image/jpeg', 0.7) });
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  };

  // Calendar sync
  const handleAddToCalendar = () => {
    const dateStr = scheduleDate || new Date().toISOString().split('T')[0];
    const startDate = new Date(`${dateStr}T${scheduleTime}:00`);
    const endDate = new Date(startDate.getTime() + 3600000);
    AlarmPlugin.addCalendarEvent({
      title: task.title,
      beginTime: startDate.getTime(),
      endTime: endDate.getTime(),
      description: `Scheduled: ${task.title}`,
    }).catch(() => {});
  };

  const handleSaveConfig = () => {
    onUpdateFields(task.id, { pomodoroConfig: { focus: parsedFocus, break: parsedBreak } });
    setSavedConfig(true);
    // Show confirmation for 1.5 s then close the panel
    setTimeout(() => { setSavedConfig(false); setShowConfig(false); }, 1500);
  };

  const handleSaveSchedule = () => {
    const updatedSchedule = { type: scheduleType, days: customDays, time: scheduleTime, date: scheduleDate };
    onUpdateFields(task.id, { schedule: updatedSchedule });

    // Schedule a native local notification for this task
    scheduleTaskNotification({ ...task, schedule: updatedSchedule });

    // Close the panel immediately — before the async alarm call
    setShowSchedule(false);

    // Fire Android system alarm (opens Clock app). Wrapped in try/catch so any
    // synchronous throw from the Capacitor stub on web doesn't break the save.
    try {
      const [hour, min] = scheduleTime.split(':').map(Number);
      // Map app day indices (0=Sun..6=Sat) → Android Calendar constants (1=Sun..7=Sat)
      const androidDays = customDays.map(d => d + 1);
      const alarmArgs = { hour, minutes: min, message: task.title };
      if (scheduleType === 'weekly') alarmArgs.days = [2]; // Calendar.MONDAY
      if (scheduleType === 'custom' && androidDays.length > 0) alarmArgs.days = androidDays;
      AlarmPlugin.scheduleAlarm(alarmArgs).catch(() => {/* not on Android — silently ignore */});
    } catch (_) { /* stub throws on web — ignore */ }
  };

  return (
    <div className={`bg-white rounded-2xl border border-l-4 ${QUADRANT_BORDER[task.quadrant] || 'border-l-slate-200'} p-4 shadow-sm transition-all hover:shadow-md ${task.completed ? 'opacity-60 grayscale' : ''}`}>
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

            <div className="flex gap-2">
              <button
                onClick={handleSaveSchedule}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Save &amp; Set Alarm
              </button>
              <button
                onClick={handleAddToCalendar}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Add to Calendar
              </button>
            </div>
          </div>
        </div>
      )}

      {showPhoto && (
        <div className="mt-3 pt-3 border-t border-dashed">
          <input type="file" accept="image/*" capture="environment" ref={photoInputRef} style={{ display: 'none' }} onChange={handlePhotoCapture} />
          {task.habitPhoto ? (
            <div className="space-y-2">
              <img src={task.habitPhoto} alt="Completion photo" className="w-full h-36 object-cover rounded-xl" />
              <button onClick={() => photoInputRef.current?.click()} className="w-full text-[10px] font-bold text-slate-400 hover:text-emerald-600">
                <Camera size={12} className="inline mr-1" />Retake Photo
              </button>
            </div>
          ) : (
            <button onClick={() => photoInputRef.current?.click()} className="w-full py-2.5 border-2 border-dashed border-emerald-200 rounded-xl text-xs font-bold text-emerald-500 hover:border-emerald-400 flex items-center justify-center gap-2">
              <Camera size={14} /> Add Completion Photo
            </button>
          )}
        </div>
      )}

      {showConfig && !task.completed && (
        <div className="mt-4 pt-4 border-t border-dashed animate-in zoom-in-95 duration-200">
          <div className="bg-indigo-50/50 rounded-xl p-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-indigo-700">Pomodoro Settings</span>
              {savedConfig && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <Check size={12} /> Saved!
                </span>
              )}
            </div>
            <div className="flex gap-4 items-end mb-4">
              <div className="flex flex-col flex-1">
                <span className="text-[10px] uppercase text-indigo-400 font-bold mb-1">Work (min, max 60)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={focusInput}
                  onChange={(e) => handleMinuteInput(e.target.value, setFocusInput)}
                  className="w-full text-sm font-bold bg-white border border-indigo-100 rounded-lg p-1.5"
                />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-[10px] uppercase text-indigo-400 font-bold mb-1">Break (min, max 60)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={breakInput}
                  onChange={(e) => handleMinuteInput(e.target.value, setBreakInput)}
                  className="w-full text-sm font-bold bg-white border border-indigo-100 rounded-lg p-1.5"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveConfig}
                disabled={savedConfig}
                className="flex-1 bg-white border border-indigo-200 text-indigo-600 py-2 rounded-lg text-xs font-bold hover:bg-indigo-50 disabled:opacity-60"
              >
                {savedConfig ? '✓ Saved!' : 'Save Config'}
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
