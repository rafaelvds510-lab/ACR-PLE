'use client';

import { useState, useEffect } from 'react';

export interface StickyNote {
  id: string;
  page: number;
  x: number;
  y: number;
  text: string;
}

export interface Highlight {
  id: string;
  page: number;
  rects: DOMRect[];
  text: string;
  type: 'definition' | 'example' | 'doubt';
}

export interface Drawing {
  id: string;
  page: number;
  pathData: string;
  color?: string;
  width?: number;
  type?: 'draw' | 'highlight' | 'write';
}

export interface Bookmark {
  id: string;
  page: number;
  title: string;
}

export function useAnnotations(documentId: string) {
  const storageKey = `acropole_annotations_${documentId}`;

  // Initialize state from localStorage directly
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved).stickyNotes || [];
      } catch { return []; }
    }
    return [];
  });

  const [highlights, setHighlights] = useState<Highlight[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved).highlights || [];
      } catch { return []; }
    }
    return [];
  });

  const [drawings, setDrawings] = useState<Drawing[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved).drawings || [];
      } catch { return []; }
    }
    return [];
  });

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved).bookmarks || [];
      } catch { return []; }
    }
    return [];
  });

  // Save data to localStorage when state changes
  useEffect(() => {
    const data = { stickyNotes, highlights, drawings, bookmarks };
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [storageKey, stickyNotes, highlights, drawings, bookmarks]);

  const addStickyNote = (note: Omit<StickyNote, 'id'>) => {
    const newNote = { ...note, id: crypto.randomUUID() };
    setStickyNotes([...stickyNotes, newNote]);
  };

  const removeStickyNote = (id: string) => {
    setStickyNotes(stickyNotes.filter(n => n.id !== id));
  };

  const addHighlight = (highlight: Omit<Highlight, 'id'>) => {
    const newHighlight = { ...highlight, id: crypto.randomUUID() };
    setHighlights([...highlights, newHighlight]);
  };

  const addBookmark = (bookmark: Omit<Bookmark, 'id'>) => {
    const newBookmark = { ...bookmark, id: crypto.randomUUID() };
    setBookmarks([...bookmarks, newBookmark]);
  };

  return {
    stickyNotes,
    setStickyNotes,
    addStickyNote,
    removeStickyNote,
    highlights,
    addHighlight,
    drawings,
    setDrawings,
    bookmarks,
    addBookmark,
  };
}
