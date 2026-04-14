'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { contractClient } from '../lib/contract-client';
import { WalletRejectedError, InsufficientBalanceError } from '../lib/stellar-helper';
import { Input, Button, TxStatusBadge } from './ui';

type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export function AdminPanel({ publicKey, onQuestionSet }: { publicKey: string; onQuestionSet: () => void }) {
  const [question, setQuestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [txError, setTxError] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleSetQuestion = async () => {
    if (!question.trim() || loading) return;

    setTxStatus('pending');
    setTxError('');

    try {
      const hash = await contractClient().setQuestion(publicKey, question);
      setTxHash(hash);
      setTxStatus('success');
      setQuestion('');
      onQuestionSet();
    } catch (error: any) {
      if (error instanceof WalletRejectedError) {
        setTxError('You cancelled the transaction. Click Submit Vote to try again.');
      } else if (error instanceof InsufficientBalanceError) {
        setTxError('Insufficient balance. You need at least 1.5 XLM to cover network fees.');
      } else {
        setTxError(error.message || 'Failed to set question');
      }
      setTxStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Collapsed Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-textMuted text-xs hover:text-textMain transition-colors ml-auto"
      >
        Admin
        {isOpen ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 claude-card p-6 animate-slide-up"
        >
          <Input
            label="New Poll Question"
            value={question}
            onChange={setQuestion}
            placeholder="Which Stellar feature excites you most?"
          />

          <div className="mt-4">
            <TxStatusBadge
              status={txStatus}
              hash={txHash}
              error={txError}
            />
          </div>

          <Button
            onClick={handleSetQuestion}
            disabled={!question.trim() || loading}
            fullWidth
          >
            {loading ? 'Setting...' : 'Set Question'}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
