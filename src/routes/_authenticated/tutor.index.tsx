import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createThread } from "@/lib/tutor.functions";

export const Route = createFileRoute("/_authenticated/tutor/")({
  component: TutorRedirect,
});

function TutorRedirect() {
  const navigate = useNavigate();
  const create = useServerFn(createThread);
  const m = useMutation({
    mutationFn: () => create(),
    onSuccess: (row) =>
      navigate({ to: "/tutor/$threadId", params: { threadId: row.id }, replace: true }),
  });

  useEffect(() => {
    m.mutate(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
      Abrindo o Tutor IA…
    </div>
  );
}
