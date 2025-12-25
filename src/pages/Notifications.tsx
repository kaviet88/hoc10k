import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Bell,
  Trophy,
  Gift,
  Info,
  Calendar,
  CheckCheck,
  Trash2,
  ChevronLeft,
  BellOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "achievement":
        return <Trophy className="w-5 h-5 text-amber-500" />;
      case "reward":
        return <Gift className="w-5 h-5 text-success" />;
      case "reminder":
        return <Calendar className="w-5 h-5 text-primary" />;
      default:
        return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "achievement":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">Thành tích</Badge>;
      case "reward":
        return <Badge className="bg-success/10 text-success border-success/30">Phần thưởng</Badge>;
      case "reminder":
        return <Badge className="bg-primary/10 text-primary border-primary/30">Nhắc nhở</Badge>;
      default:
        return <Badge variant="outline">Hệ thống</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString("vi-VN", { 
      day: "numeric", 
      month: "numeric", 
      year: "numeric" 
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map(n => n.id)));
    }
  };

  const markAsRead = async (ids: string[]) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", ids);

    if (error) {
      toast.error("Có lỗi xảy ra");
    } else {
      setNotifications(prev => 
        prev.map(n => ids.includes(n.id) ? { ...n, is_read: true } : n)
      );
      setSelectedIds(new Set());
      toast.success("Đã đánh dấu đã đọc");
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await markAsRead(unreadIds);
  };

  const deleteNotifications = async (ids: string[]) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .in("id", ids);

    if (error) {
      toast.error("Có lỗi xảy ra");
    } else {
      setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
      setSelectedIds(new Set());
      toast.success("Đã xóa thông báo");
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead([notification.id]);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Thông báo</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 
                  ? `Bạn có ${unreadCount} thông báo chưa đọc` 
                  : "Tất cả thông báo đã được đọc"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => markAsRead(Array.from(selectedIds))}
                  className="gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  Đánh dấu đã đọc ({selectedIds.size})
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => deleteNotifications(Array.from(selectedIds))}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa ({selectedIds.size})
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          {loading ? (
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="p-4 flex gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <>
              {/* Select All Header */}
              <div className="p-3 bg-muted/30 border-b flex items-center gap-3">
                <Checkbox 
                  checked={selectedIds.size === notifications.length && notifications.length > 0}
                  onCheckedChange={selectAll}
                />
                <span className="text-sm text-muted-foreground">
                  Chọn tất cả ({notifications.length})
                </span>
              </div>

              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 flex items-start gap-4 transition-colors ${
                      !notification.is_read 
                        ? "bg-primary/5 hover:bg-primary/10" 
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <Checkbox 
                      checked={selectedIds.has(notification.id)}
                      onCheckedChange={() => toggleSelect(notification.id)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className="flex-1 flex items-start gap-4 text-left"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        !notification.is_read ? "bg-primary/10" : "bg-muted"
                      }`}>
                        {getTypeIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-medium ${
                                !notification.is_read ? "text-foreground" : "text-muted-foreground"
                              }`}>
                                {notification.title}
                              </h3>
                              {!notification.is_read && (
                                <span className="w-2 h-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(notification.created_at)}
                            </p>
                            <div className="mt-1">
                              {getTypeBadge(notification.type)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-16 text-center">
              <BellOff className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Không có thông báo
              </h3>
              <p className="text-muted-foreground">
                Bạn sẽ nhận được thông báo khi có hoạt động mới
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
