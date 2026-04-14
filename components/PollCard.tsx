'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { contractClient } from '../lib/contract-client';
import { stellar, WalletRejectedError, InsufficientBalanceError } from '../lib/stellar-helper';
import { TxStatusBadge, Button } from './ui';

type TxStatus = 'idle' | 'pending' | 'success' | 'error';

const OPTIONS = ["Smart Contracts", "Fast Settlements", "Low Fees", "DeFi Protocols"];

export function PollCard({ publicKey, onVoteSuccess }: { publicKey: string; onVoteSuccess: () => void }) {
  const [question, setQuestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [txError, setTxError] = useState<string>('');
  const [votedOptions, setVotedOptions] = useState<Set<string>>(new Set());
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [unfunded, setUnfunded] = useState<boolean>(false);
  const [funding, setFunding] = useState<boolean>(false);

  useEffect(() => {
    loadQuestionAndResults();
  }, []);

  const checkBalanceStatus = async () => {
    try {
      await stellar().getBalance(publicKey);
      setUnfunded(false);
    } catch (error: any) {
      if (error?.message?.includes('Not Found') || error?.message?.includes('404')) {
        setUnfunded(true);
      }
    }
  };

  useEffect(() => {
    if (publicKey) checkBalanceStatus();
  }, [publicKey]);

  const fundAccount = async () => {
    setFunding(true);
    setTxStatus('pending');
    setTxError('Requesting funds from Friendbot...');
    const result = await stellar().fundTestnetAccount(publicKey);
    if (result) {
      setTxStatus('idle');
      setTxError('');
      setUnfunded(false);
    } else {
      setTxStatus('error');
      setTxError('Failed to fund account. Try again later.');
    }
    setFunding(false);
  };

  const loadQuestionAndResults = async () => {
    setLoading(true);
    try {
      const [q, results] = await Promise.all([
        contractClient().getQuestion(),
        contractClient().getResults(),
      ]);
      setQuestion(q);
      const counts: Record<string, number> = {};
      results.forEach(({ option, count }) => {
        counts[option] = count;
      });
      setVoteCounts(counts);
    } catch (error) {
      console.error('Failed to load question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!selectedOption || loading) return;

    setTxStatus('pending');
    setTxError('');

    try {
      const hash = await contractClient().vote(publicKey, selectedOption);
      setTxHash(hash);
      setTxStatus('success');
      
      // Mark as voted in this session
      setVotedOptions(prev => new Set(prev).add(selectedOption));
      
      // Refresh results
      await loadQuestionAndResults();
      
      onVoteSuccess();
    } catch (error: any) {
      if (error instanceof WalletRejectedError) {
        setTxError('You cancelled the transaction. Click Submit Vote to try again.');
      } else if (error instanceof InsufficientBalanceError) {
        setTxError('Insufficient balance. You need at least 1.5 XLM to cover network fees.');
      } else if (error?.message?.includes('Not Found') || error?.message?.includes('404')) {
         setUnfunded(true);
         setTxError('Account not found. It needs to be funded to interact with the network.');
      } else {
        setTxError(error.message || 'Failed to submit vote');
      }
      setTxStatus('error');
    }
  };

  const hasVoted = votedOptions.has(selectedOption);

  return (
    <motion.div 
       initial={{ opacity: 0, y: 15 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5, ease: "easeOut" }}
       className="claude-card p-6 sm:p-8"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <motion.div 
           whileHover={{ scale: 1.05, rotate: 5 }}
           className="w-10 h-10 bg-surface border border-borderInner rounded-lg shadow-sm flex items-center justify-center cursor-pointer"
        >
          <span className="text-xl">🗳️</span>
        </motion.div>
        <h2 className="text-2xl font-serif font-medium text-textMain tracking-tight">
          Cast Your Vote
        </h2>
      </div>

      {unfunded && (
         <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            className="mb-6 p-4 rounded-xl bg-[#F2F8F4] border border-[#2F593F]/20 flex flex-col gap-3 items-start"
         >
             <p className="text-[#2F593F] text-sm">Your Testnet account isn't funded yet! You need XLM to cover transaction fees.</p>
             <Button onClick={fundAccount} disabled={funding}>
                 {funding ? "Funding..." : "Fund with Friendbot"}
             </Button>
         </motion.div>
      )}

      {/* Question */}
      {question && (
        <p className="text-textMuted text-sm mb-6 leading-relaxed">
          {question}
        </p>
      )}

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {OPTIONS.map((option) => {
          const isSelected = selectedOption === option;
          const isVoted = votedOptions.has(option);
          const count = voteCounts[option] || 0;

          return (
            <motion.button
              key={option}
              whileHover={!isVoted ? { scale: 1.02 } : { scale: 1 }}
              whileTap={!isVoted ? { scale: 0.98 } : { scale: 1 }}
              onClick={() => {
                if (!isVoted) {
                  setSelectedOption(option);
                }
              }}
              disabled={isVoted}
              className={`
                relative p-4 rounded-xl text-left transition-colors cursor-pointer
                bg-surface border border-borderInner shadow-sm
                ${isSelected && !isVoted ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : ''}
                ${isVoted ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-start justify-between">
                <span className="font-medium text-textMain">{option}</span>
                <AnimatePresence>
                  {isVoted && (
                    <motion.div
                       initial={{ scale: 0, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       exit={{ scale: 0, opacity: 0 }}
                    >
                      <FiCheck className="w-5 h-5 text-[#2F593F]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="mt-2 text-xs text-textMuted">
                {count} vote{count !== 1 ? 's' : ''}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Tx Status Badge */}
      <div className="mb-4">
        <TxStatusBadge
          status={txStatus}
          hash={txHash}
          error={txError}
        />
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleVote}
        disabled={!selectedOption || loading || hasVoted || unfunded}
        fullWidth
      >
        {loading ? 'Loading...' : hasVoted ? 'Already Voted' : 'Submit Vote'}
      </Button>

      {/* Info Box */}
      <div className="mt-4 bg-[#F4F2EC] border-[#E9E7E0] rounded-lg p-3 text-xs text-textMuted">
        Votes are recorded on Stellar testnet. Each wallet can vote multiple times.
      </div>
    </motion.div>
  );
}
