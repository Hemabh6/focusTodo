import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import { QUADRANTS } from '../constants/quadrants';

export default function ListTab({
  tasks,
  addTask,
  deleteTask,
  toggleTask,
  updateTaskFields,
  activeSession,
  setActiveSession,
}) {
  const [newTask, setNewTask] = useState('');

  const handleAdd = () => {
    addTask('q1', 'task', newTask, 'list');
    setNewTask('');
  };

  const listSourceTasks = tasks.filter((t) => t.type === 'task' && t.source === 'list');

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border flex gap-2">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="What's on your mind?..."
          className="flex-1 bg-transparent px-4 focus:outline-none"
        />
        <button onClick={handleAdd} className="bg-indigo-600 text-white p-2.5 rounded-xl">
          <Plus size={20} />
        </button>
      </div>

      {/* Tasks added directly from this tab */}
      {listSourceTasks.length > 0 && (
        <section>
          <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider px-1">
            Tasks
          </h3>
          <div className="space-y-3">
            {listSourceTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => toggleTask(task)}
                onDelete={() => deleteTask(task)}
                onUpdateFields={updateTaskFields}
                activeSession={activeSession}
                setActiveSession={setActiveSession}
              />
            ))}
          </div>
        </section>
      )}

      {/* Tasks grouped by Eisenhower quadrant */}
      {Object.values(QUADRANTS).map((q) => {
        const qTasks = tasks.filter(
          (t) => t.type === 'task' && t.quadrant === q.id && !t.source,
        );
        if (!qTasks.length) return null;
        return (
          <section key={q.id}>
            <h3 className={`text-xs font-bold mb-2 uppercase tracking-wider px-1 ${q.iconColor}`}>
              {q.title}
            </h3>
            <div className="space-y-3">
              {qTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task)}
                  onDelete={() => deleteTask(task)}
                  onUpdateFields={updateTaskFields}
                  activeSession={activeSession}
                  setActiveSession={setActiveSession}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
