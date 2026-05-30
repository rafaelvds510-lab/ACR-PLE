'use client';

import { useRef, useCallback } from 'react';

export function useAutoSave(
  writingId: string,
  onSaved?: (status: 'saved' | 'error') => void,
  debounceMs = 1500
) {
  const timer = useRef<NodeJS.Timeout | null>(null);

  const save = useCallback(
    (content: any, wordCount: number, title: string, template?: string) => {
      if (timer.current) clearTimeout(timer.current);

      timer.current = setTimeout(async () => {
        try {
          const body: any = { content, word_count: wordCount, title };
          if (template) body.template = template;

          await fetch(`/api/writings/${writingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          onSaved?.('saved');
        } catch {
          onSaved?.('error');
        }
      }, debounceMs);
    },
    [writingId, onSaved, debounceMs]
  );

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { save, flush };
}
