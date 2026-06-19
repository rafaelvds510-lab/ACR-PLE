import { X, Keyboard } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ShortcutRow {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutRow[];
}

// ─── Dados ───────────────────────────────────────────────────────────────────

const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl";

const GROUPS: ShortcutGroup[] = [
  {
    title: "Núcleo de Edição",
    shortcuts: [
      { keys: ["Enter"], description: "Cria tópico irmão abaixo" },
      { keys: ["Shift", "Enter"], description: "Cria tópico irmão acima" },
      { keys: ["Tab"], description: "Cria subtópico (filho)" },
      { keys: ["Shift", "Tab"], description: "Promove tópico (desindenta)" },
      { keys: [MOD, "Enter"], description: "Cria tópico pai acima" },
      { keys: ["F2"], description: "Editar título do tópico" },
      { keys: ["Delete"], description: "Remover tópico selecionado" },
      { keys: ["Esc"], description: "Sair da edição / limpar seleção" },
    ],
  },
  {
    title: "Histórico e Área de Transferência",
    shortcuts: [
      { keys: [MOD, "Z"], description: "Desfazer" },
      { keys: [MOD, "Y"], description: "Refazer" },
      { keys: [MOD, "C"], description: "Copiar tópico (e filhos)" },
      { keys: [MOD, "X"], description: "Recortar tópico" },
      { keys: [MOD, "V"], description: "Colar tópico" },
    ],
  },
  {
    title: "Expansão e Colapso",
    shortcuts: [
      { keys: ["+"], description: "Expandir ramo selecionado" },
      { keys: ["-"], description: "Colapsar ramo selecionado" },
      { keys: ["*"], description: "Expandir todos os ramos" },
      { keys: ["/"], description: "Colapsar todos os ramos" },
    ],
  },
  {
    title: "Movimentação",
    shortcuts: [
      { keys: ["Alt", "↑"], description: "Mover tópico para cima" },
      { keys: ["Alt", "↓"], description: "Mover tópico para baixo" },
    ],
  },
  {
    title: "Seleção",
    shortcuts: [
      { keys: [MOD, "A"], description: "Selecionar todos os tópicos" },
      { keys: [MOD, "Shift", "A"], description: "Selecionar tópicos irmãos" },
    ],
  },
  {
    title: "Visualização e Zoom",
    shortcuts: [
      { keys: [MOD, "0"], description: "Zoom 100% (real)" },
      { keys: [MOD, "+"], description: "Zoom in" },
      { keys: [MOD, "-"], description: "Zoom out" },
      { keys: [MOD, "Home"], description: "Centralizar no tópico raiz" },
    ],
  },
  {
    title: "Arquivo",
    shortcuts: [{ keys: [MOD, "S"], description: "Salvar mapa" }],
  },
];

// ─── Componente ───────────────────────────────────────────────────────────────

interface KeyboardShortcutsPanelProps {
  onClose: () => void;
}

function KeyBadge({ label }: { label: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.6rem] h-6 px-1.5 rounded border border-border/70 bg-muted text-[10px] font-semibold font-mono text-muted-foreground shadow-sm select-none">
      {label}
    </kbd>
  );
}

export function KeyboardShortcutsPanel({ onClose }: KeyboardShortcutsPanelProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border/60 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-card/95 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-gold" />
            <h2 className="font-display text-lg font-bold text-foreground">Atalhos de Teclado</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Fechar painel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="grid gap-6 p-6 sm:grid-cols-2">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gold/80">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((s) => (
                  <div key={s.description} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">{s.description}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      {s.keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-[10px] text-muted-foreground/50">+</span>}
                          <KeyBadge label={k} />
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border/40 px-6 py-3 text-center text-xs text-muted-foreground">
          Pressione <KeyBadge label={`${MOD}+Shift+L`} /> a qualquer momento para abrir/fechar este
          painel
        </div>
      </div>
    </div>
  );
}
