import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { planTasks } from "@/lib/ai.functions";
import { ToolLayout } from "@/components/tool-layout";
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

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({ meta: [{ title: "AI Task Planner — Workplace AI" }] }),
  component: PlannerPage,
});

function PlannerPage() {
  const [goal, setGoal] = useState("");
  const [horizon, setHorizon] = useState<"today" | "week" | "month" | "quarter">("week");
  const [constraints, setConstraints] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const run = useServerFn(planTasks);

  async function go() {
    if (goal.trim().length < 3) {
      toast.error("Describe your goal.");
      return;
    }
    setLoading(true);
    try {
      const { text } = await run({ data: { goal, horizon, constraints } });
      setResult(text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolLayout
      title="AI Task Planner"
      description="Turn a goal into a prioritized, sequenced task plan with estimates and risks."
      loading={loading}
      result={result}
      onResultChange={setResult}
      onRegenerate={go}
      kind="plan"
      titleForSave={goal.slice(0, 80)}
    >
      <div className="space-y-1.5">
        <Label htmlFor="goal">Goal</Label>
        <Textarea
          id="goal"
          placeholder="e.g. Launch v2 of the onboarding flow with measurable activation lift."
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Horizon</Label>
        <Select value={horizon} onValueChange={(v) => setHorizon(v as typeof horizon)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This week</SelectItem>
            <SelectItem value="month">This month</SelectItem>
            <SelectItem value="quarter">This quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="constraints">Constraints (optional)</Label>
        <Textarea
          id="constraints"
          placeholder="Team size, deadlines, budget, dependencies, etc."
          value={constraints}
          onChange={(e) => setConstraints(e.target.value)}
          rows={3}
        />
      </div>
      <Button onClick={go} disabled={loading} className="w-full">
        {loading ? "Planning…" : "Generate plan"}
      </Button>
    </ToolLayout>
  );
}
