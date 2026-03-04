import React, { useState } from 'react';
import { User, LogOut, Award, BarChart2, Edit2, Star } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { dbService } from '../services/db';
import { getLevelInfo, THEMES } from '../hooks/useXP';

export default function ProfileTab({
  user, tasks, friends, friendStats, weeklyGoal, setWeeklyGoal,
  xp, unlockedThemes, activeTheme, unlockTheme, activateTheme,
}) {
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks     = tasks.length;
  const [newFriendId, setNewFriendId]   = useState('');
  const [friendError, setFriendError]   = useState('');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal]         = useState(weeklyGoal);

  const addFriend = () => {
    const trimmed = newFriendId.trim();
    if (!trimmed) return;
    if (trimmed === user.uid) { setFriendError("You can't add yourself."); return; }
    setFriendError('');
    dbService.addFriend(user.uid, trimmed).then(() => setNewFriendId(''));
  };

  const handleUpdateGoal = () => {
    setWeeklyGoal(tempGoal);
    setIsEditingGoal(false);
    dbService.updateProfileGoal(user.uid, tempGoal);
  };

  const displayName = user?.displayName || user?.phoneNumber || user?.email || 'Guest User';
  const initial     = displayName !== 'Guest User'
    ? (displayName.startsWith('+') ? displayName.charAt(1) : displayName.charAt(0).toUpperCase())
    : <User size={32} />;

  const dProg = Math.min((completedTasks / Math.max(weeklyGoal / 7, 1)) * 100, 100);
  const wProg = Math.min((completedTasks / weeklyGoal) * 100, 100);

  const { level, name, progress, xpToNext, isMax } = getLevelInfo(xp ?? 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Avatar card ─────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl font-bold">
          {initial}
        </div>
        <h2 className="text-xl font-bold text-slate-800">{displayName}</h2>
        <p className="text-xs text-slate-500 font-mono mt-3 bg-slate-100 inline-block px-2 py-1 rounded">
          UID: {user?.uid}
        </p>
        <button
          onClick={() => signOut(auth)}
          className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 mx-auto"
        >
          <LogOut size={12} /> Log Out
        </button>
      </div>

      {/* ── Stats grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex flex-col items-center text-center">
          <Award className="text-indigo-500 mb-2" size={24} />
          <div className="text-3xl font-black text-indigo-900">{completedTasks}</div>
          <div className="text-[10px] font-bold text-indigo-600 uppercase mt-1">Tasks Done</div>
        </div>
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex flex-col items-center text-center">
          <BarChart2 className="text-rose-500 mb-2" size={24} />
          <div className="text-3xl font-black text-rose-900">
            {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
          </div>
          <div className="text-[10px] font-bold text-rose-600 uppercase mt-1">Completion Rate</div>
        </div>
      </div>

      {/* ── Focus Level + Shop ──────────────────────────────────────── */}
      <section className="bg-white p-5 rounded-2xl shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Star size={16} className="text-amber-400" /> Focus Level
          </h3>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            {xp ?? 0} XP
          </span>
        </div>

        {/* Level row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
            {level <= 2 ? '🌱' : level <= 4 ? '🎯' : level <= 5 ? '🔥' : '⚡'}
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-800">Level {level} — {name}</p>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-1.5">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {isMax ? 'Maximum level reached! ⚡' : `${xpToNext} XP to Level ${level + 1}`}
            </p>
          </div>
        </div>

        {/* XP guide */}
        <div className="flex gap-3 text-[10px] text-slate-500 bg-slate-50 rounded-xl p-3 mb-4">
          <span className="font-bold text-slate-600">Earn XP:</span>
          <span>✅ Habit = 20 XP</span>
          <span>⏱ Focus session = 2 XP/min</span>
        </div>

        {/* Focus Shop */}
        <div className="border-t pt-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
            Focus Shop
          </p>
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map((t) => {
              const isUnlocked = unlockedThemes?.includes(t.id);
              const isActive   = activeTheme === t.id;
              const canAfford  = (xp ?? 0) >= t.cost;
              return (
                <button
                  key={t.id}
                  onClick={() => isUnlocked ? activateTheme(t.id) : canAfford && unlockTheme(t.id)}
                  disabled={!isUnlocked && !canAfford}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                    isActive
                      ? 'border-indigo-400 bg-indigo-50'
                      : isUnlocked
                        ? 'border-slate-200 bg-white hover:border-slate-300'
                        : canAfford
                          ? 'border-amber-300 bg-amber-50 hover:border-amber-400'
                          : 'border-slate-100 bg-slate-50 opacity-50'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl ${t.preview} flex-shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{t.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {isActive
                        ? '✓ Active'
                        : isUnlocked
                          ? 'Tap to use'
                          : `${t.cost} XP`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Development Stats ───────────────────────────────────────── */}
      <section className="bg-white p-5 rounded-2xl shadow-sm border">
        <div className="flex justify-between items-center border-b pb-3 mb-5">
          <h3 className="font-bold text-slate-800">Development Stats</h3>
          {isEditingGoal ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={tempGoal}
                onChange={(e) => setTempGoal(Number(e.target.value))}
                className="w-16 border rounded px-2 py-1 text-xs"
              />
              <button
                onClick={handleUpdateGoal}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingGoal(true)}
              className="text-xs text-slate-500 flex items-center gap-1"
            >
              <Edit2 size={12} /> Goal: {weeklyGoal}
            </button>
          )}
        </div>
        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
              <span>Daily Progress</span><span>{Math.round(dProg)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${dProg}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
              <span>Weekly Goal</span><span>{completedTasks} / {weeklyGoal}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${wProg}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Friends ─────────────────────────────────────────────────── */}
      <section className="bg-white p-5 rounded-2xl shadow-sm border mb-8">
        <h3 className="font-bold mb-4 text-slate-800">Friends</h3>
        <div className="flex gap-2 mb-1">
          <input
            value={newFriendId}
            onChange={(e) => { setNewFriendId(e.target.value); setFriendError(''); }}
            placeholder="Friend's UID"
            className="flex-1 bg-slate-50 border rounded-xl px-3 py-2 text-sm"
          />
          <button onClick={addFriend} className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold">
            Add
          </button>
        </div>
        {friendError && <p className="text-xs text-rose-500 font-semibold mb-3">{friendError}</p>}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {friends.map((f) => {
            const stats = friendStats[f.friendId];
            return (
              <div key={f.id} className="p-3 bg-white border rounded-xl">
                <span className="text-sm font-bold">User: {f.friendId.substring(0, 6)}…</span>
                <span className="text-[10px] text-slate-400 block mb-1">
                  {stats ? `${stats.completedTasks} Tasks Done` : 'Pending…'}
                </span>
                {stats && (
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min((stats.completedTasks / (stats.weeklyGoal || 20)) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
