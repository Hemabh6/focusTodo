import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import { dbService } from '../services/db';

export function useNotes(user) {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (!user) { setNotes([]); return; }

    const unsub = onSnapshot(
      collection(db, 'artifacts', APP_ID, 'users', user.uid, 'notes'),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Pinned first, then newest-first within each group
        data.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setNotes(data);
      },
    );
    return () => unsub();
  }, [user]);

  const addNote    = (text, color = 'yellow') =>
    dbService.addNote(user.uid, { text, color, pinned: false });

  const deleteNote = (noteId) =>
    dbService.deleteNote(user.uid, noteId);

  return { notes, addNote, deleteNote };
}
