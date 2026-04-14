'use client';

import React, { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import { stellar, WalletNotFoundError } from '../lib/stellar-helper';
import { LoadingSpinner, Button, Alert } from './ui';

export function Navbar({
  publicKey,
  isConnected,
  onConnect,
  onDisconnect,
}: {
  publicKey: string;
  isConnected: boolean;
  onConnect: (key: string) => void;
  onDisconnect: () => void;
}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setWalletError(null);

    try {
      const address = await stellar().connectWallet();
      onConnect(address);
    } catch (error: any) {
      if (error instanceof WalletNotFoundError) {
        setWalletError('No Stellar wallet found. Please install Freighter or another wallet extension.');
      } else {
        setWalletError(error.message || 'Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
    setIsMobileMenuOpen(false);
  };

  const formatAddress = (address: string) => {
    if (!address || address.length <= 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <nav className="sticky top-0 z-50 h-[60px] bg-background/80 backdrop-blur-md border-b border-borderOuter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-textMain rounded flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">Sp</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-medium text-textMain">StellarPoll</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-textMuted">
                Testnet
              </span>
            </div>
          </div>

          {/* Desktop Connection Section */}
          <div className="hidden md:flex items-center gap-4">
            {walletError && (
              <Alert type="error" message={walletError} onClose={() => setWalletError(null)} />
            )}
            
            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F2F8F4] text-[#2F593F]">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
                <span className="font-mono text-sm text-textMuted">{formatAddress(publicKey)}</span>
                <Button variant="secondary" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <>
                {isConnecting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Button onClick={handleConnect}>Connect Wallet</Button>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-borderInner transition-colors"
            >
              {isMobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-[60px] left-0 right-0 bg-background border-b border-borderOuter p-4 space-y-4">
            {walletError && (
              <Alert type="error" message={walletError} onClose={() => setWalletError(null)} />
            )}
            
            {isConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F2F8F4] text-[#2F593F]">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
                <span className="font-mono text-sm text-textMuted block">{formatAddress(publicKey)}</span>
                <Button variant="secondary" onClick={handleDisconnect} fullWidth>
                  Disconnect
                </Button>
              </div>
            ) : (
              <>
                {isConnecting ? (
                  <div className="flex justify-center">
                    <LoadingSpinner size="md" />
                  </div>
                ) : (
                  <Button onClick={handleConnect} fullWidth>
                    Connect Wallet
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
