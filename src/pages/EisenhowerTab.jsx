import React, { useState } from 'react';
import { Zap, Plus, Trash2 } from 'lucide-react';
import { QUADRANTS } from '../constants/quadrants';
import DailyBriefing from '../components/DailyBriefing';
import BatchModeModal from '../components/BatchModeModal';

export default function EisenhowerTab({ tasks, addTask, deleteTask, toggleTask, habitLog, habits }) {
  const [addingTo, setAddingTo] = useState(null);
  const [inputVal, setInputVal] = useState('');
  const [showBatch, setShowBatch] = useState(false);

  const commit = (qId) => {
    addTask(qId, 'task', inputVal);
    setInputVal('');
    setAddingTo(null);
  };

  const batchCount = tasks.filter(
    (t) => (t.quadrant === 'q3' || t.quadrant === 'q4') && !t.completed && t.type === 'task',
  ).length;

  return (
    <div>
      <DailyBriefing tasks={tasks} habitLog={habitLog} habits={habits} />

      {batchCount >= 2 && (
        <button
          onClick={() => setShowBatch(true)}
          className="w-full flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 font-bold text-sm py-3 rounded-2xl mb-4 hover:border-amber-300 transition-colors active:scale-95"
        >
          <Zap size={16} /> Batch Mode — clear {batchCount} small tasks
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(QUADRANTS).map((q) => (
          <div key={q.id} className={`${q.color} border rounded-2xl p-4 flex flex-col h-64 shadow-sm`}>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap size={16} className={q.iconColor} /> {q.title}
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2">
              {tasks
                .filter((t) => t.quadrant === q.id && t.type === 'task')
                .map((task) => (
                  <div
                    key={task.id}
                    className="bg-white/80 p-2.5 rounded-lg text-sm shadow-sm flex justify-between"
                  >
                    <span className={task.completed ? 'line-through opacity-50' : ''}>
                      {task.title}
                    </span>
                    <button onClick={() => deleteTask(task)} className="text-rose-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
            </div>

            {addingTo === q.id ? (
              <div className="mt-3 flex gap-2">
                <input
                  autoFocus
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && commit(q.id)}
                  className="flex-1 bg-white px-2 rounded"
                />
                <button onClick={() => commit(q.id)}>
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingTo(q.id)}
                className="mt-3 w-full py-2 bg-white/40 rounded-xl text-xs font-bold"
              >
                <Plus size={14} className="inline" /> Quick Add
              </button>
            )}
          </div>
        ))}
      </div>

      {showBatch && (
        <BatchModeModal
          tasks={tasks}
          toggleTask={toggleTask}
          onClose={() => setShowBatch(false)}
        />
      )}
    </div>
  );
}
