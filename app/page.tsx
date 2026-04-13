'use client';

import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { PollCard } from '../components/PollCard';
import { ResultsPanel } from '../components/ResultsPanel';
import { AdminPanel } from '../components/AdminPanel';
import { Button } from '../components/ui';
import { stellar } from '../lib/stellar-helper';

export default function Home() {
  const [publicKey, setPublicKey] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleVoteSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleQuestionSet = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleConnect = (key: string) => {
    setPublicKey(key);
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setPublicKey('');
    setIsConnected(false);
  };

  const handleConnectClick = async () => {
    try {
      const address = await stellar.connectWallet();
      handleConnect(address);
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar
        publicKey={publicKey}
        isConnected={isConnected}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-12">
        {!isConnected ? (
          <>
            {/* Hero Section */}
            <div className="py-20 text-center animate-slide-up bg-surface border border-borderInner rounded-2xl shadow-sm mb-10">
              <h2 className="font-serif text-5xl font-medium tracking-tight text-textMain mb-4">
                StellarPoll
              </h2>
              <p className="text-textMuted text-lg max-w-md mx-auto">
                On-chain voting powered by Soroban smart contracts.
              </p>
              <div className="mt-8">
                <Button onClick={handleConnectClick}>
                  Connect Wallet
                </Button>
              </div>
            </div>

            {/* How It Works Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up stagger-2">
              {[
                { title: 'Connect', desc: 'Link your Stellar wallet' },
                { title: 'Read the Question', desc: 'Pulled live from the contract' },
                { title: 'Cast Your Vote', desc: 'Signed transaction on testnet' },
                { title: 'See Live Results', desc: 'Real-time result sync' },
              ].map((step, i) => (
                <div key={i} className="claude-card p-6 text-center">
                  <div className="text-3xl mb-3">{i + 1}</div>
                  <h3 className="font-semibold text-textMain mb-2">{step.title}</h3>
                  <p className="text-sm text-textMuted">{step.desc}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 animate-slide-up stagger-1">
              <PollCard publicKey={publicKey} onVoteSuccess={handleVoteSuccess} />
              <div className="mt-4 animate-slide-up stagger-2">
                <AdminPanel publicKey={publicKey} onQuestionSet={handleQuestionSet} />
              </div>
            </div>
            <div className="lg:col-span-7 animate-slide-up stagger-2">
              <ResultsPanel refreshTrigger={refreshTrigger} />
            </div>
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-textMuted text-sm">
        <p className="mb-1">StellarPoll · Soroban Testnet · Level 2 Yellow Belt</p>
        <p className="text-xs">Do not use real funds</p>
      </footer>
    </div>
  );
}
