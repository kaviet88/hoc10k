import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Users, Clock } from "lucide-react";

interface ExamCardProps {
  id: string;
  title: string;
  thumbnail: string;
  examCount: number;
  participantCount?: number;
  duration?: string;
  isPremium?: boolean;
  badge?: string;
  badgeColor?: "primary" | "secondary" | "accent" | "success";
}

export function ExamCard({ 
  id,
  title,
  thumbnail, 
  examCount, 
  participantCount, 
  duration,
  isPremium = false,
  badge,
  badgeColor = "primary"
}: ExamCardProps) {
  const badgeColorClasses = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    accent: "bg-accent text-accent-foreground",
    success: "bg-success text-success-foreground",
  };

  return (
    <div className="group bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={thumbnail} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Premium Badge */}
        {isPremium && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-secondary text-secondary-foreground font-semibold shadow-sm">
              Có thể ôn luyện
            </Badge>
          </div>
        )}

        {/* Category Badge */}
        {badge && (
          <div className="absolute top-2 right-2">
            <Badge className={`${badgeColorClasses[badgeColor]} font-semibold shadow-sm`}>
              {badge}
            </Badge>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors min-h-[48px]">
          {title}
        </h3>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>{examCount} đề thi</span>
          </div>
          {participantCount !== undefined && participantCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{participantCount.toLocaleString()}</span>
            </div>
          )}
          {duration && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{duration}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Link to={`/practice/${id}`}>
          <Button variant="gradient" size="sm" className="w-full">
            Làm bài ngay
          </Button>
        </Link>
      </div>
    </div>
  );
}
