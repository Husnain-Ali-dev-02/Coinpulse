'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import SearchModal from './SearchModal';

const Header = () => {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [coins, setCoins] = useState<{
    id: string
    name: string
    symbol: string
    image: string
  }[] | null>(null);

  useEffect(() => {
    if (!isSearchOpen || coins) return

    // Fetch top coins from CoinGecko when opening the modal for the first time
    ;(async () => {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false'
        )
        if (!res.ok) return setCoins([])
        const data: unknown = await res.json()
        const list = Array.isArray(data) ? data : []
        const mapped = list.map((c) => {
          const item = c as Record<string, unknown>
          return {
            id: String(item.id ?? ""),
            name: String(item.name ?? ""),
            symbol: String(item.symbol ?? ""),
            image: String(item.image ?? ""),
          }
        })
        setCoins(mapped)
      } catch (err) {
        // keep empty array on error
        console.error(err)
        setCoins([])
      }
    })()
  }, [isSearchOpen, coins])

  return (
    <header>
      <div className="main-container inner">
        <Link href="/">
          <Image src="/logo.svg" alt="CoinPulse logo" width={132} height={40} />
        </Link>

        <nav>
          <Link
            href="/"
            className={cn('nav-link', {
              'is-active': pathname === '/',
              'is-home': true,
            })}
          >
            Home
          </Link>

          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Open search"
            className="nav-link inline-flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Search</span>
          </button>

          <Link
            href="/coins"
            className={cn('nav-link', {
              'is-active': pathname === '/coins',
            })}
          >
            All Coins
          </Link>

          <SearchModal open={isSearchOpen} onClose={() => setIsSearchOpen(false)} coins={coins ?? []} />
        </nav>
      </div>
    </header>
  );
};

export default Header;