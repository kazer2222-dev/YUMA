import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface User {
  name: string;
  avatar?: string;
  initials: string;
  role?: string;
  color?: string;
}

interface CollaborationAvatarsProps {
  users: User[];
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

export function CollaborationAvatars({ 
  users, 
  maxVisible = 5,
  size = "md" 
}: CollaborationAvatarsProps) {
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  return (
    <TooltipProvider>
      <div className="flex -space-x-2">
        {visibleUsers.map((user, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Avatar 
                className={`${sizeMap[size]} border-2 border-background cursor-pointer hover:z-10 transition-transform hover:scale-110`}
                style={user.color ? { borderColor: user.color } : {}}
              >
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback className="text-xs">{user.initials}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p>{user.name}</p>
                {user.role && (
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className={`${sizeMap[size]} border-2 border-background bg-muted cursor-pointer`}>
                <AvatarFallback className="text-xs">+{remainingCount}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{remainingCount} more member{remainingCount !== 1 ? 's' : ''}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
