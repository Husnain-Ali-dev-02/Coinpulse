"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

type Coin = {
  id: string
  name: string
  symbol: string
  image: string
}

type SearchModalProps = {
  open: boolean
  onClose: () => void
  coins?: Coin[]
}

export default function SearchModal({ open, onClose, coins }: SearchModalProps) {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = React.useState("")

  React.useEffect(() => {
    if (open) {
      setQuery("")
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const normalized = (s: string) => s.trim().toLowerCase()

  const filtered = React.useMemo(() => {
    const list = coins ?? []
    const q = normalized(query)
    if (!q) return list
    return list.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
      )
    })
  }, [coins, query])

  const handleSelect = (coin: Coin) => {
    router.push(`/coins/${coin.id}`)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen === false && onClose()}>
      <DialogContent id="search-modal" className="dialog max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Search coins</DialogTitle>
          <div className="flex items-center gap-4">
            <label htmlFor="search" className="sr-only">
              Search coins
            </label>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                id="search"
                ref={inputRef}
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                placeholder="Search by name or symbol..."
                className="pl-10"
                aria-label="Search coins"
                autoComplete="off"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <ScrollArea className="h-72 rounded-md border bg-background p-2">
            {filtered.length === 0 ? (
              <div className="empty text-center py-8 text-sm text-muted-foreground">No coins found</div>
            ) : (
              <ul role="list" className="divide-y">
                {filtered.map((coin) => (
                  <li
                    key={coin.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelect(coin)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLLIElement>) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        handleSelect(coin)
                      }
                    }}
                    className="search-item flex w-full cursor-pointer items-center justify-between gap-4 rounded-md px-3 py-2 hover:bg-accent/40 focus:outline-none focus-visible:ring-ring"
                  >
                    <div className="coin-info flex items-center gap-3">
                      <Image src={coin.image} alt={coin.name} width={32} height={32} className="rounded-full" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{coin.name}</div>
                        <div className="coin-symbol text-xs text-muted-foreground uppercase">{coin.symbol}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
