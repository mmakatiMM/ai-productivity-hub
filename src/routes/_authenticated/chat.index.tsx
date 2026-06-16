import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listThreads, createThread } from "@/lib/chats.functions";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/chat/")({
  head: () => ({ meta: [{ title: "Chat — Workplace AI" }] }),
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const { data, isLoading } = useQuery({
    queryKey: ["threads"],
    queryFn: () => list(),
  });

  useEffect(() => {
    if (isLoading || !data) return;
    (async () => {
      if (data.length > 0) {
        navigate({ to: "/chat/$threadId", params: { threadId: data[0].id }, replace: true });
      } else {
        const t = await create({ data: {} });
        navigate({ to: "/chat/$threadId", params: { threadId: t.id }, replace: true });
      }
    })();
  }, [data, isLoading, create, navigate]);

  return (
    <div className="p-10 text-sm text-muted-foreground">Loading conversations…</div>
  );
}
