import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { CartSidebar } from "@/components/checkout/CartSidebar";
import { FilterSection } from "@/components/checkout/FilterSection";
import { ProgramList } from "@/components/checkout/ProgramList";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export interface Program {
  id: string;
  type: string;
  name: string;
  duration: string;
  price: number;
  originalPrice?: number;
  tags: string[];
  thumbnail?: string;
}

const Checkout = () => {
  const { items, addItem, removeItem, clearCart, isInCart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [programType, setProgramType] = useState("all");
  const [subject, setSubject] = useState("all");
  const [activeTab, setActiveTab] = useState<"single" | "combo">("single");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);

    // Fetch lessons from database
    const { data: lessonsData, error: lessonsError } = await supabase
      .from("lessons")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (lessonsError) {
      console.error("Error fetching lessons:", lessonsError);
      setLoading(false);
      return;
    }

    // Transform lessons to Program format
    const lessonPrograms: Program[] = (lessonsData || []).map((lesson) => ({
      id: lesson.program_id || lesson.id,
      type: "Bài học",
      name: lesson.title,
      duration: lesson.duration || "365 ngày",
      price: lesson.price || 0,
      originalPrice: lesson.original_price || undefined,
      tags: lesson.badge ? [lesson.badge] : [],
      thumbnail: lesson.thumbnail_url || undefined,
    }));

    setPrograms(lessonPrograms);
    setLoading(false);
  };

  const handleAddToCart = (program: Program) => {
    addItem({
      id: program.id,
      type: program.type,
      name: program.name,
      duration: program.duration,
      price: program.price,
    });
  };

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch = program.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      programType === "all" || program.type === programType;
    const matchesTab =
      activeTab === "combo"
        ? program.type === "Combo"
        : program.type !== "Combo";
    return matchesSearch && matchesType && matchesTab;
  });

  const totalPrograms = programs.length;
  const displayedPrograms = filteredPrograms.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Mua Chương Trình
          </h1>
          <p className="text-muted-foreground">
            Chọn chương trình bạn muốn mua và điền thông tin thanh toán
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <FilterSection
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              programType={programType}
              onProgramTypeChange={setProgramType}
              subject={subject}
              onSubjectChange={setSubject}
              totalPrograms={totalPrograms}
              displayedPrograms={displayedPrograms}
            />

            <ProgramList
              programs={filteredPrograms}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onAddToCart={handleAddToCart}
              isInCart={isInCart}
            />
          </div>

          <div className="lg:col-span-1">
            <CartSidebar
              items={items}
              onRemoveItem={removeItem}
              onClearCart={clearCart}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
