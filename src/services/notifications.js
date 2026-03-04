import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// ─── Permissions ────────────────────────────────────────────────────────────

export async function requestNotificationPermissions() {
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch {
    return false;
  }
}

// ─── Timer alerts (haptic + immediate system notification) ───────────────────

/**
 * @param {'focus_done'|'session_done'|'deep_work_violated'} type
 */
export async function triggerTimerAlert(type) {
  const CONFIGS = {
    focus_done: {
      haptic: NotificationType.Warning,
      vibrate: [400, 150, 400],
      id: 88881,
      title: '🎉 Focus Complete!',
      body: 'Great work — time for a break.',
      color: '#6366f1',
    },
    session_done: {
      haptic: NotificationType.Success,
      vibrate: [200, 100, 200, 100, 500],
      id: 88882,
      title: '✅ Session Complete!',
      body: 'Amazing session! Take a well-deserved rest.',
      color: '#6366f1',
    },
    deep_work_violated: {
      haptic: NotificationType.Warning,
      vibrate: [300, 100, 300],
      id: 88883,
      title: '🔒 Deep Work Interrupted',
      body: 'You left the app during a focus session. Stay focused!',
      color: '#ef4444',
    },
  };
  const cfg = CONFIGS[type] ?? CONFIGS.session_done;

  try {
    await Haptics.notification({ type: cfg.haptic });
  } catch {
    if (navigator.vibrate) navigator.vibrate(cfg.vibrate);
  }

  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: cfg.id,
        title: cfg.title,
        body: cfg.body,
        schedule: { at: new Date(Date.now() + 300) },
        iconColor: cfg.color,
      }],
    });
  } catch {
    // Not on Android — silently ignore
  }
}

// ─── Wind-down evening notification ─────────────────────────────────────────

/**
 * Schedules (or re-schedules) the nightly 9 PM Wind Down check-in notification.
 * Safe to call every login — always targets the next upcoming 9 PM.
 */
export async function scheduleWindDownNotification() {
  const now = new Date();
  const at  = new Date(now);
  at.setHours(21, 0, 0, 0);
  if (at <= now) at.setDate(at.getDate() + 1); // already past 9 PM → schedule tomorrow

  try {
    await LocalNotifications.cancel({ notifications: [{ id: 77777 }] });
    await LocalNotifications.schedule({
      notifications: [{
        id:    77777,
        title: '🌙 Wind Down Check-in',
        body:  'How was your focus today? Take a moment to reflect.',
        schedule: { at },
        iconColor: '#8b5cf6',
      }],
    });
  } catch {
    // Not on Android — silently ignore
  }
}

// ─── Schedule-based task notifications ──────────────────────────────────────

/**
 * Schedules native notifications for a task's configured schedule.
 * Cancels any previous notifications for the same task first.
 */
export async function scheduleTaskNotification(task) {
  if (!task?.schedule?.time) return;
  await cancelTaskNotification(task.id);

  const notifications = buildNotifications(task);
  if (notifications.length === 0) return;

  try {
    await LocalNotifications.schedule({ notifications });
  } catch (e) {
    console.warn('[Notifications] Failed to schedule:', e);
  }
}

/**
 * Cancels all scheduled notifications for a task id.
 */
export async function cancelTaskNotification(taskId) {
  const base = taskIdToInt(taskId);
  // Reserve 70 slots per task (7 daily + 40 weekly/custom)
  const ids = Array.from({ length: 70 }, (_, i) => ({ id: base + i }));
  try {
    await LocalNotifications.cancel({ notifications: ids });
  } catch {
    // Ignore on web
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Stable, deterministic int from a Firestore-like string id. */
function taskIdToInt(id) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h) ^ id.charCodeAt(i);
  // Keep positive, multiply by 100 to give 100 slots per task
  return (Math.abs(h) % 2_000_000) * 100;
}

function buildNotifications(task) {
  const { schedule, title, id } = task;
  const { time, type, days, date } = schedule;
  const [hour, minute] = time.split(':').map(Number);
  const base = taskIdToInt(id);
  const now = new Date();
  const notifs = [];

  const makeAt = (d) => {
    const at = new Date(d);
    at.setHours(hour, minute, 0, 0);
    return at;
  };

  const push = (slot, at, notifTitle) => {
    if (at <= now) return;
    notifs.push({
      id: base + slot,
      title: notifTitle,
      body: title,
      schedule: { at },
      iconColor: '#6366f1',
    });
  };

  if (type === 'once' && date) {
    push(0, makeAt(new Date(date + 'T00:00:00')), '📌 Task Reminder');

  } else if (type === 'daily') {
    // Schedule the next 7 daily occurrences
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      push(i, makeAt(d), '🔁 Daily Reminder');
    }

  } else if (type === 'weekly') {
    // Schedule next 4 Mondays
    for (let w = 0; w < 4; w++) {
      push(w * 10, makeAt(nextWeekday(now, 1, w)), '📅 Weekly Reminder');
    }

  } else if (type === 'custom' && days?.length > 0) {
    // Schedule next 2 occurrences of each selected day
    days.forEach((dayIdx, di) => {
      for (let occ = 0; occ < 2; occ++) {
        push(di * 10 + occ, makeAt(nextWeekday(now, dayIdx, occ)), '🔔 Reminder');
      }
    });
  }

  return notifs;
}

/**
 * Returns the Date of the `skip`-th future occurrence of `targetDay` (0=Sun…6=Sat).
 * skip=0 → next occurrence, skip=1 → week after, etc.
 */
function nextWeekday(fromDate, targetDay, skip = 0) {
  const d = new Date(fromDate);
  const diff = (targetDay - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff + skip * 7);
  return d;
}
