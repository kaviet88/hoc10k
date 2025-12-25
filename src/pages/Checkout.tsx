import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { CartSidebar } from "@/components/checkout/CartSidebar";
import { FilterSection } from "@/components/checkout/FilterSection";
import { ProgramList } from "@/components/checkout/ProgramList";

export interface CartItem {
  id: string;
  type: string;
  name: string;
  duration: string;
  price: number;
  addedDate: string;
}

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

const mockPrograms: Program[] = [
  {
    id: "1",
    type: "Bài học",
    name: "Tiếng Anh Movers 360 ngày",
    duration: "365 ngày",
    price: 590000,
    tags: ["Phổ biến", "Khuyến nghị"],
  },
  {
    id: "2",
    type: "Bài học",
    name: "Toán Tư Duy Lớp 1",
    duration: "180 ngày",
    price: 390000,
    originalPrice: 450000,
    tags: ["Mới"],
  },
  {
    id: "3",
    type: "Bài học",
    name: "Tiếng Việt Nâng Cao Lớp 2",
    duration: "365 ngày",
    price: 490000,
    tags: ["Phổ biến"],
  },
  {
    id: "4",
    type: "Combo",
    name: "Combo Toán + Tiếng Việt Lớp 3",
    duration: "365 ngày",
    price: 890000,
    originalPrice: 1100000,
    tags: ["Tiết kiệm", "Khuyến nghị"],
  },
];

const Checkout = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [programType, setProgramType] = useState("all");
  const [subject, setSubject] = useState("all");
  const [activeTab, setActiveTab] = useState<"single" | "combo">("single");

  const addToCart = (program: Program) => {
    if (cartItems.find((item) => item.id === program.id)) return;
    
    const newItem: CartItem = {
      id: program.id,
      type: program.type,
      name: program.name,
      duration: program.duration,
      price: program.price,
      addedDate: new Date().toLocaleDateString("vi-VN"),
    };
    setCartItems([...cartItems, newItem]);
  };

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const filteredPrograms = mockPrograms.filter((program) => {
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

  const totalPrograms = mockPrograms.length;
  const displayedPrograms = filteredPrograms.length;

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
              onAddToCart={addToCart}
              cartItems={cartItems}
            />
          </div>

          <div className="lg:col-span-1">
            <CartSidebar
              items={cartItems}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
