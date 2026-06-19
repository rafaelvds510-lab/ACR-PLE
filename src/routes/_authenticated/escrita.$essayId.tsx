import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getEssay, updateEssay } from "@/lib/essays.functions";
import { EssayEditor } from "@/components/essay-editor";

export const Route = createFileRoute("/_authenticated/escrita/$essayId")({
  component: EssayPage,
});

function EssayPage() {
  const { essayId } = Route.useParams();
  const navigate = useNavigate();
  const get = useServerFn(getEssay);
  const update = useServerFn(updateEssay);

  const {
    data: essay,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["essay", essayId],
    queryFn: () => get({ data: { id: essayId } }),
  });

  useEffect(() => {
    if (error || (essay === null && !isLoading)) {
      navigate({ to: "/escrita" });
    }
  }, [error, essay, isLoading, navigate]);

  if (isLoading || !essay) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-muted-foreground">
        Carregando…
      </div>
    );
  }

  return (
    <EssayEditor
      key={essay.id}
      initialTitle={essay.title}
      initialContent={essay.content}
      template={(essay.template as "caderno" | "diario") ?? "caderno"}
      onSave={async (title, content) => {
        await update({ data: { id: essay.id, title, content } });
      }}
    />
  );
}
