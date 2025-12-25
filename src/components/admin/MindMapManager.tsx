import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Save, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Json } from "@/integrations/supabase/types";

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

interface MindMap {
  id: string;
  program_id: string;
  lesson_id: string;
  root_label: string;
  nodes: MindMapNode[];
}

export function MindMapManager() {
  const [mindmaps, setMindmaps] = useState<MindMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMindmap, setEditingMindmap] = useState<MindMap | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [programId, setProgramId] = useState("1");
  const [lessonId, setLessonId] = useState("1-1");
  const [rootLabel, setRootLabel] = useState("");
  const [nodes, setNodes] = useState<MindMapNode[]>([]);

  // Filter state
  const [filterProgramId, setFilterProgramId] = useState("all");

  useEffect(() => {
    fetchMindmaps();
  }, [filterProgramId]);

  async function fetchMindmaps() {
    setLoading(true);
    let query = supabase.from("lesson_mindmaps").select("*").order("created_at", { ascending: false });
    
    if (filterProgramId !== "all") {
      query = query.eq("program_id", filterProgramId);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Lỗi khi tải sơ đồ tư duy");
      console.error(error);
    } else {
      setMindmaps(data?.map(m => ({
        ...m,
        nodes: m.nodes as unknown as MindMapNode[]
      })) || []);
    }
    setLoading(false);
  }

  function resetForm() {
    setProgramId("1");
    setLessonId("1-1");
    setRootLabel("");
    setNodes([]);
    setEditingMindmap(null);
  }

  function openEditDialog(m: MindMap) {
    setEditingMindmap(m);
    setProgramId(m.program_id);
    setLessonId(m.lesson_id);
    setRootLabel(m.root_label);
    setNodes(m.nodes);
    setDialogOpen(true);
  }

  function addNode() {
    setNodes([...nodes, { id: `node-${Date.now()}`, label: "", children: [] }]);
  }

  function updateNode(idx: number, field: string, value: string) {
    const newNodes = [...nodes];
    if (field === "label") {
      newNodes[idx].label = value;
    } else if (field === "color") {
      newNodes[idx].color = value;
    }
    setNodes(newNodes);
  }

  function removeNode(idx: number) {
    setNodes(nodes.filter((_, i) => i !== idx));
  }

  function addChild(nodeIdx: number) {
    const newNodes = [...nodes];
    if (!newNodes[nodeIdx].children) {
      newNodes[nodeIdx].children = [];
    }
    newNodes[nodeIdx].children!.push({ id: `child-${Date.now()}`, label: "" });
    setNodes(newNodes);
  }

  function updateChild(nodeIdx: number, childIdx: number, value: string) {
    const newNodes = [...nodes];
    newNodes[nodeIdx].children![childIdx].label = value;
    setNodes(newNodes);
  }

  function removeChild(nodeIdx: number, childIdx: number) {
    const newNodes = [...nodes];
    newNodes[nodeIdx].children = newNodes[nodeIdx].children!.filter((_, i) => i !== childIdx);
    setNodes(newNodes);
  }

  async function handleSave() {
    if (!rootLabel.trim()) {
      toast.error("Vui lòng nhập nhãn gốc");
      return;
    }

    setSaving(true);
    const mindmapData = {
      program_id: programId,
      lesson_id: lessonId,
      root_label: rootLabel,
      nodes: nodes as unknown as Json,
    };

    if (editingMindmap) {
      const { error } = await supabase
        .from("lesson_mindmaps")
        .update(mindmapData)
        .eq("id", editingMindmap.id);

      if (error) {
        toast.error("Lỗi khi cập nhật sơ đồ tư duy");
        console.error(error);
      } else {
        toast.success("Đã cập nhật sơ đồ tư duy");
        setDialogOpen(false);
        resetForm();
        fetchMindmaps();
      }
    } else {
      const { error } = await supabase
        .from("lesson_mindmaps")
        .insert(mindmapData);

      if (error) {
        toast.error("Lỗi khi thêm sơ đồ tư duy");
        console.error(error);
      } else {
        toast.success("Đã thêm sơ đồ tư duy mới");
        setDialogOpen(false);
        resetForm();
        fetchMindmaps();
      }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa sơ đồ tư duy này?")) return;

    const { error } = await supabase.from("lesson_mindmaps").delete().eq("id", id);

    if (error) {
      toast.error("Lỗi khi xóa sơ đồ tư duy");
      console.error(error);
    } else {
      toast.success("Đã xóa sơ đồ tư duy");
      fetchMindmaps();
    }
  }

  const colorOptions = [
    { value: "blue", label: "Xanh dương" },
    { value: "green", label: "Xanh lá" },
    { value: "purple", label: "Tím" },
    { value: "orange", label: "Cam" },
    { value: "red", label: "Đỏ" },
  ];

  return (
    <div className="space-y-6">
      {/* Filters and Add Button */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <Label>Chương trình</Label>
          <Select value={filterProgramId} onValueChange={setFilterProgramId}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="1">Chương trình 1</SelectItem>
              <SelectItem value="2">Chương trình 2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Thêm sơ đồ tư duy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMindmap ? "Chỉnh sửa sơ đồ tư duy" : "Thêm sơ đồ tư duy mới"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Chương trình ID</Label>
                  <Input value={programId} onChange={(e) => setProgramId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Bài học ID</Label>
                  <Input value={lessonId} onChange={(e) => setLessonId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nhãn gốc</Label>
                  <Input value={rootLabel} onChange={(e) => setRootLabel(e.target.value)} placeholder="VD: Danh từ" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base">Các nhánh</Label>
                  <Button variant="outline" size="sm" onClick={addNode}>
                    <Plus className="w-4 h-4 mr-1" />
                    Thêm nhánh
                  </Button>
                </div>

                {nodes.map((node, nodeIdx) => (
                  <Card key={node.id} className="bg-muted/50">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex gap-2 items-center">
                        <Input
                          value={node.label}
                          onChange={(e) => updateNode(nodeIdx, "label", e.target.value)}
                          placeholder="Tên nhánh"
                          className="flex-1"
                        />
                        <Select 
                          value={node.color || "blue"} 
                          onValueChange={(v) => updateNode(nodeIdx, "color", v)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {colorOptions.map(c => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="destructive" size="icon" onClick={() => removeNode(nodeIdx)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="pl-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm text-muted-foreground">Các mục con</Label>
                          <Button variant="ghost" size="sm" onClick={() => addChild(nodeIdx)}>
                            <Plus className="w-3 h-3 mr-1" />
                            Thêm mục con
                          </Button>
                        </div>
                        {node.children?.map((child, childIdx) => (
                          <div key={child.id} className="flex gap-2">
                            <Input
                              value={child.label}
                              onChange={(e) => updateChild(nodeIdx, childIdx, e.target.value)}
                              placeholder="Tên mục con"
                              className="flex-1"
                            />
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => removeChild(nodeIdx, childIdx)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Hủy
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Lưu
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mindmaps List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : mindmaps.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Chưa có sơ đồ tư duy nào. Hãy thêm mới!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {mindmaps.map((m) => (
            <Card key={m.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{m.root_label}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(m)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-muted-foreground mb-3">
                  Chương trình: {m.program_id} | Bài học: {m.lesson_id}
                </div>
                <div className="flex flex-wrap gap-2">
                  {m.nodes.map((node) => (
                    <div 
                      key={node.id}
                      className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                    >
                      {node.label} ({node.children?.length || 0} mục con)
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
