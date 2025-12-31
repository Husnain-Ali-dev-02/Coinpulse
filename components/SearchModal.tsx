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
   <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
  <DialogContent
    className="
      max-w-2xl
      rounded-2xl
      border border-border/60
      bg-background/95
      backdrop-blur-xl
      shadow-2xl
    "
  >
    <DialogHeader>
      <DialogTitle className="sr-only">Search coins</DialogTitle>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search coins by name or symbol..."
            className="
              h-11
              rounded-xl
              border-border/60
              bg-muted/40
              pl-10
              focus-visible:ring-2
              focus-visible:ring-primary
            "
          />
        </div>
      </div>
    </DialogHeader>

    <ScrollArea className="mt-4 h-80 rounded-xl border border-border/60 bg-muted/20">
      {filtered.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No coins found
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {filtered.map((coin) => (
            <li
              key={coin.id}
              tabIndex={0}
              onClick={() => handleSelect(coin)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleSelect(coin)
                }
              }}
              className="
                flex cursor-pointer items-center gap-4
                rounded-xl
                px-4 py-3
                transition-colors
                hover:bg-primary/10
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-primary
              "
            >
              <Image
                src={coin.image}
                alt={coin.name}
                width={36}
                height={36}
                className="rounded-full bg-muted"
              />

              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{coin.name}</p>
                <p className="text-xs uppercase text-muted-foreground">
                  {coin.symbol}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ScrollArea>
  </DialogContent>
</Dialog>

  )
}
