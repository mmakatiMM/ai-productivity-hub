import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { researchTopic } from "@/lib/ai.functions";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({ meta: [{ title: "Research Assistant — Workplace AI" }] }),
  component: ResearchPage,
});

function ResearchPage() {
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<"brief" | "standard" | "deep">("standard");
  const [angle, setAngle] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const run = useServerFn(researchTopic);

  async function go() {
    if (topic.trim().length < 3) {
      toast.error("Enter a topic.");
      return;
    }
    setLoading(true);
    try {
      const { text } = await run({ data: { topic, depth, angle } });
      setResult(text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to research");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolLayout
      title="AI Research Assistant"
      description="Get a structured brief on any topic with concepts, tradeoffs, and next steps."
      loading={loading}
      result={result}
      onResultChange={setResult}
      onRegenerate={go}
      kind="research"
      titleForSave={topic.slice(0, 80)}
    >
      <div className="space-y-1.5">
        <Label htmlFor="topic">Topic</Label>
        <Input
          id="topic"
          placeholder="e.g. Implementing OKRs in a 30-person startup"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Depth</Label>
        <Select value={depth} onValueChange={(v) => setDepth(v as typeof depth)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="brief">Brief (1-min read)</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="deep">Deep dive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="angle">Angle / audience (optional)</Label>
        <Textarea
          id="angle"
          placeholder="e.g. From a CTO's perspective, focus on tradeoffs."
          value={angle}
          onChange={(e) => setAngle(e.target.value)}
          rows={3}
        />
      </div>
      <Button onClick={go} disabled={loading} className="w-full">
        {loading ? "Researching…" : "Generate brief"}
      </Button>
    </ToolLayout>
  );
}
