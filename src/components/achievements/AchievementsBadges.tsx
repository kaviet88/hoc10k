import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Award } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_value: number;
  points_reward: number;
}

interface UserAchievement {
  achievement_id: string;
  earned_at: string;
}

interface AchievementsBadgesProps {
  userId: string;
  currentStreak: number;
  totalPoints: number;
  onAchievementEarned?: (points: number) => void;
}

export function AchievementsBadges({
  userId,
  currentStreak,
  totalPoints,
  onAchievementEarned,
}: AchievementsBadgesProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, [userId]);

  useEffect(() => {
    if (achievements.length > 0) {
      checkAndAwardAchievements();
    }
  }, [currentStreak, totalPoints, achievements]);

  const fetchAchievements = async () => {
    const [achievementsRes, userAchievementsRes] = await Promise.all([
      supabase.from("achievements").select("*").order("requirement_value"),
      supabase.from("user_achievements").select("*").eq("user_id", userId),
    ]);

    if (achievementsRes.data) {
      setAchievements(achievementsRes.data);
    }
    if (userAchievementsRes.data) {
      setUserAchievements(userAchievementsRes.data);
    }
    setLoading(false);
  };

  const checkAndAwardAchievements = async () => {
    const earnedIds = new Set(userAchievements.map((ua) => ua.achievement_id));
    let totalPointsAwarded = 0;

    for (const achievement of achievements) {
      if (earnedIds.has(achievement.id)) continue;

      let qualified = false;

      if (achievement.category === "streak") {
        qualified = currentStreak >= achievement.requirement_value;
      } else if (achievement.category === "points") {
        qualified = totalPoints >= achievement.requirement_value;
      }

      if (qualified) {
        const { error } = await supabase.from("user_achievements").insert({
          user_id: userId,
          achievement_id: achievement.id,
        });

        if (!error) {
          setUserAchievements((prev) => [
            ...prev,
            { achievement_id: achievement.id, earned_at: new Date().toISOString() },
          ]);
          totalPointsAwarded += achievement.points_reward;
        }
      }
    }

    if (totalPointsAwarded > 0 && onAchievementEarned) {
      onAchievementEarned(totalPointsAwarded);
    }
  };

  const isEarned = (achievementId: string) => {
    return userAchievements.some((ua) => ua.achievement_id === achievementId);
  };

  const getProgress = (achievement: Achievement) => {
    if (achievement.category === "streak") {
      return Math.min((currentStreak / achievement.requirement_value) * 100, 100);
    }
    if (achievement.category === "points") {
      return Math.min((totalPoints / achievement.requirement_value) * 100, 100);
    }
    return 0;
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "streak":
        return "Chuỗi đăng nhập";
      case "lessons":
        return "Bài học";
      case "points":
        return "Điểm số";
      case "special":
        return "Đặc biệt";
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const earnedCount = userAchievements.length;
  const totalCount = achievements.length;

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  return (
    <Card className="shadow-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Thành tựu</h2>
          </div>
          <Badge variant="secondary">
            {earnedCount}/{totalCount}
          </Badge>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {getCategoryLabel(category)}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {categoryAchievements.map((achievement) => {
                  const earned = isEarned(achievement.id);
                  const progress = getProgress(achievement);

                  return (
                    <div
                      key={achievement.id}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        earned
                          ? "border-primary bg-primary/5"
                          : "border-border bg-muted/30"
                      }`}
                    >
                      <div
                        className={`text-3xl mb-2 ${
                          earned ? "" : "grayscale opacity-50"
                        }`}
                      >
                        {achievement.icon}
                      </div>
                      <div
                        className={`font-semibold text-sm ${
                          earned ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {achievement.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {achievement.description}
                      </div>
                      {!earned && progress > 0 && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/50 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {Math.round(progress)}%
                          </div>
                        </div>
                      )}
                      {earned && achievement.points_reward > 0 && (
                        <Badge
                          variant="outline"
                          className="mt-2 text-xs border-primary text-primary"
                        >
                          +{achievement.points_reward} điểm
                        </Badge>
                      )}
                      {earned && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
