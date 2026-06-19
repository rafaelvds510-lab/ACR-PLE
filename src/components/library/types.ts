export type Status = "unread" | "reading" | "completed" | "finished";
export type HighlightColor = "green" | "yellow" | "red" | "blue" | "purple" | "orange" | "black";
export type ToolMode = "cursor" | "highlight" | "pen" | "note" | "eraser";
export type Thickness = "0.5" | "1.0" | "6";

export interface Doc {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  category: string | null;
  status: Status;
  source_type: "upload" | "url";
  file_path: string | null;
  external_url: string | null;
  notes: string;
  current_page: number;
  total_pages: number;
  fichamento_title: string | null;
}

export interface HL {
  id: string;
  document_id: string;
  page: number;
  color: HighlightColor;
  text: string | null;
  created_at: string;
}

export interface StickyNoteRow {
  id: string;
  document_id: string;
  page: number;
  x: number;
  y: number;
  content: string;
  created_at: string;
}

export const HL_COLORS: Record<HighlightColor, string> = {
  green: "#bbf7d0",
  yellow: "#fde68a",
  red: "#fecaca",
  blue: "#bfdbfe",
  purple: "#e9d5ff",
  orange: "#fed7aa",
  black: "#cbd5e1",
};

export const PEN_COLORS: Record<HighlightColor, string> = {
  green: "#16a34a",
  yellow: "#eab308",
  red: "#dc2626",
  blue: "#2563eb",
  purple: "#9333ea",
  orange: "#ea580c",
  black: "#0b1020",
};

export const THICKNESSES: Thickness[] = ["0.5", "1.0", "6"];
