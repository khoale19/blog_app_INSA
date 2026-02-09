import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import * as api from "@/lib/api"
import type { Article } from "@/types"
import { ArticleCard } from "@/components/ArticleCard"
import { CategoryDropdown } from "@/components/CategoryDropdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, ChevronDown, ChevronUp, X } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

type SortOption = "date" | "popularity" | "title"

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, 4, "ellipsis", total]
  if (current >= total - 2) return [1, "ellipsis", total - 3, total - 2, total - 1, total]
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total]
}

export function HomePage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const authorIdParam = searchParams.get("authorId")
  const initialAuthorId = authorIdParam ? parseInt(authorIdParam, 10) : undefined
  const validAuthorId = initialAuthorId !== undefined && !Number.isNaN(initialAuthorId) ? initialAuthorId : undefined

  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [sort, setSort] = useState<SortOption>("date")
  const [order, setOrder] = useState<"asc" | "desc">("desc")
  const [keyword, setKeyword] = useState("")
  const [keywordInput, setKeywordInput] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState("")
  const [authorId, setAuthorId] = useState<number | undefined>(validAuthorId)
  const [publishedOnly, setPublishedOnly] = useState(true)
  const [featured, setFeatured] = useState<boolean | undefined>(undefined)
  const [pinned, setPinned] = useState<boolean | undefined>(undefined)
  const [data, setData] = useState<api.Page<Article> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(true) // Start open when near top
  const [isCollapsed, setIsCollapsed] = useState(false) // Track if search bar should be collapsed
  const lastScrollY = useRef(0)
  const ignoreScrollUntil = useRef(0)
  const userOpenedFiltersAt = useRef<number | null>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHoveringRef = useRef(false)
  const isSearchFocusedRef = useRef(false)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const articlesGridRef = useRef<HTMLUListElement | null>(null)
  const isAnyComponentActiveRef = useRef(false) // Track if any component in search bar is active
  const searchBarRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setAuthorId(validAuthorId)
  }, [validAuthorId])

  // Synchroniser keywordInput avec keyword pour afficher la recherche actuelle (style Google)
  useEffect(() => {
    setKeywordInput(keyword)
  }, [keyword])

  // Ouvrir automatiquement près du haut, replier au scroll vers le bas, gérer le hover
  // Collapse based on article cards position instead of fixed scroll thresholds
  useEffect(() => {
    const SCROLL_DELTA = 25

    const handleScroll = () => {
      const now = Date.now()
      if (now < ignoreScrollUntil.current) {
        const scrollContainer = document.querySelector('main') || window
        const scrollY = scrollContainer === window ? window.scrollY : (scrollContainer as HTMLElement).scrollTop
        lastScrollY.current = scrollY
        return
      }

      // Get scroll position from main element or window
      const scrollContainer = document.querySelector('main') || window
      const y = scrollContainer === window ? window.scrollY : (scrollContainer as HTMLElement).scrollTop
      const prev = lastScrollY.current
      const scrollingDown = y > prev
      const delta = y - prev

      lastScrollY.current = y

      // PRIORITY: Never collapse if any component is active (user is interacting)
      // This check must come first - if user is choosing from dropdown or typing, don't collapse
      if (isAnyComponentActiveRef.current) {
        // Keep search bar open and expanded while component is active
        setIsCollapsed(false)
        setFiltersOpen(true)
        return // Don't run any collapse logic while component is active
      }

      // Ne pas changer l'état si on survole le filtre
      if (isHoveringRef.current) {
        return
      }

      // Check article grid position instead of fixed thresholds
      const articlesGrid = articlesGridRef.current
      if (articlesGrid) {
        const gridRect = articlesGrid.getBoundingClientRect()
        const gridTop = gridRect.top
        const collapseThreshold = 200 // Collapse when grid top is 200px from viewport top

        // PRIORITY: Always open when at the very top of the page
        if (y === 0 || y <= 50) {
          setIsCollapsed(false)
          setFiltersOpen(true)
          ignoreScrollUntil.current = now + 200
          return
        }

        // Collapse/expand based on article grid position
        // Only collapse if no component is active (checked above)
        if (gridTop <= collapseThreshold) {
          // Article cards are close to or above the threshold - collapse search bar
          if (scrollingDown) {
            setIsCollapsed(true)
          }
        } else {
          // Article cards are below threshold - expand search bar
          setIsCollapsed(false)
          // Open filters when grid is still far from threshold
          if (gridTop > collapseThreshold + 100) {
            setFiltersOpen(true)
          }
        }

        // Ne pas replier si l'utilisateur vient d'ouvrir manuellement (2 s de protection)
        if (userOpenedFiltersAt.current != null) {
          if (now - userOpenedFiltersAt.current < 2000) {
            return
          }
          userOpenedFiltersAt.current = null
        }

        // Replier seulement les filtres avancés si on scroll vers le bas assez loin
        // Only if no component is active (checked above)
        if (scrollingDown && delta >= SCROLL_DELTA && gridTop <= collapseThreshold) {
          setFiltersOpen((open) => {
            if (open) {
              ignoreScrollUntil.current = now + 350
              return false
            }
            return open
          })
        }
      } else {
        // Fallback to scroll-based logic if grid not found
        const TOP_THRESHOLD = 100
        if (y <= TOP_THRESHOLD || y === 0) {
          setIsCollapsed(false)
          setFiltersOpen(true)
          ignoreScrollUntil.current = now + 200
          return
        }
        // Only collapse if no component is active (checked above)
        if (scrollingDown && y > 150) {
          setIsCollapsed(true)
        }
      }
    }

    // Also check when scrolling stops (scroll end)
    const handleScrollEnd = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = setTimeout(() => {
        // Never collapse if any component is still active
        if (isAnyComponentActiveRef.current) {
          setIsCollapsed(false)
          setFiltersOpen(true)
          return
        }

        const scrollContainer = document.querySelector('main') || window
        const scrollY = scrollContainer === window ? window.scrollY : (scrollContainer as HTMLElement).scrollTop
        
        // Check article grid position
        const articlesGrid = articlesGridRef.current
        if (articlesGrid) {
          const gridRect = articlesGrid.getBoundingClientRect()
          const gridTop = gridRect.top
          if (gridTop > 200 || scrollY <= 50) {
            setIsCollapsed(false)
            setFiltersOpen(true)
          }
        } else if (scrollY <= 100) {
          setIsCollapsed(false)
          setFiltersOpen(true)
        }
      }, 150)
    }

    // Listen to both window and main element scroll
    const mainElement = document.querySelector('main')
    if (mainElement) {
      mainElement.addEventListener("scroll", handleScroll, { passive: true })
      mainElement.addEventListener("scroll", handleScrollEnd, { passive: true })
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("scroll", handleScrollEnd, { passive: true })
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      if (mainElement) {
        mainElement.removeEventListener("scroll", handleScroll)
        mainElement.removeEventListener("scroll", handleScrollEnd)
      }
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("scroll", handleScrollEnd)
    }
  }, [])

  // Vérifier la position au chargement et après changement de page
  useEffect(() => {
    const scrollContainer = document.querySelector('main') || window
    const scrollY = scrollContainer === window ? window.scrollY : (scrollContainer as HTMLElement).scrollTop
    
    // Check article grid position
    const articlesGrid = articlesGridRef.current
    if (articlesGrid) {
      const gridRect = articlesGrid.getBoundingClientRect()
      const gridTop = gridRect.top
      if (gridTop > 200 || scrollY <= 50) {
        setFiltersOpen(true)
        setIsCollapsed(false)
      } else {
        setIsCollapsed(true)
        setFiltersOpen(false)
      }
    } else {
      // Fallback
      if (scrollY <= 100) {
        setFiltersOpen(true)
        setIsCollapsed(false)
      } else {
        setIsCollapsed(true)
        setFiltersOpen(false)
      }
    }
  }, [page])

  // Ensure search bar opens when at top - check on mount and when articles load
  useEffect(() => {
    const checkPosition = () => {
      const scrollContainer = document.querySelector('main') || window
      const scrollY = scrollContainer === window ? window.scrollY : (scrollContainer as HTMLElement).scrollTop
      
      // Check article grid position if available
      const articlesGrid = articlesGridRef.current
      if (articlesGrid) {
        const gridRect = articlesGrid.getBoundingClientRect()
        const gridTop = gridRect.top
        if (gridTop > 200 || scrollY <= 50) {
          setIsCollapsed(false)
          setFiltersOpen(true)
        }
      } else if (scrollY <= 100) {
        setIsCollapsed(false)
        setFiltersOpen(true)
      }
    }
    
    // Check immediately on mount and after data loads
    checkPosition()
    
    // Also check after a short delay to ensure DOM is ready
    const timeout = setTimeout(checkPosition, 100)
    return () => clearTimeout(timeout)
  }, [data])

  // Track clicks outside search bar to reset active state
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (searchBarRef.current && !searchBarRef.current.contains(target)) {
        // Check if click is on a dropdown portal (CategoryDropdown or Radix UI components)
        const isDropdownClick = (target as Element).closest('[data-radix-portal]') || 
                               (target as Element).closest('[role="listbox"]') ||
                               (target as Element).closest('[data-radix-popper-content-wrapper]') ||
                               (target as Element).closest('[data-category-dropdown="true"]')
        
        if (!isDropdownClick) {
          // Small delay to allow dropdowns to handle their own clicks
          setTimeout(() => {
            const activeElement = document.activeElement
            if (!searchBarRef.current?.contains(activeElement)) {
              isAnyComponentActiveRef.current = false
            }
          }, 50)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Nettoyer les timeouts au démontage
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")
    api
      .getArticles({
        page,
        size,
        sort,
        order,
        keyword: keyword || undefined,
        category: category || undefined,
        tags: tags || undefined,
        authorId,
        publishedOnly,
        featured,
        pinned,
      })
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Échec du chargement")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [page, size, sort, order, keyword, category, tags, authorId, publishedOnly, featured, pinned, user])

  const totalPages = data?.totalPages ?? 0
  const pageNumbers = getPageNumbers(page + 1, totalPages)

  const handleClearFilters = () => {
    setKeyword("")
    setKeywordInput("")
    setCategory("")
    setTags("")
    setSort("date")
    setOrder("desc")
    setPublishedOnly(true)
    setFeatured(undefined)
    setPinned(undefined)
    setPage(0)
    // Ne pas réinitialiser authorId si on est sur une page de profil (depuis URL)
    if (!validAuthorId) {
      setAuthorId(undefined)
    }
  }

  const hasActiveFilters = keyword || category || tags || sort !== "date" || order !== "desc" || featured !== undefined || pinned !== undefined || (user && !publishedOnly) || (validAuthorId === undefined && authorId !== undefined)

  return (
    <>
      {/* Search bar - collapses and fixes at top when scrolling (Google style) */}
      <div
        ref={searchBarRef}
        className="sticky top-0 z-50 mb-6 transition-all duration-700 ease-out bg-card/80 backdrop-blur-xl shadow-lg"
        style={{ 
          position: 'sticky',
          top: 0,
          zIndex: 50,
          width: '100%'
        }}
        onMouseEnter={() => {
          if (isCollapsed) {
            setIsCollapsed(false)
            setFiltersOpen(true)
          }
          isHoveringRef.current = true
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
            hoverTimeoutRef.current = null
          }
          setFiltersOpen(true)
        }}
        onMouseLeave={() => {
          isHoveringRef.current = false
          // Never collapse if any component is active, even when mouse leaves
          if (isAnyComponentActiveRef.current) {
            // Clear any pending collapse timeout
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current)
              hoverTimeoutRef.current = null
            }
            return // Don't set up collapse timeout if component is active
          }
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
          }
          hoverTimeoutRef.current = setTimeout(() => {
            // Double-check that no component became active during the timeout
            if (!isHoveringRef.current && !isSearchFocusedRef.current && !isAnyComponentActiveRef.current) {
              setFiltersOpen(false)
              setIsCollapsed(true)
            }
            hoverTimeoutRef.current = null
          }, 400)
        }}
        onFocus={(e: React.FocusEvent<HTMLDivElement>) => {
          // Check if focus is within the search bar
          if (searchBarRef.current && searchBarRef.current.contains(e.target as Node)) {
            isAnyComponentActiveRef.current = true
            setIsCollapsed(false)
            setFiltersOpen(true)
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current)
              hoverTimeoutRef.current = null
            }
          }
        }}
        onBlur={(e: React.FocusEvent<HTMLDivElement>) => {
          // Check if focus moved outside the search bar
          if (searchBarRef.current && !searchBarRef.current.contains(e.relatedTarget as Node)) {
            // Delay to allow dropdowns to handle focus
            setTimeout(() => {
              const activeElement = document.activeElement
              if (!searchBarRef.current || !searchBarRef.current.contains(activeElement)) {
                isAnyComponentActiveRef.current = false
              }
            }, 100)
          }
        }}
      >
        <section
          className={cn(
            "rounded-2xl border border-border/40 bg-card/90 backdrop-blur-xl shadow-xl overflow-hidden transition-all duration-500 ease-out",
            isCollapsed ? "px-4 py-3" : "px-6 py-5"
          )}
          style={{ 
            minHeight: isCollapsed ? 68 : 'auto',
            transitionProperty: 'min-height, padding',
            transitionDuration: '500ms',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Always visible: Search bar - compact when collapsed */}
          <div className={cn(
            "flex items-center gap-3 transition-all duration-500 ease-out",
            isCollapsed ? "py-2.5" : "py-2 gap-4"
          )}>
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70 z-10 pointer-events-none" />
              <Input
                placeholder="Rechercher des articles..."
                value={keywordInput}
                onChange={(e) => {
                  setKeywordInput(e.target.value)
                  // Keep search bar open while typing
                  isAnyComponentActiveRef.current = true
                  setIsCollapsed(false)
                  setFiltersOpen(true)
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current)
                    hoverTimeoutRef.current = null
                  }
                }}
                onFocus={() => { 
                  isSearchFocusedRef.current = true
                  isAnyComponentActiveRef.current = true
                  setIsCollapsed(false)
                  setFiltersOpen(true)
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current)
                    hoverTimeoutRef.current = null
                  }
                }}
                onBlur={() => { 
                  isSearchFocusedRef.current = false
                  // Delay to check if focus moved to another component in search bar
                  setTimeout(() => {
                    if (!searchBarRef.current?.contains(document.activeElement)) {
                      isAnyComponentActiveRef.current = false
                    }
                  }, 100)
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), setKeyword(keywordInput))}
                className={cn(
                  "w-full border-border/40 bg-secondary/40 pl-11 pr-4 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50 text-foreground transition-all duration-300 hover:bg-secondary/60",
                  isCollapsed ? "h-12 text-sm rounded-xl" : "h-14 rounded-xl text-base"
                )}
              />
            </div>
            <Button
              type="button"
              onClick={() => setKeyword(keywordInput)}
              className={cn(
                "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 hover:scale-105 shrink-0 transition-all duration-300 flex items-center justify-center font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
                isCollapsed ? "h-12 w-12 px-0 rounded-full" : "h-14 w-14 px-0 rounded-xl"
              )}
              title="Rechercher"
            >
              <Search className="h-5 w-5" />
            </Button>
            {!isCollapsed && (
              <button
                type="button"
                onClick={() => {
                  const willOpen = !filtersOpen
                  setFiltersOpen(willOpen)
                  if (willOpen) {
                    userOpenedFiltersAt.current = Date.now()
                  }
                }}
                className="p-2.5 rounded-xl hover:bg-secondary/60 transition-all shrink-0 hover:scale-105"
                aria-expanded={filtersOpen}
                aria-label="Toggle filters"
                onMouseEnter={(e) => e.stopPropagation()}
              >
                {filtersOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            )}
          </div>
          
          {/* Expandable filters section - animated open/close */}
          {!isCollapsed && (
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-500 ease-out",
                filtersOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden min-h-0">
                <div className="border-t border-border/30 p-5 pt-4 md:p-6 md:pt-5 opacity-100 transition-opacity duration-500 ease-out">
        <div className="flex flex-wrap items-end gap-3 relative">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Trier par</label>
            <Select 
              value={sort} 
              onValueChange={(v) => {
                setSort(v as SortOption)
                // Keep active state briefly after selection to prevent immediate collapse
                setTimeout(() => {
                  const activeElement = document.activeElement
                  if (!searchBarRef.current?.contains(activeElement)) {
                    isAnyComponentActiveRef.current = false
                  }
                }, 200)
              }}
              onOpenChange={(open) => {
                isAnyComponentActiveRef.current = open
                if (open) {
                  setIsCollapsed(false)
                  setFiltersOpen(true)
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current)
                    hoverTimeoutRef.current = null
                  }
                } else {
                  // When dropdown closes, check if focus is still in search bar
                  setTimeout(() => {
                    const activeElement = document.activeElement
                    if (!searchBarRef.current?.contains(activeElement)) {
                      isAnyComponentActiveRef.current = false
                    }
                  }, 100)
                }
              }}
            >
              <SelectTrigger 
                className="h-10 w-[120px] border-border/40 bg-secondary/60 hover:bg-secondary/80 rounded-xl text-sm"
                onClick={() => {
                  // Ensure search bar stays open when clicking select trigger
                  isAnyComponentActiveRef.current = true
                  setIsCollapsed(false)
                  setFiltersOpen(true)
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current)
                    hoverTimeoutRef.current = null
                  }
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/40 rounded-xl">
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="popularity">Popularité</SelectItem>
                <SelectItem value="title">Titre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Ordre</label>
            <Select 
              value={order} 
              onValueChange={(v) => {
                setOrder(v as "asc" | "desc")
                // Keep active state briefly after selection to prevent immediate collapse
                setTimeout(() => {
                  const activeElement = document.activeElement
                  if (!searchBarRef.current?.contains(activeElement)) {
                    isAnyComponentActiveRef.current = false
                  }
                }, 200)
              }}
              onOpenChange={(open) => {
                isAnyComponentActiveRef.current = open
                if (open) {
                  setIsCollapsed(false)
                  setFiltersOpen(true)
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current)
                    hoverTimeoutRef.current = null
                  }
                } else {
                  // When dropdown closes, check if focus is still in search bar
                  setTimeout(() => {
                    const activeElement = document.activeElement
                    if (!searchBarRef.current?.contains(activeElement)) {
                      isAnyComponentActiveRef.current = false
                    }
                  }, 100)
                }
              }}
            >
              <SelectTrigger 
                className="h-10 w-[110px] border-border/40 bg-secondary/60 hover:bg-secondary/80 rounded-xl text-sm"
                onClick={() => {
                  // Ensure search bar stays open when clicking select trigger
                  isAnyComponentActiveRef.current = true
                  setIsCollapsed(false)
                  setFiltersOpen(true)
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current)
                    hoverTimeoutRef.current = null
                  }
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/40 rounded-xl">
                <SelectItem value="desc">Décroissant</SelectItem>
                <SelectItem value="asc">Croissant</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Catégorie</label>
            <CategoryDropdown 
              value={category} 
              onChange={(value) => {
                setCategory(value)
                // Keep active state briefly after selection to prevent immediate collapse
                setTimeout(() => {
                  const activeElement = document.activeElement
                  if (!searchBarRef.current?.contains(activeElement)) {
                    isAnyComponentActiveRef.current = false
                  }
                }, 200)
              }}
              onOpenChange={(open) => {
                isAnyComponentActiveRef.current = open
                if (open) {
                  setIsCollapsed(false)
                  setFiltersOpen(true)
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current)
                    hoverTimeoutRef.current = null
                  }
                } else {
                  // When dropdown closes, check if focus is still in search bar
                  setTimeout(() => {
                    const activeElement = document.activeElement
                    if (!searchBarRef.current?.contains(activeElement)) {
                      isAnyComponentActiveRef.current = false
                    }
                  }, 100)
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Tags</label>
            <Input
              placeholder="tag1, tag2"
              value={tags}
              onChange={(e) => {
                setTags(e.target.value)
                // Keep search bar open while typing
                isAnyComponentActiveRef.current = true
                setIsCollapsed(false)
                setFiltersOpen(true)
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current)
                  hoverTimeoutRef.current = null
                }
              }}
              onFocus={() => {
                isAnyComponentActiveRef.current = true
                setIsCollapsed(false)
                setFiltersOpen(true)
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current)
                  hoverTimeoutRef.current = null
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  if (!searchBarRef.current?.contains(document.activeElement)) {
                    isAnyComponentActiveRef.current = false
                  }
                }, 100)
              }}
              className="h-10 w-[120px] border-border/40 bg-secondary/60 hover:bg-secondary/80 text-foreground rounded-xl text-sm"
            />
          </div>
          {user && (
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex h-10 cursor-pointer items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <input
                  type="checkbox"
                  checked={publishedOnly}
                  onChange={(e) => {
                    setPublishedOnly(e.target.checked)
                    // Keep search bar open when interacting
                    isAnyComponentActiveRef.current = true
                    setIsCollapsed(false)
                    setFiltersOpen(true)
                    setTimeout(() => {
                      const activeElement = document.activeElement
                      if (!searchBarRef.current?.contains(activeElement)) {
                        isAnyComponentActiveRef.current = false
                      }
                    }, 200)
                  }}
                  onFocus={() => {
                    isAnyComponentActiveRef.current = true
                    setIsCollapsed(false)
                    setFiltersOpen(true)
                  }}
                  className="rounded-lg border-border/40 bg-secondary/60 h-3.5 w-3.5 accent-primary"
                />
                Publiés uniquement
              </label>
              <Button
                variant={featured === true ? "default" : "outline"}
                size="sm"
                className={cn("h-10 rounded-xl text-xs px-3", featured === true && "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 shadow-lg shadow-primary/20")}
                onClick={() => {
                  setFeatured(featured === true ? undefined : true)
                  // Keep search bar open when interacting
                  isAnyComponentActiveRef.current = true
                  setIsCollapsed(false)
                  setFiltersOpen(true)
                  setTimeout(() => {
                    const activeElement = document.activeElement
                    if (!searchBarRef.current?.contains(activeElement)) {
                      isAnyComponentActiveRef.current = false
                    }
                  }, 200)
                }}
                onFocus={() => {
                  isAnyComponentActiveRef.current = true
                  setIsCollapsed(false)
                  setFiltersOpen(true)
                }}
              >
                À la une
              </Button>
              <Button
                variant={pinned === true ? "default" : "outline"}
                size="sm"
                className={cn("h-10 rounded-xl text-xs px-3", pinned === true && "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 shadow-lg shadow-primary/20")}
                onClick={() => {
                  setPinned(pinned === true ? undefined : true)
                  // Keep search bar open when interacting
                  isAnyComponentActiveRef.current = true
                  setIsCollapsed(false)
                  setFiltersOpen(true)
                  setTimeout(() => {
                    const activeElement = document.activeElement
                    if (!searchBarRef.current?.contains(activeElement)) {
                      isAnyComponentActiveRef.current = false
                    }
                  }, 200)
                }}
                onFocus={() => {
                  isAnyComponentActiveRef.current = true
                  setIsCollapsed(false)
                  setFiltersOpen(true)
                }}
              >
                Épinglé
              </Button>
            </div>
          )}
          {/* Bouton Réinitialiser aligné à droite */}
          <div className="ml-auto">
            <Button
              type="button"
              onClick={() => {
                handleClearFilters()
                // Keep search bar open when clicking reset
                isAnyComponentActiveRef.current = true
                setIsCollapsed(false)
                setFiltersOpen(true)
                setTimeout(() => {
                  const activeElement = document.activeElement
                  if (!searchBarRef.current?.contains(activeElement)) {
                    isAnyComponentActiveRef.current = false
                  }
                }, 200)
              }}
              disabled={!hasActiveFilters}
              variant="outline"
              onFocus={() => {
                isAnyComponentActiveRef.current = true
                setIsCollapsed(false)
                setFiltersOpen(true)
              }}
              className={cn(
                "h-10 gap-1.5 border-border/40 rounded-xl transition-all text-xs px-3",
                hasActiveFilters
                  ? "text-foreground hover:bg-secondary/60 hover:text-foreground hover:border-border/60 hover:shadow-sm"
                  : "text-muted-foreground cursor-not-allowed opacity-50"
              )}
            >
              <X className="h-3.5 w-3.5" />
              Réinitialiser
            </Button>
          </div>
        </div>
              </div>
            </div>
          </div>
          )}
        </section>
      </div>

    <div className="space-y-8">
      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 backdrop-blur-sm px-5 py-4 text-sm text-destructive font-medium shadow-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-primary/20 border-t-primary" />
          <p className="mt-4 text-sm text-muted-foreground/80 font-medium">Chargement des articles…</p>
        </div>
      ) : data?.content.length ? (
        <>
          <ul ref={articlesGridRef} className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
            {data.content.map((article) => (
              <li key={article.id} className="flex w-full">
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <nav className="flex flex-wrap items-center justify-center gap-2 pt-10" aria-label="Pagination">
              <Button
                variant="outline"
                size="sm"
                className="h-11 w-11 p-0 border-border/40 hover:bg-secondary/60 hover:border-border/60 rounded-xl transition-all hover:scale-105"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                aria-label="Page précédente"
              >
                ‹
              </Button>
              {pageNumbers.map((n, i) =>
                n === "ellipsis" ? (
                  <span key={`e-${i}`} className="px-3 text-muted-foreground/70">
                    …
                  </span>
                ) : (
                  <Button
                    key={n}
                    variant={page + 1 === n ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-11 min-w-11 font-semibold rounded-xl transition-all",
                      page + 1 === n 
                        ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30" 
                        : "border-border/40 hover:bg-secondary/60 hover:border-border/60 hover:scale-105"
                    )}
                    onClick={() => setPage((n as number) - 1)}
                    aria-current={page + 1 === n ? "page" : undefined}
                  >
                    {n}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-11 w-11 p-0 border-border/40 hover:bg-secondary/60 hover:border-border/60 rounded-xl transition-all hover:scale-105"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                aria-label="Page suivante"
              >
                ›
              </Button>
            </nav>
          )}
        </>
      ) : (
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="py-20 text-center">
            <p className="text-muted-foreground/80 font-medium">Aucun article. Modifiez les filtres ou créez un article si vous avez les droits.</p>
          </CardContent>
        </Card>
      )}
    </div>
    </>
  )
}
