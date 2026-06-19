import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// react-pdf / pdfjs reach for browser-only globals (DOMMatrix) at module load,
// which crashes SSR. Load the entire reader implementation lazily and only on
// the client.
const LibraryReader = lazy(() => import("@/components/library-reader"));

export const Route = createFileRoute("/_authenticated/biblioteca/ler/$id")({
  component: ReaderRoute,
});

function ReaderRoute() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LibraryReader />
    </Suspense>
  );
}
