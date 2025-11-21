"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

type NavbarProps = {
  onSignInClick: () => void;
  onSignUpClick: () => void;
  onPricingClick: () => void;
};

export function Navbar({ onSignInClick, onSignUpClick, onPricingClick }: NavbarProps) {
  const { user, isPro, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      setShowMobileMenu(false);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300" style={{
      backgroundColor: theme === 'dark' ? 'rgba(26, 21, 15, 0.9)' : 'rgba(245, 230, 211, 0.9)',
      borderColor: 'var(--border)'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <Image 
              src="/icons/Foo.png" 
              alt="FooChat Logo" 
              width={36} 
              height={36}
              className="rounded-full shadow-md"
              unoptimized
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                FooChat
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                AI Foo Chat
              </p>
            </div>
            <h1 className="sm:hidden text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              FooChat
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all hover:scale-110"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
              suppressHydrationWarning
              title={mounted ? (theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode') : 'Toggle Theme'}
            >
              {mounted ? (theme === 'dark' ? '☀️' : '🌙') : '🌓'}
            </button>

            {user ? (
              <>
                {/* Pro Badge */}
                {isPro && (
                  <span 
                    className="text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5"
                    style={{ 
                      background: 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)',
                      boxShadow: '0 4px 12px rgba(139, 111, 71, 0.3)'
                    }}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    PRO
                  </span>
                )}

                {/* User Email */}
                <span className="text-sm font-medium max-w-[150px] truncate" style={{ color: 'var(--text-secondary)' }}>
                  {user.email}
                </span>

                {/* Upgrade Button (if not pro) */}
                {!isPro && (
                  <button
                    onClick={onPricingClick}
                    className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105 shadow-md"
                    style={{ 
                      background: 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)',
                      color: 'white'
                    }}
                  >
                    Upgrade to Pro
                  </button>
                )}

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                </button>
              </>
            ) : (
              <>
                {/* Sign In Button */}
                <button
                  onClick={onSignInClick}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)'
                  }}
                >
                  Sign In
                </button>

                {/* Sign Up Button */}
                <button
                  onClick={onSignUpClick}
                  className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105 shadow-md"
                  style={{ 
                    background: 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)',
                    color: 'white'
                  }}
                >
                  Sign Up Free
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
              suppressHydrationWarning
            >
              {mounted ? (theme === 'dark' ? '☀️' : '🌙') : '🌓'}
            </button>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg transition-all"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
              aria-label="Toggle menu"
            >
              {showMobileMenu ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="md:hidden border-t py-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
            {user ? (
              <>
                {/* Pro Badge */}
                {isPro && (
                  <div className="flex justify-center">
                    <span 
                      className="text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2"
                      style={{ 
                        background: 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)',
                        boxShadow: '0 4px 12px rgba(139, 111, 71, 0.3)'
                      }}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      PRO MEMBER
                    </span>
                  </div>
                )}

                {/* User Email */}
                <div className="text-center px-4">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
                    {user.email}
                  </p>
                </div>

                {/* Upgrade Button */}
                {!isPro && (
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      onPricingClick();
                    }}
                    className="w-full px-4 py-3 rounded-lg text-sm font-bold transition-all shadow-md"
                    style={{ 
                      background: 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)',
                      color: 'white'
                    }}
                  >
                    ⚡ Upgrade to Pro
                  </button>
                )}

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ 
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    color: '#dc2626',
                    border: '1px solid rgba(220, 38, 38, 0.3)'
                  }}
                >
                  {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onSignInClick();
                  }}
                  className="w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)'
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onSignUpClick();
                  }}
                  className="w-full px-4 py-3 rounded-lg text-sm font-bold transition-all shadow-md"
                  style={{ 
                    background: 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)',
                    color: 'white'
                  }}
                >
                  Sign Up Free
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}



