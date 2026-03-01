import React from 'react';
import { useTasks } from '../../hooks/useTasks';
import { TaskCard } from '../../components/features/TaskCard';

export function Dashboard({ user, appId }) {
  const { tasks, loading, removeTask } = useTasks(appId, user.uid);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {tasks.map(task => (
        <TaskCard 
          key={task.id} 
          task={task} 
          onDelete={removeTask} 
        />
      ))}
    </div>
  );
}