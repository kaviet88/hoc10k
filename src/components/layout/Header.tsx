import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  FileText, 
  GraduationCap, 
  Home, 
  Menu, 
  ShoppingCart, 
  Gamepad2, 
  Bell,
  User,
  ChevronDown,
  Search,
  X,
  LogOut,
  History,
  LayoutDashboard
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { icon: Home, label: "Trang chủ", href: "/" },
  { icon: BookOpen, label: "Bài học", href: "/lessons" },
  { icon: GraduationCap, label: "Luyện thi", href: "/practice" },
  { icon: FileText, label: "Tài liệu", href: "/documents" },
  { icon: FileText, label: "Thi thử", href: "/exams" },
  { icon: ShoppingCart, label: "Mua chương trình", href: "/purchase", showBadge: true },
  { icon: Gamepad2, label: "Trò chơi", href: "/games" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { itemCount } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getUserDisplayName = () => {
    if (!user) return "";
    return user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-card">
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary">
              <span className="text-xl font-bold text-primary-foreground">📚</span>
            </div>
            <span className="text-xl font-bold text-primary hidden sm:block">Học 10k</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href}>
                <Button variant="nav" size="sm" className="gap-1.5 relative">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {item.showBadge && itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:flex items-center">
              {searchOpen ? (
                <div className="flex items-center gap-2 animate-fade-in">
                  <Input 
                    placeholder="Tìm kiếm..." 
                    className="w-48 h-9"
                    autoFocus
                  />
                  <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
                  <Search className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </Button>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                      <User className="w-3 h-3 text-accent-foreground" />
                    </div>
                    <span className="max-w-24 truncate">{getUserDisplayName()}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Quản lý học tập
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/purchase-history")}>
                    <History className="w-4 h-4 mr-2" />
                    Lịch sử mua hàng
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" className="gap-2 hidden sm:flex" onClick={() => navigate("/auth")}>
                <User className="w-4 h-4" />
                Đăng nhập
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 px-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start gap-2 relative">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {item.showBadge && itemCount > 0 && (
                      <span className="ml-auto w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                        {itemCount > 99 ? "99+" : itemCount}
                      </span>
                    )}
                  </Button>
                </Link>
              ))}
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Quản lý học tập
                    </Button>
                  </Link>
                  <Link to="/purchase-history" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <History className="w-4 h-4" />
                      Lịch sử mua hàng
                    </Button>
                  </Link>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <User className="w-4 h-4" />
                    Đăng nhập
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
