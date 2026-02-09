import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl hover:bg-secondary/60 border-0 transition-all duration-200 hover:scale-105"
          aria-label="Changer le thème"
        >
          <div className="relative h-4 w-4">
            <Sun 
              className={cn(
                "h-4 w-4 absolute inset-0 transition-all duration-300",
                theme === "light" 
                  ? "opacity-100 rotate-0 scale-100" 
                  : "opacity-0 rotate-90 scale-0"
              )} 
            />
            <Moon 
              className={cn(
                "h-4 w-4 absolute inset-0 transition-all duration-300",
                theme === "dark" 
                  ? "opacity-100 rotate-0 scale-100" 
                  : "opacity-0 -rotate-90 scale-0"
              )} 
            />
            <Monitor 
              className={cn(
                "h-4 w-4 absolute inset-0 transition-all duration-300",
                theme === "system" 
                  ? "opacity-100 rotate-0 scale-100" 
                  : "opacity-0 rotate-90 scale-0"
              )} 
            />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        side="bottom"
        className="theme-dropdown-no-anim w-40 border-border/40 bg-card/95 backdrop-blur-xl rounded-xl shadow-xl"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn(
            "flex items-center gap-2 cursor-pointer rounded-lg transition-colors",
            theme === "light" && "bg-primary/10 text-primary font-medium"
          )}
        >
          <Sun className="h-4 w-4" />
          <span>Clair</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn(
            "flex items-center gap-2 cursor-pointer rounded-lg transition-colors",
            theme === "dark" && "bg-primary/10 text-primary font-medium"
          )}
        >
          <Moon className="h-4 w-4" />
          <span>Sombre</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn(
            "flex items-center gap-2 cursor-pointer rounded-lg transition-colors",
            theme === "system" && "bg-primary/10 text-primary font-medium"
          )}
        >
          <Monitor className="h-4 w-4" />
          <span>Système</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
