import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, Circle, Zap } from 'lucide-react';

const TOTAL_SECS = 10 * 60;

export default function BatchModeModal({ tasks, toggleTask, onClose }) {
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECS);
  const [isRunning, setIsRunning] = useState(false);
  const [done, setDone]           = useState([]); // ids ticked this session
  const timerRef                  = useRef(null);

  const batchTasks = tasks.filter(
    (t) => (t.quadrant === 'q3' || t.quadrant === 'q4') && !t.completed && t.type === 'task',
  );

  useEffect(() => {
    if (!isRunning) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const handleTick = (task) => {
    if (done.includes(task.id)) return;
    toggleTask(task);
    setDone((prev) => [...prev, task.id]);
  };

  const mins     = Math.floor(timeLeft / 60);
  const secs     = (timeLeft % 60).toString().padStart(2, '0');
  const progress = ((TOTAL_SECS - timeLeft) / TOTAL_SECS) * 100;
  const finished = timeLeft === 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-amber-500" />
            <h3 className="font-bold text-slate-800">Batch Mode</h3>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase">
              Delegate &amp; Eliminate
            </span>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Timer */}
        <div className="text-center mb-4">
          <div
            className={`text-4xl font-mono font-black ${
              finished ? 'text-emerald-600' : 'text-slate-800'
            }`}
          >
            {finished ? '🎉 Done!' : `${mins}:${secs}`}
          </div>
          {!finished && (
            <>
              <p className="text-[10px] text-slate-400 uppercase mt-1">10-minute speed run</p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div
                  className="bg-amber-500 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Start button */}
        {!isRunning && !finished && (
          <button
            onClick={() => setIsRunning(true)}
            className="bg-amber-500 text-white py-3 rounded-2xl font-bold mb-4 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Zap size={18} /> Start Speed Run
          </button>
        )}

        {/* Task list */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {batchTasks.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-6">
              No delegate/eliminate tasks — you're already lean! ✨
            </p>
          ) : (
            batchTasks.map((task) => {
              const isDone = done.includes(task.id);
              return (
                <button
                  key={task.id}
                  onClick={() => handleTick(task)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    isDone
                      ? 'bg-emerald-50 border-emerald-200 cursor-default'
                      : 'bg-white border-slate-200 hover:border-amber-300'
                  }`}
                >
                  {isDone
                    ? <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
                    : <Circle      size={20} className="text-slate-300 flex-shrink-0" />
                  }
                  <span className={`text-sm flex-1 ${isDone ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {task.title}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex-shrink-0">
                    {task.quadrant === 'q3' ? 'Delegate' : 'Eliminate'}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {done.length > 0 && (
          <p className="text-center text-xs font-bold text-emerald-600 mt-3 pt-3 border-t">
            ✅ {done.length} task{done.length !== 1 ? 's' : ''} cleared this session!
          </p>
        )}
      </div>
    </div>
  );
}
