import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, FileText, ListChecks, Search, MessageSquare, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Workplace AI" }] }),
  component: Dashboard,
});

const tools = [
  {
    to: "/email",
    icon: Mail,
    title: "Smart Email Generator",
    desc: "Draft professional emails for any tone, audience, or purpose in seconds.",
  },
  {
    to: "/summarize",
    icon: FileText,
    title: "Meeting Notes Summarizer",
    desc: "Turn long notes into TL;DRs, decisions, action items, and open questions.",
  },
  {
    to: "/planner",
    icon: ListChecks,
    title: "AI Task Planner",
    desc: "Break goals into prioritized, sequenced tasks with estimates and risks.",
  },
  {
    to: "/research",
    icon: Search,
    title: "AI Research Assistant",
    desc: "Get structured briefs with key concepts, tradeoffs, and what to verify.",
  },
  {
    to: "/chat",
    icon: MessageSquare,
    title: "AI Chatbot",
    desc: "Free-form conversational assistant for everything in between.",
  },
] as const;

function Dashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">Good to see you.</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">
          Pick a tool to get started. Every output is editable, copyable, and savable to your
          library.
        </p>
      </header>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className="group rounded-xl border bg-card p-5 hover:border-foreground/40 transition-colors flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-9 w-9 rounded-lg bg-secondary grid place-items-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="font-medium tracking-tight">{t.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{t.desc}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 rounded-lg border border-dashed p-5 bg-muted/30">
        <h3 className="text-sm font-medium">Responsible AI</h3>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          This assistant generates content using AI models. Outputs can be inaccurate, biased, or
          incomplete. Always review before acting on sensitive HR, legal, financial, or
          safety-critical decisions.
        </p>
      </div>
    </div>
  );
}
