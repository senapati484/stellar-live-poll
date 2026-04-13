'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { contractClient } from '../lib/contract-client';
import { SkeletonLoader, EmptyState } from './ui';

export function ResultsPanel({ refreshTrigger }: { refreshTrigger: number }) {
  const [results, setResults] = useState<Array<{ option: string; count: number }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contractClient.getResults();
      setResults(data);
      setLastUpdated(Date.now());
      setSecondsAgo(0);
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResults();
  }, [refreshTrigger, loadResults]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadResults();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadResults]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const totalVotes = results.reduce((sum, r) => sum + r.count, 0);
  const maxCount = Math.max(...results.map(r => r.count), 1);

  return (
    <div className="claude-card p-6 sm:p-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-surface border border-borderInner rounded-lg shadow-sm flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <h2 className="text-2xl font-serif font-medium text-textMain tracking-tight">
            Live Results
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-xs text-textMuted">Live</span>
          </div>
          <button
            onClick={loadResults}
            className={`p-2 rounded-lg hover:bg-borderInner transition-colors ${loading ? 'animate-spin' : ''}`}
            disabled={loading}
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-xs text-textMuted mb-4">
        Last updated {secondsAgo}s ago
      </div>

      {/* Loading State */}
      {loading && <SkeletonLoader count={4} height="h-12" />}

      {/* Empty State */}
      {!loading && results.length === 0 && (
        <EmptyState
          icon="📊"
          title="No votes yet"
          description="Be the first to vote!"
        />
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => {
            const percentage = totalVotes > 0 ? (result.count / totalVotes) * 100 : 0;
            const isLeading = index === 0 && result.count > 0;
            const barColor = isLeading ? 'bg-primary' : 'bg-borderOuter';

            return (
              <div key={result.option} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-textMain font-medium text-sm">{result.option}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-surface border border-borderInner rounded px-1.5 py-0.5">
                      {result.count}
                    </span>
                    <span className="text-textMuted text-xs text-right">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-2 bg-borderInner rounded-full w-full">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Total Votes Footer */}
      {!loading && results.length > 0 && (
        <div className="text-textMuted text-xs text-center mt-4">
          Total votes: {totalVotes}
        </div>
      )}
    </div>
  );
}
