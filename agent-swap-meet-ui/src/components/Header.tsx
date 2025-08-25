// src/components/Header.tsx
"use client";

import { useWallet } from '@/contexts/WalletContext';
import Link from 'next/link';

export const Header = () => {
  const { address, connectWallet, disconnect } = useWallet();

  return (
    <header className="p-4 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 text-white flex justify-between items-center sticky top-0 z-10">
      <Link href="/">
        <h1 className="text-xl font-bold cursor-pointer">Alchemist's Ledger</h1>
      </Link>
      <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-300 hover:text-white">Marketplace</Link>
          {address && (
            <Link href="/my-collection" className="text-sm text-gray-300 hover:text-white">My Collection</Link>
          )}
        </nav>
      {address ? (
        <div className="flex items-center gap-4">
          <p className="text-sm font-mono bg-gray-700 px-3 py-1.5 rounded-md">
            {address.substring(0, 6)}...{address.substring(address.length - 4)}
          </p>
          <button onClick={disconnect} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md text-sm">
            Disconnect
          </button>
        </div>
      ) : (
        <button onClick={connectWallet} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">
          Connect Wallet
        </button>
      )}
    </header>
  );
};