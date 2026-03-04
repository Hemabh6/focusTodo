import React from 'react';
import { LayoutGrid, ListChecks, Target, User, Zap, StickyNote } from 'lucide-react';

const TABS = [
  { id: 'eisenhower', icon: <LayoutGrid size={20} /> },
  { id: 'list',       icon: <ListChecks size={20} /> },
  { id: 'focus',      icon: <Zap size={20} />        },
  { id: 'habits',     icon: <Target size={20} />     },
  { id: 'notes',      icon: <StickyNote size={20} /> },
  { id: 'profile',    icon: <User size={20} />       },
];

export default function NavBar({ activeTab, setActiveTab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 border-t flex justify-around py-3 z-50">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center ${
            activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          {tab.icon}
          <span className="text-[10px] uppercase font-bold mt-1">
            {tab.id === 'eisenhower' ? 'Matrix' : tab.id === 'notes' ? 'Brain' : tab.id}
          </span>
        </button>
      ))}
    </nav>
  );
}
