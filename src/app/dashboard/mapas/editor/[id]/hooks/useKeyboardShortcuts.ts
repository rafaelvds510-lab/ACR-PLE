'use client';

import { useEffect } from 'react';

interface ShortcutHandlers {
  onTab: () => void;
  onEnter: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCenter: () => void;
  onZenToggle: () => void;
}

export function useKeyboardShortcuts(
  handlers: ShortcutHandlers,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handle = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'Tab') {
        e.preventDefault();
        // Blur the focused input so the node loses text focus, then fire
        if (isInput) (target as HTMLInputElement).blur?.();
        handlers.onTab();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (isInput) (target as HTMLInputElement).blur?.();
        handlers.onEnter();
        return;
      }

      // These shortcuts always fire regardless of input focus
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handlers.onUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handlers.onRedo();
        return;
      }

      if (isInput) return; // Below shortcuts only fire when NOT in an input

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handlers.onDelete();
      }
      if (e.key === 'f' || e.key === 'F') {
        handlers.onCenter();
      }
      if (e.key === ' ') {
        e.preventDefault();
        handlers.onZenToggle();
      }
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [handlers, enabled]);
}
