import { Brain, Lightbulb, BookOpen, Star } from "lucide-react";

interface MindMapNode {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: MindMapNode[];
  color?: string;
}

interface LessonMindMapProps {
  lessonTitle: string;
}

export const LessonMindMap = ({ lessonTitle }: LessonMindMapProps) => {
  // Sample mind map data - in a real app, this would come from the database
  const mindMapData: MindMapNode = {
    id: "root",
    label: "Danh từ",
    icon: <Brain className="w-5 h-5" />,
    color: "primary",
    children: [
      {
        id: "countable",
        label: "Đếm được",
        icon: <BookOpen className="w-4 h-4" />,
        color: "accent",
        children: [
          { id: "c1", label: "Có số ít/nhiều" },
          { id: "c2", label: "Dùng a/an" },
          { id: "c3", label: "Ví dụ: apple, book, cat" },
        ],
      },
      {
        id: "uncountable",
        label: "Không đếm được",
        icon: <Lightbulb className="w-4 h-4" />,
        color: "success",
        children: [
          { id: "u1", label: "Không có số nhiều" },
          { id: "u2", label: "Không dùng a/an" },
          { id: "u3", label: "Ví dụ: water, milk, rice" },
        ],
      },
      {
        id: "tips",
        label: "Mẹo nhớ",
        icon: <Star className="w-4 h-4" />,
        color: "warning",
        children: [
          { id: "t1", label: "Đếm trên tay = đếm được" },
          { id: "t2", label: "Chất lỏng = không đếm được" },
        ],
      },
    ],
  };

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
              {mindMapData.icon}
              {mindMapData.label}
            </div>
          </div>

          {/* Connecting Lines */}
          <div className="relative w-full flex justify-center mb-2">
            <div className="absolute top-0 left-1/2 w-0.5 h-8 bg-border -translate-x-1/2" />
            <div className="absolute top-8 left-[16%] right-[16%] h-0.5 bg-border" />
          </div>

          {/* Branch Nodes */}
          <div className="grid grid-cols-3 gap-8 w-full max-w-4xl">
            {mindMapData.children?.map((branch, index) => {
              const colors = {
                accent: "bg-accent/20 border-accent text-accent",
                success: "bg-success/20 border-success text-success",
                warning: "bg-warning/20 border-warning text-warning",
              };
              const colorClass = colors[branch.color as keyof typeof colors] || colors.accent;

              return (
                <div key={branch.id} className="flex flex-col items-center">
                  {/* Vertical connector */}
                  <div className="w-0.5 h-6 bg-border mb-2" />

                  {/* Branch Node */}
                  <div
                    className={`${colorClass} border-2 px-4 py-2 rounded-xl font-semibold text-sm shadow-md flex items-center gap-2 mb-4`}
                  >
                    {branch.icon}
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
