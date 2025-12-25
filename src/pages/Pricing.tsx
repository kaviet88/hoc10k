import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { BookOpen, Lightbulb, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const programs = [
  {
    id: 1,
    icon: BookOpen,
    iconBg: "bg-primary",
    title: "Lộ Trình Học Tiếng Anh Cho Trẻ Từ 2 Tuổi",
    description: "Chương trình học tiếng Anh được thiết kế đặc biệt cho trẻ mầm non, kết hợp giữa học tập và vui chơi để tạo nền tảng vững chắc.",
    features: [
      { text: "Học qua video, audio tương tác", color: "bg-primary" },
      { text: "Phát triển kỹ năng nghe và nói tự nhiên", color: "bg-amber-500" },
      { text: "Bài tập đơn giản dễ hiểu, giúp bé nhớ lâu", color: "bg-rose-500" },
    ],
    price: "10k/tháng",
    buttonGradient: "from-primary to-primary/80",
  },
  {
    id: 2,
    icon: Lightbulb,
    iconBg: "bg-amber-500",
    title: "Lộ Trình Học Tiếng Trung Cho Trẻ Từ 5 Tuổi",
    description: "Chương trình học tiếng Trung cơ bản dành cho trẻ tiểu học, tập trung vào việc phát triển toàn diện kỹ năng ngôn ngữ qua video, audio, flashcard.",
    features: [
      { text: "Lộ trình được thiết kế theo từng ngày học", color: "bg-success" },
      { text: "Rèn luyện kỹ năng đọc và viết, đọc sách và nghe bài hát", color: "bg-amber-500" },
      { text: "Hiểu ngữ pháp và cấu trúc cơ bản", color: "bg-primary" },
    ],
    price: "10k/tháng",
    buttonGradient: "from-success to-emerald-400",
  },
];

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Chương Trình Tiêu Biểu Của Chúng Tôi
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Khám phá các lộ trình học tiếng Anh, tiếng Trung được thiết kế đặc biệt cho từng giai đoạn, giúp trẻ phát triển toàn diện các kỹ năng ngôn ngữ.
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {programs.map((program) => (
            <div
              key={program.id}
              className="bg-card rounded-2xl p-6 shadow-card border border-border relative overflow-hidden"
            >
              {/* Decorative circle */}
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-muted/50 opacity-50" />
              
              {/* Icon */}
              <div className={`w-16 h-16 ${program.iconBg} rounded-xl flex items-center justify-center mb-6`}>
                <program.icon className="w-8 h-8 text-white" />
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-foreground mb-3">
                {program.title}
              </h2>

              {/* Description */}
              <p className="text-muted-foreground text-sm mb-6">
                {program.description}
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {program.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className={`w-2 h-2 rounded-full ${feature.color} mt-2 flex-shrink-0`} />
                    <span className="text-sm text-foreground">{feature.text}</span>
                  </li>
                ))}
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">
                    Bắt đầu từ <strong>{program.price}</strong>
                  </span>
                </li>
              </ul>

              {/* CTA Button */}
              <Button
                onClick={() => navigate("/purchase")}
                className={`w-full bg-gradient-to-r ${program.buttonGradient} hover:opacity-90 text-white font-semibold py-6`}
              >
                Mua Ngay
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Pricing;
