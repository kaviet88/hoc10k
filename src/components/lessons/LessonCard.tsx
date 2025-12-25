import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Clock, Eye, MessageSquare } from "lucide-react";

interface LessonCardProps {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  price: number;
  duration: string;
  viewCount?: number;
  commentCount?: number;
  badge?: string;
  badgeColor?: "primary" | "success" | "secondary" | "accent";
  isPurchased: boolean;
}

const badgeStyles = {
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/20",
  secondary: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  accent: "bg-accent/10 text-accent border-accent/20",
};

export function LessonCard({
  id,
  title,
  description,
  thumbnail,
  price,
  duration,
  viewCount = 0,
  commentCount = 0,
  badge,
  badgeColor = "primary",
  isPurchased,
}: LessonCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ";
  };

  return (
    <Card className="group overflow-hidden shadow-card hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-video overflow-hidden">
        <img
          src={thumbnail || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400"}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Lock Overlay for unpurchased courses */}
        {!isPurchased && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-sm font-medium">Cần mua gói học</span>
          </div>
        )}
        
        {/* Published Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-success text-success-foreground text-xs">
            Đã xuất bản
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        {/* Price Badge */}
        <Badge 
          variant="outline" 
          className="mb-3 bg-primary/10 text-primary border-primary/20"
        >
          Từ {formatPrice(price)}
        </Badge>
        
        {/* Title */}
        <h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {description}
          </p>
        )}
        
        {/* Subject Badge */}
        {badge && (
          <Badge 
            variant="outline" 
            className={`mb-3 text-xs ${badgeStyles[badgeColor]}`}
          >
            {badge}
          </Badge>
        )}
        
        {/* Meta Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{viewCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>{commentCount}</span>
          </div>
        </div>
        
        {/* Action Button */}
        <div className="mt-4">
          {isPurchased ? (
            <Link to={`/lessons/${id}`}>
              <Button className="w-full" size="sm">
                Vào học
              </Button>
            </Link>
          ) : (
            <Link to="/purchase">
              <Button variant="outline" className="w-full" size="sm">
                Mua khóa học
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
