"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

type AFVoiceModalProps = {
  onClose: () => void;
};

export function AFVoiceModal({ onClose }: AFVoiceModalProps) {
  const { user, hasAFVoice } = useAuth();

  const [isLoading, setIsLoading] = React.useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      alert('Please sign in first');
      onClose();
      return;
    }

    if (hasAFVoice) {
      alert('You already have AF Voice Mode!');
      return;
    }

    setIsLoading(true);

    try {
      // Call our API to create a Stripe checkout session
      const response = await fetch('/api/create-afvoice-checkout', {
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
      <div className="rounded-2xl max-w-2xl w-full p-4 sm:p-6 md:p-8 relative shadow-2xl my-4 sm:my-8 max-h-[95vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }}>
        <button
          onClick={onClose}
          className="sticky top-0 float-right text-3xl sm:text-2xl transition-colors z-10 bg-opacity-90 rounded-full w-10 h-10 flex items-center justify-center -mt-2 -mr-2 sm:mt-0 sm:mr-0"
          style={{ 
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--card-bg)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          ×
        </button>

        <div className="text-center mb-6 sm:mb-8 clear-both">
          <div className="text-6xl mb-4">🎤</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Unlock AF Voice Mode
          </h2>
          <p className="text-base sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
            Have real-time voice conversations with Foo
          </p>
        </div>

        <div className="border-2 rounded-2xl p-6 sm:p-8 mb-6 relative" style={{ 
          borderColor: '#8b6f47',
          backgroundColor: 'var(--bg-secondary)',
          boxShadow: '0 0 30px rgba(139, 111, 71, 0.3)'
        }}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold" style={{
            background: 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)',
            color: 'white'
          }}>
            PREMIUM FEATURE
          </div>

          <div className="text-center mb-6">
            <div className="text-4xl sm:text-5xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>$0.50</div>
            <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>Per month</p>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-xl mt-0.5">✓</span>
              <div>
                <p className="font-semibold text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
                  🎙️ Advanced Foo Mode
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Continuous hands-free voice conversations
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-green-500 text-xl mt-0.5">✓</span>
              <div>
                <p className="font-semibold text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
                  🔊 Hear Foo respond instantly
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Real-time voice responses with authentic Salinas slang
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-green-500 text-xl mt-0.5">✓</span>
              <div>
                <p className="font-semibold text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
                  💬 Natural back-and-forth
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Automatic conversation flow - no button mashing
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-green-500 text-xl mt-0.5">✓</span>
              <div>
                <p className="font-semibold text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
                  📸 Send pics while talking
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Show Foo what you're talking about in real-time
                </p>
              </div>
            </div>
          </div>

          {hasAFVoice ? (
            <div className="text-center py-3 rounded-xl font-bold text-base" style={{
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              color: '#22c55e'
            }}>
              ✓ You have AF Voice Mode!
            </div>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full py-3 sm:py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105 hover:brightness-110 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)'
              }}
            >
              {isLoading ? 'Loading...' : '🎤 Unlock AF Voice - $0.50/mo'}
            </button>
          )}
        </div>

        {!user && (
          <div className="text-center p-4 rounded-lg" style={{
            backgroundColor: 'rgba(41, 121, 255, 0.1)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'rgba(41, 121, 255, 0.2)'
          }}>
            <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
              💡 Sign in or create an account to unlock AF Voice Mode
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            Cancel anytime • Billed monthly • Works on mobile & desktop
          </p>
        </div>
      </div>
    </div>
  );
}

