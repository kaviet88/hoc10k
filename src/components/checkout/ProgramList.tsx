import { BookOpen, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Program, CartItem } from "@/pages/Checkout";

interface ProgramListProps {
  programs: Program[];
  activeTab: "single" | "combo";
  onTabChange: (tab: "single" | "combo") => void;
  onAddToCart: (program: Program) => void;
  cartItems: CartItem[];
}

const tagColors: Record<string, string> = {
  "Phổ biến": "bg-success/10 text-success border-success/20",
  "Khuyến nghị": "bg-secondary/20 text-secondary-foreground border-secondary/30",
  "Mới": "bg-accent/10 text-accent border-accent/20",
  "Tiết kiệm": "bg-primary/10 text-primary border-primary/20",
};

export const ProgramList = ({
  programs,
  activeTab,
  onTabChange,
  onAddToCart,
  cartItems,
}: ProgramListProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ";
  };

  const isInCart = (id: string) => cartItems.some((item) => item.id === id);

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Chương Trình Có Sẵn
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {programs.length} chương trình
          </span>
          <Tabs
            value={activeTab}
            onValueChange={(v) => onTabChange(v as "single" | "combo")}
          >
            <TabsList>
              <TabsTrigger value="single">Mua Lẻ</TabsTrigger>
              <TabsTrigger value="combo">Combo</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="space-y-4">
        {programs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Không tìm thấy chương trình nào
          </div>
        ) : (
          programs.map((program) => (
            <div
              key={program.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {program.type}
                    </Badge>
                    {program.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={`text-xs ${tagColors[tag] || ""}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {program.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {program.duration}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6">
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    {formatPrice(program.price)}
                  </p>
                  {program.originalPrice && (
                    <p className="text-sm text-muted-foreground line-through">
                      {formatPrice(program.originalPrice)}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={isInCart(program.id) ? "secondary" : "default"}
                  onClick={() => onAddToCart(program)}
                  disabled={isInCart(program.id)}
                  className="shrink-0"
                >
                  {isInCart(program.id) ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Đã thêm
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
