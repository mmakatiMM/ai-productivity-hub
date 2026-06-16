import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import {
  listThreads,
  createThread,
  deleteThread,
  getThreadMessages,
} from "@/lib/chats.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  head: () => ({ meta: [{ title: "Chat — Workplace AI" }] }),
  component: ChatThread,
});

function ChatThread() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const remove = useServerFn(deleteThread);
  const fetchMessages = useServerFn(getThreadMessages);

  const threadsQuery = useQuery({ queryKey: ["threads"], queryFn: () => list() });
  const messagesQuery = useQuery({
    queryKey: ["thread-messages", threadId],
    queryFn: () => fetchMessages({ data: { threadId } }),
  });

  const initialMessages = useMemo(
    () => (messagesQuery.data ?? []) as unknown as UIMessage[],
    [messagesQuery.data],
  );

  if (messagesQuery.isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen">
        <ThreadSidebar
          threads={threadsQuery.data ?? []}
          activeId={threadId}
          onNew={async () => {
            const t = await create({ data: {} });
            qc.invalidateQueries({ queryKey: ["threads"] });
            navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
          }}
          onDelete={async (id) => {
            await remove({ data: { id } });
            qc.invalidateQueries({ queryKey: ["threads"] });
            if (id === threadId) navigate({ to: "/chat" });
          }}
        />
        <div className="flex-1 p-10 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <ChatView
      key={threadId}
      threadId={threadId}
      initialMessages={initialMessages}
      threads={threadsQuery.data ?? []}
      onNew={async () => {
        const t = await create({ data: {} });
        qc.invalidateQueries({ queryKey: ["threads"] });
        navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
      }}
      onDelete={async (id) => {
        await remove({ data: { id } });
        qc.invalidateQueries({ queryKey: ["threads"] });
        if (id === threadId) navigate({ to: "/chat" });
      }}
    />
  );
}

function ThreadSidebar({
  threads,
  activeId,
  onNew,
  onDelete,
}: {
  threads: Array<{ id: string; title: string }>;
  activeId: string;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside className="hidden md:flex w-64 border-r flex-col bg-card">
      <div className="p-3 border-b">
        <Button onClick={onNew} size="sm" className="w-full justify-start gap-2">
          <Plus className="h-4 w-4" /> New conversation
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {threads.length === 0 && (
          <div className="text-xs text-muted-foreground p-3">No conversations yet.</div>
        )}
        {threads.map((t) => (
          <div
            key={t.id}
            className={cn(
              "group flex items-center gap-1 rounded-md text-sm",
              t.id === activeId ? "bg-secondary" : "hover:bg-secondary/50",
            )}
          >
            <Link
              to="/chat/$threadId"
              params={{ threadId: t.id }}
              className="flex-1 min-w-0 px-3 py-2 truncate"
            >
              {t.title}
            </Link>
            <button
              onClick={() => onDelete(t.id)}
              className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive"
              aria-label="Delete conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

function ChatView({
  threadId,
  initialMessages,
  threads,
  onNew,
  onDelete,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  threads: Array<{ id: string; title: string }>;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: async (input, init) => {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        const headers = new Headers(init?.headers);
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      },
      prepareSendMessagesRequest: ({ messages, id }) => ({
        body: { messages, threadId: id },
      }),
    }),
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId, status]);

  const busy = status === "submitted" || status === "streaming";

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    await sendMessage({ text });
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen">
      <ThreadSidebar threads={threads} activeId={threadId} onNew={onNew} onDelete={onDelete} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-12 border-b flex items-center px-4 gap-2 shrink-0">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-sm font-medium truncate">
            {threads.find((t) => t.id === threadId)?.title ?? "Conversation"}
          </h1>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <h2 className="text-xl font-semibold tracking-tight">How can I help today?</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Ask anything about your work — drafting, planning, summarizing, or thinking through ideas.
                </p>
              </div>
            )}
            {messages.map((m) => {
              const text = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              if (m.role === "user") {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-sm whitespace-pre-wrap">
                      {text}
                    </div>
                  </div>
                );
              }
              return (
                <div key={m.id} className="prose-chat">
                  <ReactMarkdown>{text || (busy ? "▍" : "")}</ReactMarkdown>
                </div>
              );
            })}
            {status === "submitted" && (
              <div className="text-sm text-muted-foreground animate-pulse">Thinking…</div>
            )}
            {error && (
              <div className="text-sm text-destructive">{error.message}</div>
            )}
          </div>
        </div>

        <form
          onSubmit={submit}
          className="border-t p-3 sm:p-4 shrink-0 bg-background"
        >
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Message the assistant…"
              rows={1}
              className="resize-none min-h-[44px] max-h-40"
              disabled={busy}
            />
            <Button type="submit" size="icon" disabled={busy || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="max-w-3xl mx-auto text-[10px] text-muted-foreground mt-2 text-center">
            AI may produce inaccurate info. Verify important details before acting.
          </p>
        </form>
      </div>
    </div>
  );
}
