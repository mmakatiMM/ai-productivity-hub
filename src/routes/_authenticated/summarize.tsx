import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { summarizeMeeting } from "@/lib/ai.functions";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/summarize")({
  head: () => ({ meta: [{ title: "Meeting Notes Summarizer — Workplace AI" }] }),
  component: SummarizePage,
});

function SummarizePage() {
  const [notes, setNotes] = useState("");
  const [audience, setAudience] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const run = useServerFn(summarizeMeeting);

  async function go() {
    if (notes.trim().length < 10) {
      toast.error("Paste your meeting notes (at least a few sentences).");
      return;
    }
    setLoading(true);
    try {
      const { text } = await run({ data: { notes, audience } });
      setResult(text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to summarize");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolLayout
      title="Meeting Notes Summarizer"
      description="Paste raw notes or a transcript. Get a structured summary with action items."
      loading={loading}
      result={result}
      onResultChange={setResult}
      onRegenerate={go}
      kind="summary"
      titleForSave={audience ? `Summary for ${audience}` : "Meeting summary"}
    >
      <div className="space-y-1.5">
        <Label htmlFor="audience">Audience (optional)</Label>
        <Input
          id="audience"
          placeholder="e.g. Engineering team, executive sponsors"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes / Transcript</Label>
        <Textarea
          id="notes"
          placeholder="Paste meeting notes or transcript here…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={14}
          className="font-mono text-xs"
        />
      </div>
      <Button onClick={go} disabled={loading} className="w-full">
        {loading ? "Summarizing…" : "Summarize"}
      </Button>
    </ToolLayout>
  );
}
