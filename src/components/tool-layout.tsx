import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Copy, Check, Save, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { saveOutput } from "@/lib/chats.functions";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  title: string;
  description: string;
  children: ReactNode;
  loading: boolean;
  result: string;
  onResultChange: (v: string) => void;
  onRegenerate?: () => void;
  kind: "email" | "summary" | "plan" | "research";
  titleForSave: string;
}

export function ToolLayout({
  title,
  description,
  children,
  loading,
  result,
  onResultChange,
  onRegenerate,
  kind,
  titleForSave,
}: Props) {
  const [copied, setCopied] = useState(false);
  const save = useServerFn(saveOutput);

  async function handleCopy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSave() {
    try {
      await save({ data: { kind, title: titleForSave || `Untitled ${kind}`, content: result } });
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="space-y-4">
          <div className="rounded-lg border bg-card p-5 space-y-4">{children}</div>
          <p className="text-xs text-muted-foreground">
            Responsible AI: outputs are AI-generated and may contain errors. Review carefully before
            sharing externally.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Output</h2>
            <div className="flex gap-1">
              {onRegenerate && (
                <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={loading || !result}>
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!result}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSave} disabled={!result}>
                <Save className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card min-h-[400px]">
            {loading && (
              <div className="p-6 text-sm text-muted-foreground animate-pulse">Generating…</div>
            )}
            {!loading && !result && (
              <div className="p-6 text-sm text-muted-foreground">
                Your generated output will appear here. You can edit it before copying or saving.
              </div>
            )}
            {!loading && result && (
              <div className="grid grid-rows-[1fr_auto]">
                <div className="p-5 prose-chat max-h-[60vh] overflow-y-auto">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
                <details className="border-t">
                  <summary className="text-xs px-4 py-2 cursor-pointer text-muted-foreground hover:text-foreground">
                    Edit raw output
                  </summary>
                  <Textarea
                    value={result}
                    onChange={(e) => onResultChange(e.target.value)}
                    rows={10}
                    className="border-0 rounded-none font-mono text-xs focus-visible:ring-0"
                  />
                </details>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
