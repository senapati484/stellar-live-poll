'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCopy, FiExternalLink, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-textMain border-r-transparent ${sizeClasses[size]}`}
    />
  );
}

export function SkeletonLoader({ count = 1, height = 'h-4', width = 'w-full' }: { count?: number; height?: string; width?: string }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`animate-pulse bg-borderInner rounded ${height} ${width}`} />
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-textMain mb-2">{title}</h3>
      <p className="text-textMuted text-center max-w-md">{description}</p>
    </div>
  );
}

export function Alert({ type, message, onClose }: { type: 'success' | 'error' | 'info'; message: string; onClose: () => void }) {
  const typeClasses = {
    success: 'bg-[#F2F8F4] border-[#E2F0E7] text-[#2F593F]',
    error: 'bg-[#FCF2F2] border-[#F8E3E3] text-[#8C2F2B]',
    info: 'bg-[#F4F2EC] border-[#E9E7E0] text-textMuted',
  };

  const icons = {
    success: <FiCheckCircle className="w-5 h-5" />,
    error: <FiAlertCircle className="w-5 h-5" />,
    info: <FiInfo className="w-5 h-5" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 p-4 rounded-lg border ${typeClasses[type]} animate-slide-up`}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1 text-sm">{message}</div>
      <button
        onClick={onClose}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <FiX className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function TxStatusBadge({ status, hash, error }: { status: 'idle' | 'pending' | 'success' | 'error'; hash?: string; error?: string }) {
  if (status === 'idle') return null;

  if (status === 'pending') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FEF3C7] text-amber-700 text-sm animate-slide-up"
      >
        <LoadingSpinner size="sm" />
        <span>Broadcasting…</span>
      </motion.div>
    );
  }

  if (status === 'success' && hash) {
    const truncatedHash = hash.slice(0, 12);
    const explorerUrl = `https://stellar.expert/testnet/tx/${hash}`;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#F2F8F4] text-[#2F593F] text-sm animate-slide-up"
      >
        <FiCheckCircle className="w-4 h-4" />
        <span className="font-mono">{truncatedHash}</span>
        <button
          onClick={() => navigator.clipboard.writeText(hash)}
          className="p-1 hover:bg-[#E2F0E7] rounded transition-colors"
          title="Copy hash"
        >
          <FiCopy className="w-4 h-4" />
        </button>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:underline"
        >
          View on Explorer
          <FiExternalLink className="w-3 h-3" />
        </a>
      </motion.div>
    );
  }

  if (status === 'error') {
    const isWalletNotFound = error?.includes('WalletNotFound');
    const errorMessage = isWalletNotFound
      ? 'No wallet extension found. Install Freighter to continue.'
      : error || 'Transaction failed';

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-2 px-4 py-2 rounded-lg bg-[#FCF2F2] text-[#8C2F2B] text-sm animate-slide-up"
      >
        <FiAlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>{errorMessage}</span>
      </motion.div>
    );
  }

  return null;
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-textMain">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`claude-input ${error ? 'border-red-500 focus:border-red-500' : ''}`}
      />
      {error && <span className="text-xs text-[#8C2F2B]">{error}</span>}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
}) {
  const variantClasses = {
    primary: 'claude-button-primary',
    secondary: 'claude-button-secondary',
    danger: 'bg-[#8C2F2B] text-white hover:bg-[#7A2521] border border-transparent shadow-sm',
  };

  return (
    <motion.button
      type={type as any}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`claude-button ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </motion.button>
  );
}

export function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`claude-card p-6 ${className}`}>
      {title && <h3 className="text-lg font-semibold text-textMain mb-4">{title}</h3>}
      {children}
    </div>
  );
}
