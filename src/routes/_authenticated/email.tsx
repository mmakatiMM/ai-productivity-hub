import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateEmail } from "@/lib/ai.functions";
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

export const Route = createFileRoute("/_authenticated/email")({
  head: () => ({ meta: [{ title: "Email Generator — Workplace AI" }] }),
  component: EmailPage,
});

function EmailPage() {
  const [recipient, setRecipient] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState<"formal" | "friendly" | "concise" | "persuasive" | "apologetic">(
    "formal",
  );
  const [context, setContext] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const run = useServerFn(generateEmail);

  async function go() {
    if (!purpose.trim()) {
      toast.error("Describe the purpose of the email.");
      return;
    }
    setLoading(true);
    try {
      const { text } = await run({ data: { recipient, purpose, tone, context } });
      setResult(text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolLayout
      title="Smart Email Generator"
      description="Describe what you need to send. The assistant writes a polished draft you can edit."
      loading={loading}
      result={result}
      onResultChange={setResult}
      onRegenerate={go}
      kind="email"
      titleForSave={purpose.slice(0, 80)}
    >
      <div className="space-y-1.5">
        <Label htmlFor="recipient">Recipient (optional)</Label>
        <Input
          id="recipient"
          placeholder="e.g. Marketing team, my manager Sarah"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="purpose">Purpose</Label>
        <Textarea
          id="purpose"
          placeholder="e.g. Ask for an extension on the Q3 report by next Friday."
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Tone</Label>
        <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="formal">Formal</SelectItem>
            <SelectItem value="friendly">Friendly</SelectItem>
            <SelectItem value="concise">Concise</SelectItem>
            <SelectItem value="persuasive">Persuasive</SelectItem>
            <SelectItem value="apologetic">Apologetic</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="context">Additional context (optional)</Label>
        <Textarea
          id="context"
          placeholder="Background, constraints, prior thread excerpts, etc."
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={3}
        />
      </div>
      <Button onClick={go} disabled={loading} className="w-full">
        {loading ? "Generating…" : "Generate email"}
      </Button>
    </ToolLayout>
  );
}
