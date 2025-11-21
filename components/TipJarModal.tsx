"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type TipJarModalProps = {
  onClose: () => void;
};

export function TipJarModal({ onClose }: TipJarModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleTip = async (amount: number) => {
    setIsLoading(true);

    try {
      // Call our API to create a Stripe checkout session for the tip
      const response = await fetch('/api/create-tip-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          userId: user?.id || 'guest',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Tip error:', error);
      alert(`Failed to start checkout: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleCustomTip = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 1) {
      alert('Please enter a valid amount of at least $1');
      return;
    }
    handleTip(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl max-w-md w-full p-8 relative shadow-2xl" style={{ backgroundColor: 'var(--card-bg)' }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          ×
        </button>

        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍔</div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Help a Foo Out!
          </h2>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Show your support with a tip
          </p>
        </div>

        {!showCustomInput ? (
          <div className="space-y-3">
            {/* $1 Tip Button */}
            <button
              onClick={() => handleTip(1)}
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '2px solid var(--border)'
              }}
            >
              💵 Tip $1
            </button>

            {/* $5 Tip Button */}
            <button
              onClick={() => handleTip(5)}
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)',
                color: 'white'
              }}
            >
              💰 Tip $5
            </button>

            {/* Custom Amount Button */}
            <button
              onClick={() => setShowCustomInput(true)}
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '2px solid var(--border)'
              }}
            >
              ✨ Custom Amount
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Enter custom amount (minimum $1)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="10.00"
                  className="w-full pl-10 pr-4 py-4 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '2px solid var(--border)'
                  }}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomAmount('');
                }}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)'
                }}
              >
                Back
              </button>
              <button
                onClick={handleCustomTip}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)',
                  color: 'white'
                }}
              >
                {isLoading ? 'Loading...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            💙 Your support helps keep FooChat running!
          </p>
        </div>
      </div>
    </div>
  );
}

