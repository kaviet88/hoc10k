import { useEffect, useState } from "react";
import { Brain, Lightbulb, BookOpen, Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MindMapChild {
  id: string;
  label: string;
}

interface MindMapNode {
  id: string;
  label: string;
  color?: string;
  children?: MindMapChild[];
}

interface LessonMindMapProps {
  lessonId: string;
  programId: string;
  lessonTitle: string;
}

export const LessonMindMap = ({ lessonId, programId, lessonTitle }: LessonMindMapProps) => {
  const [loading, setLoading] = useState(true);
  const [rootLabel, setRootLabel] = useState("Chủ đề");
  const [nodes, setNodes] = useState<MindMapNode[]>([]);

  useEffect(() => {
    fetchMindMapData();
  }, [lessonId, programId]);

  const fetchMindMapData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("lesson_mindmaps")
      .select("*")
      .eq("lesson_id", lessonId)
      .eq("program_id", programId)
      .maybeSingle();

    if (data && !error) {
      setRootLabel(data.root_label);
      setNodes(data.nodes as unknown as MindMapNode[]);
    }
    setLoading(false);
  };

  const getNodeIcon = (index: number) => {
    const icons = [BookOpen, Lightbulb, Star];
    const Icon = icons[index % icons.length];
    return <Icon className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="p-6 text-center min-h-[300px] flex flex-col items-center justify-center">
        <Brain className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Chưa có sơ đồ tư duy cho bài học này</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-bold text-foreground mb-6 text-center">
        Sơ đồ tư duy: {lessonTitle}
      </h3>

      {/* Mind Map Visual */}
      <div className="relative overflow-x-auto pb-4">
        <div className="min-w-[600px] flex flex-col items-center">
          {/* Root Node */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold text-lg shadow-lg flex items-center gap-2 animate-pulse-slow">
              <Brain className="w-5 h-5" />
              {rootLabel}
            </div>
          </div>

          {/* Connecting Lines */}
          <div className="relative w-full flex justify-center mb-2">
            <div className="absolute top-0 left-1/2 w-0.5 h-8 bg-border -translate-x-1/2" />
            <div className="absolute top-8 left-[16%] right-[16%] h-0.5 bg-border" />
          </div>

          {/* Branch Nodes */}
          <div className={`grid gap-8 w-full max-w-4xl`} style={{ gridTemplateColumns: `repeat(${Math.min(nodes.length, 3)}, 1fr)` }}>
            {nodes.map((branch, index) => {
              const colors: Record<string, string> = {
                accent: "bg-accent/20 border-accent text-accent",
                success: "bg-success/20 border-success text-success",
                warning: "bg-warning/20 border-warning text-warning",
                primary: "bg-primary/20 border-primary text-primary",
              };
              const colorClass = colors[branch.color || "accent"] || colors.accent;

              return (
                <div key={branch.id} className="flex flex-col items-center">
                  {/* Vertical connector */}
                  <div className="w-0.5 h-6 bg-border mb-2" />

                  {/* Branch Node */}
                  <div
                    className={`${colorClass} border-2 px-4 py-2 rounded-xl font-semibold text-sm shadow-md flex items-center gap-2 mb-4`}
                  >
                    {getNodeIcon(index)}
                    {branch.label}
                  </div>

                  {/* Leaf Nodes */}
                  <div className="space-y-2 w-full">
                    {branch.children?.map((leaf) => (
                      <div
                        key={leaf.id}
                        className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors text-center"
                      >
                        {leaf.label}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Chủ đề chính</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span>Nhánh phụ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-card border border-border" />
          <span>Chi tiết</span>
        </div>
      </div>
    </div>
  );
};
