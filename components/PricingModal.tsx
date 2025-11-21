"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

type PricingModalProps = {
  onClose: () => void;
};

export function PricingModal({ onClose }: PricingModalProps) {
  const { user, isPro } = useAuth();

  const [isLoading, setIsLoading] = React.useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      alert('Please sign in first');
      onClose();
      return;
    }

    if (isPro) {
      alert('You are already a Pro user!');
      return;
    }

    setIsLoading(true);

    try {
      // Call our API to create a Stripe checkout session
      const response = await fetch('/api/create-subscription-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
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
      console.error('Upgrade error:', error);
      alert(`Failed to start checkout: ${error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="rounded-2xl max-w-4xl w-full p-3 sm:p-6 md:p-8 relative shadow-2xl my-2 sm:my-8 max-h-[96vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }}>
        <button
          onClick={onClose}
          className="sticky top-0 float-right text-2xl transition-colors z-10 bg-opacity-90 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center -mt-1 -mr-1 sm:mt-0 sm:mr-0"
          style={{ 
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--card-bg)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          ×
        </button>

        <div className="text-center mb-3 sm:mb-8 clear-both">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2" style={{ color: 'var(--text-primary)' }}>
            Upgrade to Foo Pro 🔥
          </h2>
          <p className="text-sm sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
            Unlock unlimited chats and Foo's voice
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-3 sm:gap-6 mb-3 sm:mb-8">
          {/* Free Plan */}
          <div className="border-2 rounded-2xl p-3 sm:p-6" style={{ 
            borderColor: 'var(--card-border)',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <div className="text-center mb-2 sm:mb-4">
              <h3 className="text-lg sm:text-2xl font-bold mb-0.5 sm:mb-2" style={{ color: 'var(--text-primary)' }}>Free</h3>
              <div className="text-2xl sm:text-4xl font-black mb-0.5 sm:mb-2" style={{ color: 'var(--text-primary)' }}>$0</div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Per month</p>
            </div>
            
            <ul className="space-y-1.5 sm:space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5 text-sm">✓</span>
                <span className="text-xs sm:text-base" style={{ color: 'var(--text-primary)' }}>10 messages per day</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5 text-sm">✓</span>
                <span className="text-xs sm:text-base" style={{ color: 'var(--text-primary)' }}>Send pics to Foo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5 text-sm">✓</span>
                <span className="text-xs sm:text-base" style={{ color: 'var(--text-primary)' }}>Authentic Salinas slang</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5 text-sm">✗</span>
                <span className="text-xs sm:text-base" style={{ color: 'var(--text-secondary)' }}>Voice responses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5 text-sm">✗</span>
                <span className="text-xs sm:text-base" style={{ color: 'var(--text-secondary)' }}>Unlimited messages</span>
              </li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="border-2 rounded-2xl p-3 sm:p-6 relative" style={{ 
            borderColor: '#8b6f47',
            backgroundColor: 'var(--bg-secondary)',
            boxShadow: '0 0 30px rgba(139, 111, 71, 0.3)'
          }}>
            <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 px-2 sm:px-4 py-0.5 rounded-full text-xs font-bold" style={{
              background: 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)',
              color: 'white'
            }}>
              RECOMMENDED
            </div>

            <div className="text-center mb-2 sm:mb-4">
              <h3 className="text-lg sm:text-2xl font-bold mb-0.5 sm:mb-2" style={{ color: 'var(--text-primary)' }}>Foo Pro</h3>
              <div className="text-2xl sm:text-4xl font-black mb-0.5 sm:mb-2" style={{ color: 'var(--text-primary)' }}>$0.50</div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Per month</p>
            </div>
            
            <ul className="space-y-1.5 sm:space-y-3 mb-3 sm:mb-6">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5 text-sm">✓</span>
                <span className="text-xs sm:text-base font-medium" style={{ color: 'var(--text-primary)' }}>Unlimited messages</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5 text-sm">✓</span>
                <span className="text-xs sm:text-base font-medium" style={{ color: 'var(--text-primary)' }}>Hear Foo speak with voice 🔊</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5 text-sm">✓</span>
                <span className="text-xs sm:text-base" style={{ color: 'var(--text-primary)' }}>Send unlimited pics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5 text-sm">✓</span>
                <span className="text-xs sm:text-base" style={{ color: 'var(--text-primary)' }}>Priority responses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5 text-sm">✓</span>
                <span className="text-xs sm:text-base" style={{ color: 'var(--text-primary)' }}>Support the project</span>
              </li>
            </ul>

            {isPro ? (
              <div className="text-center py-2 sm:py-3 rounded-xl font-bold text-sm" style={{
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                color: '#22c55e'
              }}>
                ✓ You're a Pro!
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3 rounded-xl font-bold text-white text-sm sm:text-lg transition-all hover:scale-105 hover:brightness-110 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background: 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)'
                }}
              >
                {isLoading ? 'Loading...' : 'Upgrade to Pro'}
              </button>
            )}
          </div>
        </div>

        {!user && (
          <div className="text-center p-2 sm:p-4 rounded-lg" style={{
            backgroundColor: 'rgba(41, 121, 255, 0.1)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'rgba(41, 121, 255, 0.2)'
          }}>
            <p className="text-xs sm:text-base" style={{ color: 'var(--text-secondary)' }}>
              💡 Sign in or create an account to upgrade to Pro
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

