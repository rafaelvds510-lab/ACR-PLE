/**
 * useMindmapShortcuts
 * Hook centralizado de atalhos de teclado estilo XMind.
 * Detecta automaticamente Ctrl (Win/Linux) vs Cmd (macOS).
 */

import { useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MindmapNode {
  id: string;
  label: string;
  x: number;
  y: number;
  isRoot?: boolean;
}

export interface MindmapEdge {
  id: string;
  source: string;
  target: string;
}

export interface ShortcutCallbacks {
  // Núcleo de edição
  addSiblingBelow: () => void;
  addSiblingAbove: () => void;
  addChild: () => void;
  promoteNode: () => void; // Shift+Tab
  addParent: () => void; // Ctrl+Enter
  startEditSelected: () => void; // F2
  deleteSelected: () => void;

  // Histórico
  undo: () => void;
  redo: () => void;

  // Copiar/Colar
  copySelected: () => void;
  cutSelected: () => void;
  pasteClipboard: () => void;

  // Arquivo
  save: () => void;

  // Seleção
  selectAll: () => void;
  selectSiblings: () => void;

  // Expansão/colapso
  expandSelected: () => void;
  collapseSelected: () => void;
  expandAll: () => void;
  collapseAll: () => void;

  // Movimentação
  moveUp: () => void;
  moveDown: () => void;

  // Visualização
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  goHome: () => void;

  // UI
  toggleShortcutsPanel: () => void;
  clearSelection: () => void;
  commitEditEsc: () => void; // Escape durante edição
}

// ─── Detecta Mod (Ctrl/Cmd) ──────────────────────────────────────────────────

function isMod(e: KeyboardEvent): boolean {
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  return isMac ? e.metaKey : e.ctrlKey;
}

/** Verifica se o evento vem de dentro de um input/textarea (não deve acionar atalhos de canvas) */
function isInsideInput(e: KeyboardEvent): boolean {
  const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useMindmapShortcuts(
  callbacks: ShortcutCallbacks,
  /** true quando há um nó em modo de edição de texto ativo */
  isEditing: boolean,
  /** true quando há algum nó selecionado */
  hasSelection: boolean,
) {
  // Stable ref para callbacks (evita re-registrar listener a cada render)
  const cb = useRef(callbacks);
  useEffect(() => {
    cb.current = callbacks;
  }, [callbacks]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = isMod(e);
      const shift = e.shiftKey;
      const alt = e.altKey;
      const inInput = isInsideInput(e);

      // ── Ctrl/Cmd+Shift+L: painel de atalhos (sempre disponível) ─────────────
      if (mod && shift && e.key === "L") {
        e.preventDefault();
        cb.current.toggleShortcutsPanel();
        return;
      }

      // ── Ctrl/Cmd+S: salvar (sempre disponível) ──────────────────────────────
      if (mod && e.key === "s") {
        e.preventDefault();
        cb.current.save();
        return;
      }

      // ── Ctrl/Cmd+Z: undo ────────────────────────────────────────────────────
      if (mod && !shift && e.key === "z") {
        e.preventDefault();
        cb.current.undo();
        return;
      }

      // ── Ctrl/Cmd+Y ou Ctrl/Cmd+Shift+Z: redo ───────────────────────────────
      if ((mod && e.key === "y") || (mod && shift && e.key === "z")) {
        e.preventDefault();
        cb.current.redo();
        return;
      }

      // ── Ctrl/Cmd+C: copiar ──────────────────────────────────────────────────
      if (mod && !shift && e.key === "c" && !inInput) {
        e.preventDefault();
        cb.current.copySelected();
        return;
      }

      // ── Ctrl/Cmd+X: recortar ────────────────────────────────────────────────
      if (mod && !shift && e.key === "x" && !inInput) {
        e.preventDefault();
        cb.current.cutSelected();
        return;
      }

      // ── Ctrl/Cmd+V: colar ───────────────────────────────────────────────────
      if (mod && !shift && e.key === "v" && !inInput) {
        e.preventDefault();
        cb.current.pasteClipboard();
        return;
      }

      // ── Ctrl/Cmd+A: selecionar tudo ─────────────────────────────────────────
      if (mod && !shift && !alt && e.key === "a" && !inInput) {
        e.preventDefault();
        cb.current.selectAll();
        return;
      }

      // ── Ctrl/Cmd+Shift+A: selecionar irmãos ────────────────────────────────
      if (mod && shift && e.key === "A" && !inInput) {
        e.preventDefault();
        cb.current.selectSiblings();
        return;
      }

      // ── Zoom: Ctrl+0, Ctrl++, Ctrl+- ────────────────────────────────────────
      if (mod && (e.key === "0" || e.key === "NumPad0")) {
        e.preventDefault();
        cb.current.zoomReset();
        return;
      }
      if (mod && (e.key === "=" || e.key === "+" || e.key === "NumpadAdd")) {
        e.preventDefault();
        cb.current.zoomIn();
        return;
      }
      if (mod && (e.key === "-" || e.key === "NumpadSubtract")) {
        e.preventDefault();
        cb.current.zoomOut();
        return;
      }

      // ── Ctrl/Cmd+Home: centralizar no root ──────────────────────────────────
      if (mod && e.key === "Home") {
        e.preventDefault();
        cb.current.goHome();
        return;
      }

      // ─── A partir daqui: apenas quando não estamos dentro de um input ────────
      if (inInput) return;

      // ── Escape ───────────────────────────────────────────────────────────────
      if (e.key === "Escape") {
        e.preventDefault();
        if (isEditing) {
          cb.current.commitEditEsc();
        } else {
          cb.current.clearSelection();
        }
        return;
      }

      // ── F2: editar nó selecionado ────────────────────────────────────────────
      if (e.key === "F2" && hasSelection) {
        e.preventDefault();
        cb.current.startEditSelected();
        return;
      }

      // ── Delete / Backspace: deletar ──────────────────────────────────────────
      if ((e.key === "Delete" || e.key === "Backspace") && hasSelection && !isEditing) {
        e.preventDefault();
        cb.current.deleteSelected();
        return;
      }

      // ── Alt+↑/↓: reordenar irmãos ───────────────────────────────────────────
      if (alt && e.key === "ArrowUp" && hasSelection) {
        e.preventDefault();
        cb.current.moveUp();
        return;
      }
      if (alt && e.key === "ArrowDown" && hasSelection) {
        e.preventDefault();
        cb.current.moveDown();
        return;
      }

      // ── Tab: adicionar filho ─────────────────────────────────────────────────
      if (e.key === "Tab" && !shift && hasSelection && !isEditing) {
        e.preventDefault();
        cb.current.addChild();
        return;
      }

      // ── Shift+Tab: promover nó ───────────────────────────────────────────────
      if (e.key === "Tab" && shift && hasSelection && !isEditing) {
        e.preventDefault();
        cb.current.promoteNode();
        return;
      }

      // ── Enter: irmão abaixo ──────────────────────────────────────────────────
      if (e.key === "Enter" && !shift && !mod && hasSelection && !isEditing) {
        e.preventDefault();
        cb.current.addSiblingBelow();
        return;
      }

      // ── Shift+Enter: irmão acima ─────────────────────────────────────────────
      if (e.key === "Enter" && shift && !mod && hasSelection && !isEditing) {
        e.preventDefault();
        cb.current.addSiblingAbove();
        return;
      }

      // ── Ctrl+Enter: pai acima ────────────────────────────────────────────────
      if (e.key === "Enter" && mod && hasSelection && !isEditing) {
        e.preventDefault();
        cb.current.addParent();
        return;
      }

      // ── +/-: expandir/colapsar (somente no canvas, não em inputs) ────────────
      if (e.key === "+" && hasSelection) {
        e.preventDefault();
        cb.current.expandSelected();
        return;
      }
      if (e.key === "-" && hasSelection) {
        e.preventDefault();
        cb.current.collapseSelected();
        return;
      }
      if (e.key === "*") {
        e.preventDefault();
        cb.current.expandAll();
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        cb.current.collapseAll();
        return;
      }
    },
    [isEditing, hasSelection],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
