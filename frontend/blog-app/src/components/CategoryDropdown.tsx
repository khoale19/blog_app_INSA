import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import * as api from "@/lib/api"
import { Input } from "@/components/ui/input"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CategoryDropdownProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  onOpenChange?: (open: boolean) => void
}

export function CategoryDropdown({ value, onChange, placeholder = "Catégorie", className, onOpenChange }: CategoryDropdownProps) {
  const [categories, setCategories] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const onOpenChangeRef = useRef(onOpenChange)

  // Keep the ref updated with the latest callback without triggering effect re-runs
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  })

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("click", handleClickOutside)
      updatePosition()
      onOpenChangeRef.current?.(true)
    } else {
      onOpenChangeRef.current?.(false)
    }
    return () => document.removeEventListener("click", handleClickOutside)
  }, [open])

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + 8, // 8px = mt-2 equivalent
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }

  useEffect(() => {
    if (open) {
      updatePosition()
      const handleResize = () => updatePosition()
      const handleScroll = () => updatePosition()
      window.addEventListener("resize", handleResize)
      window.addEventListener("scroll", handleScroll, true)
      return () => {
        window.removeEventListener("resize", handleResize)
        window.removeEventListener("scroll", handleScroll, true)
      }
    }
  }, [open])

  const filtered = search.trim()
    ? categories.filter((c) => c.toLowerCase().includes(search.toLowerCase().trim()))
    : categories

  const dropdownContent = open && (
    <ul
      ref={dropdownRef}
      data-category-dropdown="true"
      className="fixed z-[9999] max-h-48 w-[160px] overflow-auto rounded-xl border border-border/40 bg-card/95 backdrop-blur-xl py-1.5 shadow-xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
      }}
    >
      <li>
        <button
          type="button"
          className="w-full px-3 py-2 text-left text-sm hover:bg-secondary/60 rounded-lg transition-colors mx-1"
          onClick={() => {
            onChange("")
            setSearch("")
            setOpen(false)
          }}
        >
          <span className="text-muted-foreground/80">Toutes</span>
        </button>
      </li>
      {filtered.map((cat) => (
        <li key={cat}>
          <button
            type="button"
            className={cn(
              "w-full px-3 py-2 text-left text-sm hover:bg-secondary/60 rounded-lg transition-colors mx-1",
              value === cat && "bg-primary/10 text-primary font-semibold"
            )}
            onClick={() => {
              onChange(cat)
              setSearch("")
              setOpen(false)
            }}
          >
            {cat}
          </button>
        </li>
      ))}
      {filtered.length === 0 && (
        <li className="px-3 py-2 text-sm text-muted-foreground/70">Aucune catégorie</li>
      )}
    </ul>
  )

  return (
    <>
      <div className={cn("relative", className)} ref={containerRef}>
        <div className="relative">
          <Input
            placeholder={placeholder}
            value={open ? search : value}
            onChange={(e) => {
              setSearch(e.target.value)
              if (!open) setOpen(true)
              if (!e.target.value) onChange("")
            }}
            onFocus={() => setOpen(true)}
            className="h-10 w-[130px] pr-8 border-border/40 bg-secondary/60 hover:bg-secondary/80 text-foreground rounded-xl text-sm"
          />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")} />
          </button>
        </div>
      </div>
      {typeof document !== "undefined" && createPortal(dropdownContent, document.body)}
    </>
  )
}
