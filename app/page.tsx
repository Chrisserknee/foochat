"use client";

import React, { useState, useRef, useEffect } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { AuthModal } from "@/components/AuthModal";
import { PricingModal } from "@/components/PricingModal";
import { TipJarModal } from "@/components/TipJarModal";
import { AFVoiceModal } from "@/components/AFVoiceModal";
import { Notification } from "@/components/Notification";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import Image from "next/image";

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  timestamp: Date;
};

export default function FooChat() {
  const { user, isPro, hasAFVoice, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showTipJarModal, setShowTipJarModal] = useState(false);
  const [showAFVoiceModal, setShowAFVoiceModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [useAdvancedVoice, setUseAdvancedVoice] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAFMode, setIsAFMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [afUserText, setAfUserText] = useState('');
  const [afFooText, setAfFooText] = useState('');
  const [afStatus, setAfStatus] = useState<'idle' | 'recording' | 'processing' | 'getting_response' | 'playing'>('idle');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Ayy what's good foo? 😎 Send me a pic or just say what's up, I'm here to keep it real Salinas style.",
      timestamp: new Date()
    }
  ]);
  const [crisisLockoutUntil, setCrisisLockoutUntil] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messagesLeft, setMessagesLeft] = useState(10);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // AF mode image state
  const [afImage, setAfImage] = useState<File | null>(null);
  const [afImagePreview, setAfImagePreview] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const afFileInputRef = useRef<HTMLInputElement>(null); // For AF mode camera
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null); // Track media stream for cleanup
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const afAudioRef = useRef<HTMLAudioElement | null>(null); // Pre-created audio for AF mode
  const isAFModeRef = useRef<boolean>(false); // Track AF mode state for event handlers
  const isProcessingRef = useRef<boolean>(false); // 🔒 Lock to prevent overlapping processing

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(mobile);
      console.log('📱 Mobile device:', mobile);
    };
    checkMobile();
  }, []);

  // Sync isAFMode state with ref for event handler closures
  useEffect(() => {
    isAFModeRef.current = isAFMode;
    console.log('🔄 isAFModeRef updated:', isAFMode);
  }, [isAFMode]);

  // Load guest message count from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !user) {
      const storedCount = localStorage.getItem('foochat_guestMessageCount');
      const storedTimestamp = localStorage.getItem('foochat_guestMessageTimestamp');
      
      if (storedCount && storedTimestamp) {
        const timestamp = parseInt(storedTimestamp);
        const now = Date.now();
        const hoursSinceLastMessage = (now - timestamp) / (1000 * 60 * 60);
        
        // Reset count after 24 hours
        if (hoursSinceLastMessage >= 24) {
          console.log('🔄 Guest message count expired (24h), resetting...');
          localStorage.setItem('foochat_guestMessageCount', '0');
          localStorage.setItem('foochat_guestMessageTimestamp', now.toString());
          setGuestMessageCount(0);
          setMessagesLeft(10);
        } else {
          const count = parseInt(storedCount);
          console.log('📊 Loaded guest message count:', count);
          setGuestMessageCount(count);
          setMessagesLeft(Math.max(0, 10 - count));
        }
      } else {
        // First time - initialize
        console.log('🆕 First time guest - initializing message tracking');
        localStorage.setItem('foochat_guestMessageCount', '0');
        localStorage.setItem('foochat_guestMessageTimestamp', Date.now().toString());
      }
    }
  }, [user]);

  // Set mounted to true after client hydration to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Check for crisis lockout in localStorage
    const storedLockout = localStorage.getItem('crisisLockoutUntil');
    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout);
      if (lockoutTime > Date.now()) {
        setCrisisLockoutUntil(lockoutTime);
        console.log('🚨 Crisis lockout active until:', new Date(lockoutTime).toLocaleTimeString());
      } else {
        // Lockout expired, clear it
        localStorage.removeItem('crisisLockoutUntil');
      }
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle URL parameters (upgrade success, premium modal, etc.)
  useEffect(() => {
    const handleURLParams = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const upgrade = urlParams.get('upgrade');
      const sessionId = urlParams.get('session_id');
      const premium = urlParams.get('premium');
      
      // Handle showing pricing modal
      if (premium === 'true') {
        setShowPricingModal(true);
        // Clean up URL
        window.history.replaceState({}, '', '/');
        return;
      }
      
      // Handle successful upgrade
      if (upgrade === 'success' && sessionId) {
        console.log('🎉 Successful upgrade detected, verifying payment...');
        
        try {
          const response = await fetch('/api/checkout-success', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          });
          
          const data = await response.json();
          
          if (response.ok) {
            console.log('✅ Payment verified and user upgraded!');
            setNotification({ 
              message: '🎉 Welcome to Foo Pro! You now have unlimited messages!', 
              type: 'success' 
            });
            
            // Refresh the page to update Pro status
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          } else {
            console.error('❌ Failed to verify payment:', data);
            setNotification({ 
              message: 'Payment received! Please refresh if Pro status does not update.', 
              type: 'info' 
            });
          }
        } catch (error) {
          console.error('❌ Error verifying payment:', error);
          setNotification({ 
            message: 'Payment received! Please refresh if Pro status does not update.', 
            type: 'info' 
          });
        }
      } else if (upgrade === 'cancelled') {
        setNotification({ 
          message: 'Upgrade cancelled. You can try again anytime!', 
          type: 'info' 
        });
        // Clean up URL
        window.history.replaceState({}, '', '/');
      }
      
      // Handle tip success
      const tip = urlParams.get('tip');
      const tipAmount = urlParams.get('amount');
      
      if (tip === 'success' && tipAmount) {
        console.log('🍔 Successful tip received:', tipAmount);
        setNotification({ 
          message: `Thank you for your $${tipAmount} tip! 🍔 You're awesome!`, 
          type: 'success' 
        });
        // Clean up URL
        window.history.replaceState({}, '', '/');
      } else if (tip === 'cancelled') {
        setNotification({ 
          message: 'Tip cancelled. Thanks for considering it!', 
          type: 'info' 
        });
        // Clean up URL
        window.history.replaceState({}, '', '/');
      }
      
      // Handle AF Voice subscription success
      const afvoice = urlParams.get('afvoice');
      const afSessionId = urlParams.get('session_id');
      
      if (afvoice === 'success' && afSessionId) {
        console.log('🎤 Successful AF Voice subscription detected, verifying...');
        
        try {
          const response = await fetch('/api/checkout-success', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: afSessionId })
          });
          
          const data = await response.json();
          
          if (response.ok) {
            console.log('✅ AF Voice subscription verified!');
            setNotification({ 
              message: '🎤 Welcome to AF Voice Mode! You can now use Advanced Foo Mode!', 
              type: 'success' 
            });
            
            // Refresh the page to update AF Voice status
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          } else {
            console.error('❌ Failed to verify AF Voice subscription:', data);
            setNotification({ 
              message: 'Subscription received! Please refresh if AF Voice does not activate.', 
              type: 'info' 
            });
          }
        } catch (error) {
          console.error('❌ Error verifying AF Voice subscription:', error);
          setNotification({ 
            message: 'Subscription received! Please refresh if AF Voice does not activate.', 
            type: 'info' 
          });
        }
      } else if (afvoice === 'cancelled') {
        setNotification({ 
          message: 'AF Voice subscription cancelled. You can try again anytime!', 
          type: 'info' 
        });
        // Clean up URL
        window.history.replaceState({}, '', '/');
      }
    };
    
    handleURLParams();
  }, []);

  // Fetch usage on mount
  useEffect(() => {
    const fetchUsage = async () => {
      if (user && !isPro) {
        try {
          const response = await fetch('/api/usage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
          });
          
          if (response.ok) {
            const data = await response.json();
            setMessagesLeft(data.messagesLeft || 10);
          } else {
            // Fallback to default
            setMessagesLeft(10);
          }
        } catch (error) {
          console.error('Failed to fetch usage:', error);
          setMessagesLeft(10);
        }
      } else if (isPro) {
        setMessagesLeft(Infinity);
      }
    };
    
    fetchUsage();
  }, [user, isPro]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotification({ message: 'Please select an image file', type: 'error' });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setNotification({ message: 'Image must be smaller than 20MB', type: 'error' });
      return;
    }

    console.log('📸 Image selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAFImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotification({ message: 'Please select an image file', type: 'error' });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setNotification({ message: 'Image must be smaller than 20MB', type: 'error' });
      return;
    }

    console.log('========================');
    console.log('📸 [AF] NEW IMAGE SELECTED!');
    console.log('📸 [AF] File name:', file.name);
    console.log('📸 [AF] File size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
    console.log('📸 [AF] File type:', file.type);
    console.log('📸 [AF] Replacing old image (if any)...');
    console.log('========================');
    
    // Clear old image preview URL to avoid memory leaks
    if (afImagePreview) {
      URL.revokeObjectURL(afImagePreview);
    }
    
    // Update state with NEW image
    setAfImage(file);
    setAfImagePreview(URL.createObjectURL(file));
    setNotification({ message: '📸 Photo added! Say something about it', type: 'success' });
    
    // CRITICAL: Replace the window reference with NEW image
    (window as any).__debugAfImage = file;
    console.log('📸 [AF] Updated window.__debugAfImage with NEW image:', file.name);
    
    // Verify state was set (will show in next render)
    setTimeout(() => {
      console.log('📸 [AF] State check - new file in memory:', file.name);
      console.log('📸 [AF] window.__debugAfImage name:', (window as any).__debugAfImage?.name);
    }, 100);
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;

    // Check crisis lockout
    if (crisisLockoutUntil && crisisLockoutUntil > Date.now()) {
      const minutesLeft = Math.ceil((crisisLockoutUntil - Date.now()) / 60000);
      setNotification({ 
        message: `🚨 Foo can't respond right now. Please use the crisis resources provided. (${minutesLeft} min remaining)`, 
        type: 'error' 
      });
      setInputText('');
      return;
    }

    // GUEST USER LIMIT: Block after 10 messages, require sign up
    if (!user) {
      if (guestMessageCount >= 10) {
        console.log('🚫 Guest user has reached 10 message limit');
        setNotification({ 
          message: '🔒 Free trial complete! Sign up to keep chatting with Foo (it\'s free!)', 
          type: 'info' 
        });
        setShowAuthModal(true);
        return;
      }
      console.log(`📊 Guest message ${guestMessageCount + 1}/10`);
    }

    // Check usage limits for signed-in free users
    if (user && !isPro && messagesLeft <= 0) {
      setNotification({ message: 'Daily limit reached! Upgrade to Foo Pro for unlimited chats.', type: 'error' });
      setShowPricingModal(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      imageUrl: imagePreview || undefined,
      timestamp: new Date()
    };

    // Save image reference BEFORE clearing state
    const imageToSend = selectedImage;
    const imagePreviewUrl = imagePreview;

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setSelectedImage(null);
    setImagePreview(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', userMessage.content);
      // Use saved reference instead of cleared state
      if (imageToSend) {
        console.log('📸 Adding image to request:', imageToSend.name);
        formData.append('image', imageToSend);
      }
      // For testing: voice is free for everyone
      formData.append('includeVoice', 'true'); // TODO: Change back to isPro ? 'true' : 'false' when going to production
      formData.append('advancedVoice', useAdvancedVoice ? 'true' : 'false');
      
      // Add conversation history for context (last 30 messages for better memory)
      const recentMessages = messages.slice(-30).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      formData.append('conversationHistory', JSON.stringify(recentMessages));
      
      if (user) {
        formData.append('userId', user.id);
        formData.append('isPro', isPro ? 'true' : 'false');
      }

      console.log('📤 Sending message to Foo...', {
        messageLength: userMessage.content.length,
        hasImage: !!imageToSend,
        includeVoice: true,
        advancedVoice: useAdvancedVoice,
        conversationLength: recentMessages.length,
        totalMessages: messages.length + 1 // +1 for current message
      });

      // Add 30 second timeout to the fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('⏰ Request timeout after 30 seconds');
        controller.abort();
      }, 30000);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('📡 Response received:', {
          status: response.status,
          ok: response.ok
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('❌ API Error:', error);
          
          // Handle limit exceeded specially
          if (response.status === 402 || error.code === 'LIMIT_EXCEEDED') {
            setMessagesLeft(0);
            setShowPricingModal(true);
            throw new Error(error.error || 'Daily limit reached');
          }
          
          throw new Error(error.error || 'Failed to get response');
        }

        const data = await response.json();
        console.log('✅ Data received:', {
          hasMessage: !!data.message,
          hasAudio: !!data.audioUrl,
          messageLength: data.message?.length,
          crisis: data.crisis,
          imageSent: !!imageToSend
        });
        
        if (imageToSend) {
          console.log('📸 Image was sent with this message - Foo should have analyzed it');
        }

      const assistantMessage: Message = {
        id: Date.now().toString() + '-ai',
        role: 'assistant',
        content: data.message,
        audioUrl: data.audioUrl,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
        // Clear file input to allow re-selecting same image
        if (fileInputRef.current && imageToSend) {
          fileInputRef.current.value = '';
          console.log('🧹 Cleared file input');
        }
      
        // Crisis prevention: Lock AI responses for 1 hour
        if (data.crisis) {
          console.log('🚨 Crisis response - locking AI for 1 hour');
          const lockoutTime = data.crisisTimestamp ? data.crisisTimestamp + (60 * 60 * 1000) : Date.now() + (60 * 60 * 1000);
          setCrisisLockoutUntil(lockoutTime);
          localStorage.setItem('crisisLockoutUntil', lockoutTime.toString());
          setNotification({ 
            message: '🆘 Crisis resources provided. Foo will not respond for 1 hour. Please use the helplines.', 
            type: 'error' 
          });
        }
      
        // Update messages left from server response
        if (user && !isPro && data.messagesLeft !== undefined) {
          setMessagesLeft(data.messagesLeft);
        }
        
        // Increment guest message count
        if (!user) {
          const newCount = guestMessageCount + 1;
          setGuestMessageCount(newCount);
          setMessagesLeft(Math.max(0, 10 - newCount));
          localStorage.setItem('foochat_guestMessageCount', newCount.toString());
          localStorage.setItem('foochat_guestMessageTimestamp', Date.now().toString());
          console.log(`✅ Guest message count: ${newCount}/10 (${10 - newCount} remaining)`);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Handle abort/timeout errors
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. Foo took too long. Try again?');
        }
        
        throw fetchError;
      }

    } catch (error: any) {
      console.error('❌ Chat error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 200)
      });
      
      let errorMessage = error.message || 'Failed to send message';
      
      // More specific error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network error. Check your connection and try again.';
      }
      
      setNotification({ message: errorMessage, type: 'error' });
      
      // Remove user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (audioUrl: string, messageId?: string) => {
    // Stop any currently playing audio
    if (currentAudioRef.current) {
      console.log('⏹️ Stopping previous audio');
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    console.log('🔊 Playing audio for message:', messageId);
    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;

    audio.onended = () => {
      console.log('🔚 Audio playback finished');
      currentAudioRef.current = null;
    };

    audio.onerror = (err) => {
      console.error('❌ Audio playback error:', err);
      setNotification({ message: 'Failed to play audio', type: 'error' });
      currentAudioRef.current = null;
    };

    audio.play().catch(err => {
      console.error('❌ Audio play error:', err);
      setNotification({ message: 'Failed to play audio', type: 'error' });
      currentAudioRef.current = null;
    });
  };

  const stopAudio = () => {
    if (currentAudioRef.current) {
      console.log('⏹️ Stopping audio playback');
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
  };

  const createAFAudio = () => {
    // Clean up any existing audio first
    if (afAudioRef.current) {
      console.log('🧹 [AF] Cleaning up previous audio element...');
      // Remove event handlers first to prevent error loops
      afAudioRef.current.onended = null;
      afAudioRef.current.onerror = null;
      afAudioRef.current.pause();
      // DON'T set src to '' - causes error loop!
      afAudioRef.current = null;
    }
    
    // Create fresh audio element during user gesture to enable autoplay on mobile
    console.log('🎵 [AF] Creating NEW audio element during user gesture...');
    const audio = new Audio();
    audio.preload = 'auto';
    afAudioRef.current = audio;
    
    audio.onplay = () => {
      console.log('🎵 [AF] Audio started playing!');
      setAfStatus('playing');
    };
    
    audio.onpause = () => {
      console.log('⏸️ [AF] Audio paused');
    };
    
    audio.onended = () => {
      console.log('🔚 [AF] Audio finished - Starting to listen again...');
      
      // Remove handlers to prevent infinite error loops
      if (audio) {
        audio.onended = null;
        audio.onerror = null;
      }
      
      // Clean up audio but DON'T set src to '' (causes errors)
      if (afAudioRef.current) {
        afAudioRef.current.pause();
        afAudioRef.current.currentTime = 0;
        // DON'T set src to '' - that triggers error loop!
      }
      
      // Clear previous texts but KEEP THE IMAGE (user might want to ask about it again)
      setAfUserText('');
      setAfFooText('');
      // DON'T clear afImage or afImagePreview here - let user remove it manually if they want
      setAfStatus('idle');
      
      console.log('📸 [AF] Keeping image for potential re-use');
      
      // Auto-restart listening
      setTimeout(() => {
        if (!isAFModeRef.current) {
          console.warn('⚠️ [AF] AF mode was closed, not restarting');
          return;
        }
        
        if (isMobile) {
          console.log('🔄 [AF] Restarting mobile recording...');
          startMobileRecording();
        } else {
          console.log('🔄 [AF] Restarting desktop recognition...');
          startAdvancedFoo();
        }
      }, 500);
    };
    
    audio.onerror = (e) => {
      // 🚨 CRITICAL: Remove this handler immediately to prevent infinite loop
      audio.onerror = null;
      
      // Only log if it's a real error (not empty src)
      if (audio.error && audio.error.code !== 4) {
        console.error('❌ [AF] Audio error (non-empty-src):', audio.error);
      }
      
      // Don't restart or do anything - just ignore empty src errors
      // The next audio response will set a real src
    };
    
    return audio;
  };

  const startMobileRecording = async () => {
    console.log('📱 [START] Starting mobile recording...');
    console.log('📸 [START] Image state at recording start:', afImage ? 'EXISTS (' + afImage.name + ')' : '❌ NULL');
    
    // 🔒 CRITICAL: Check if we're still processing the previous turn
    if (isProcessingRef.current) {
      console.warn('⚠️ Still processing previous recording - skipping');
      return;
    }
    
    // 🎵 CRITICAL: Check if audio is still playing - DON'T INTERRUPT FOO MID-SENTENCE!
    if (afAudioRef.current && !afAudioRef.current.paused) {
      console.warn('⚠️ Audio still playing - waiting for it to finish...');
      // Wait for audio to finish before starting new recording
      const waitForAudio = () => {
        if (afAudioRef.current && !afAudioRef.current.paused) {
          setTimeout(waitForAudio, 200);
        } else {
          console.log('✅ Audio finished - now starting recording');
          startMobileRecording();
        }
      };
      setTimeout(waitForAudio, 200);
      return;
    }
    
    // Check crisis lockout
    if (crisisLockoutUntil && crisisLockoutUntil > Date.now()) {
      const minutesLeft = Math.ceil((crisisLockoutUntil - Date.now()) / 60000);
      setNotification({ 
        message: `🚨 AF mode unavailable. (${minutesLeft} min remaining)`, 
        type: 'error' 
      });
      return;
    }
    
    // 🧹 SIMPLIFIED CLEANUP: Non-blocking, fire and forget
    try {
      if (mediaRecorderRef.current) {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
        mediaRecorderRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      audioChunksRef.current = [];
      if (abortControllerRef.current) {
        try { abortControllerRef.current.abort(); } catch (e) {}
        abortControllerRef.current = null;
      }
    } catch (e) {
      console.warn('⚠️ Cleanup error (non-critical):', e);
    }
    console.log('🌐 User Agent:', navigator.userAgent);
    console.log('🔒 Secure Context:', window.isSecureContext);
    console.log('📍 Protocol:', window.location.protocol);
    console.log('🏠 Hostname:', window.location.hostname);
    console.log('🎤 MediaRecorder available:', typeof MediaRecorder !== 'undefined');
    console.log('📹 getUserMedia available:', !!(navigator.mediaDevices?.getUserMedia));
    
    // Check if we're in a secure context (HTTPS or localhost)
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('192.168');
    
    if (!window.isSecureContext && !isLocalhost) {
      console.error('❌ Not a secure context and not localhost');
      setNotification({ 
        message: `Voice needs HTTPS. Current: ${window.location.protocol}//${window.location.hostname}`, 
        type: 'error' 
      });
      return;
    }
    
    console.log('✅ Secure context check passed (HTTPS or localhost)');

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ getUserMedia not supported');
      console.log('Available APIs:', {
        mediaDevices: !!navigator.mediaDevices,
        getUserMedia: !!(navigator.mediaDevices?.getUserMedia)
      });
      setNotification({ 
        message: 'Voice recording not supported. Try Chrome or update your browser.', 
        type: 'error' 
      });
      return;
    }

    // Don't check for MediaRecorder yet - it might be available after getting stream on iOS
    console.log('✅ getUserMedia available, proceeding...');
    
    try {
      // Request microphone permission with timeout
      console.log('🎤 [STEP 1] Requesting microphone...');
      
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({ audio: true }),
        new Promise<MediaStream>((_, reject) => 
          setTimeout(() => reject(new Error('Microphone request timed out')), 10000)
        )
      ]);
      
      console.log('✅ [STEP 2] Microphone access granted');
      
      // Store stream for cleanup
      mediaStreamRef.current = stream;
      
      console.log('[STEP 3] Stream tracks:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
      
      // NOW check if MediaRecorder is supported (after getting stream)
      console.log('[STEP 4] Checking MediaRecorder support...');
      if (typeof MediaRecorder === 'undefined') {
        console.error('❌ MediaRecorder not available even after stream');
        stream.getTracks().forEach(track => track.stop());
        setNotification({ 
          message: 'Audio recording not available on this device/browser combination.', 
          type: 'error' 
        });
        return;
      }
      
      console.log('[STEP 5] Setting AF mode state...');
      
      // DON'T clear text here - let it stay visible until new text arrives
      // Text will be cleared when we set new afUserText or afFooText
      
      setIsAFMode(true);
      setIsRecording(true);
      setAfStatus('recording');
      audioChunksRef.current = [];
      
      console.log('[STEP 6] Creating audio element...');
      createAFAudio();

      console.log('[STEP 7] Creating MediaRecorder...');

      // Create MediaRecorder - simple, no MIME type fuss
      let mediaRecorder;
      let mimeType = '';
      
      try {
        mediaRecorder = new MediaRecorder(stream);
        mimeType = mediaRecorder.mimeType || 'audio/webm';
        console.log('[STEP 8] MediaRecorder created, type:', mimeType);
      } catch (e2) {
        console.error('❌ Failed to create MediaRecorder:', e2);
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setIsAFMode(false);
        setNotification({ 
          message: 'Could not start recording. Browser may not support audio recording.', 
          type: 'error' 
        });
        return;
      }
      
      mediaRecorderRef.current = mediaRecorder;
      console.log('[STEP 9] MediaRecorder ready, state:', mediaRecorder.state);

      console.log('[STEP 10] Setting up event handlers...');
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('📦 Chunk:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = () => {
        console.log('[ONSTOP] Recording stopped');
        setIsRecording(false);
        
        // Stop all tracks
        stream.getTracks().forEach(track => {
          try { track.stop(); } catch (e) {}
        });
        mediaStreamRef.current = null;
        
        // Process async
        const recordedType = mediaRecorder.mimeType || mimeType || 'audio/webm';
        console.log('[ONSTOP] Scheduling processRecording...');
        setTimeout(() => {
          console.log('[PROCESS] Starting processRecording()');
          processRecording(recordedType);
        }, 100);
      };

      console.log('[STEP 11] Setting up silence detection...');
      
      // Set up Web Audio API for silence detection
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioSource = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      audioSource.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let silenceStart: number | null = null;
      let hasDetectedSpeech = false;
      const SILENCE_THRESHOLD = 15; // Audio level threshold (lower = more sensitive)
      const SILENCE_DURATION = 2000; // Stop after 2 seconds of silence
      const MIN_SPEECH_DURATION = 500; // Must speak for at least 0.5 seconds
      
      // Silence detection loop
      const checkAudioLevel = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
          return;
        }
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        if (average > SILENCE_THRESHOLD) {
          // Speaking detected
          silenceStart = null;
          if (!hasDetectedSpeech) {
            hasDetectedSpeech = true;
            console.log('🗣️ Speech detected!');
          }
        } else if (hasDetectedSpeech) {
          // Silence detected after speech
          if (silenceStart === null) {
            silenceStart = Date.now();
            console.log('🤫 Silence started...');
          } else {
            const silenceDuration = Date.now() - silenceStart;
            if (silenceDuration >= SILENCE_DURATION) {
              console.log('✅ Silence detected for 2s - auto-stopping recording');
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
              }
              return; // Stop checking
            }
          }
        }
        
        // Continue checking
        setTimeout(checkAudioLevel, 100);
      };
      
      console.log('[STEP 12] Starting recording with auto-silence detection...');
      mediaRecorder.start(1000);
      console.log('[STEP 13] Recording started - will auto-stop when you finish speaking');
      
      // Start silence detection after a brief delay (let them start speaking)
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          checkAudioLevel();
        }
      }, 500);
      
      // Backup safety timeout - 30 seconds max
      setTimeout(() => {
        console.log('[TIMEOUT] 30 seconds max - stopping...');
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 30000);

    } catch (error: any) {
      console.error('❌ Recording error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code
      });
      
      // Clean up on error
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      
      setIsRecording(false);
      setIsAFMode(false);
      
      let errorMessage = 'Could not access microphone';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Microphone permission denied. Please allow access and try again.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setNotification({ message: errorMessage, type: 'error' });
    }
  };

  // 🎯 SEPARATE ASYNC FUNCTION: Process recording outside of event handler
  const processRecording = async (recordedMimeType: string) => {
    // 🔒 LOCK: Set processing flag
    console.log('🔒 [LOCK] Setting processing lock');
    isProcessingRef.current = true;
    
    try {
      console.log('📦 Audio chunks collected:', audioChunksRef.current.length);
      const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
      console.log('📏 Total size:', totalSize, 'bytes');

      // Check maximum recording size (10MB limit to prevent crashes)
      const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
      if (totalSize > MAX_AUDIO_SIZE) {
        console.error('❌ Audio too large:', totalSize, 'bytes');
        audioChunksRef.current = []; // Clear chunks
        setIsAFMode(false);
        setIsListening(false);
        setAfStatus('idle');
        setNotification({ message: 'Recording too long. Please keep it under 30 seconds.', type: 'error' });
        isProcessingRef.current = false; // 🔓 Release lock
        return;
      }

      // Create audio blob with the recorded MIME type
      const audioBlob = new Blob(audioChunksRef.current, { type: recordedMimeType });
      console.log('🎵 Audio blob created:', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      // Clear audio chunks immediately after blob creation to free memory
      audioChunksRef.current = [];
      console.log('🧹 Audio chunks cleared from memory');

      // Very lenient threshold - let Whisper try even with minimal audio
      // Only reject if literally no data
      if (audioBlob.size < 50) {
        console.warn('⚠️ No audio data:', audioBlob.size, 'bytes');
        setIsListening(false);
        setAfStatus('idle');
        setNotification({ message: 'No audio captured. Try again.', type: 'error' });
        
        isProcessingRef.current = false; // 🔓 Release lock
        
        // Restart automatically
        setTimeout(() => {
          if (isAFModeRef.current) {
            startMobileRecording();
          }
        }, 1500);
        return;
      }

      console.log('✅ Audio size acceptable, proceeding with transcription...');

      // ⚠️ CRITICAL: MASTER TIMEOUT - Force restart if ANYTHING hangs
      let masterTimeoutId: NodeJS.Timeout | null = null;
      let isProcessingComplete = false;
      let audioPlaybackStarted = false;
      
      const emergencyRestart = () => {
        if (isProcessingComplete) return;
        
        // DON'T force restart if audio is playing - that causes mid-sentence cutoffs!
        if (audioPlaybackStarted && afAudioRef.current && !afAudioRef.current.paused) {
          console.log('⏸️ [EMERGENCY] Audio is playing - extending timeout...');
          // Extend timeout if audio is actually playing
          if (masterTimeoutId) {
            clearTimeout(masterTimeoutId);
          }
          masterTimeoutId = setTimeout(emergencyRestart, 30000); // Give 30 more seconds
          return;
        }
        
        console.error('🚨 EMERGENCY: Processing hung - forcing restart!');
        isProcessingComplete = true;
        
        // Force cleanup of ALL resources
        if (mediaStreamRef.current) {
          console.log('🛑 [EMERGENCY] Stopping media stream');
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }
        
        if (mediaRecorderRef.current) {
          console.log('🛑 [EMERGENCY] Stopping media recorder');
          try {
            if (mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
          } catch (e) {}
          mediaRecorderRef.current = null;
        }
        
        if (audioContextRef.current) {
          console.log('🛑 [EMERGENCY] Closing audio context');
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
        
        if (abortControllerRef.current) {
          try { abortControllerRef.current.abort(); } catch (e) {}
          abortControllerRef.current = null;
        }
        audioChunksRef.current = [];
        
        // Reset UI
        setIsListening(false);
        setIsLoading(false);
        setAfStatus('idle');
        setAfUserText('');
        setAfFooText('');
        
        // 🔓 Release lock before restarting
        console.log('🔓 [LOCK] Releasing processing lock (emergency)');
        isProcessingRef.current = false;
        
        // Show error and restart
        setNotification({ message: 'Processing took too long. Restarting...', type: 'error' });
        
        setTimeout(() => {
          if (isAFModeRef.current) {
            console.log('🔄 Emergency restart: starting new recording...');
            startMobileRecording();
          }
        }, 1500);
      };
      
      // Set master timeout - 60 seconds for API calls (extended during audio playback)
      masterTimeoutId = setTimeout(emergencyRestart, 60000);

      // Transcribe audio using Whisper
      setIsListening(true); // Show "thinking" state
      setAfStatus('processing');
      console.log('🔄 AF Status: processing (transcribing)');
      
      try {
          const formData = new FormData();
          // Use appropriate file extension based on MIME type
          const extension = recordedMimeType.includes('mp4') ? 'mp4' : 
                           recordedMimeType.includes('ogg') ? 'ogg' : 
                           recordedMimeType.includes('wav') ? 'wav' : 'webm';
          formData.append('audio', audioBlob, `recording.${extension}`);

          console.log('📤 Sending audio for transcription...', {
            size: audioBlob.size,
            type: audioBlob.type,
            filename: `recording.${extension}`
          });
          
          // Create AbortController with timeout for this request
          abortControllerRef.current = new AbortController();
          const transcribeTimeoutId = setTimeout(() => {
            console.error('⏰ Transcription timeout after 30 seconds');
            abortControllerRef.current?.abort();
          }, 30000); // 30 second timeout for transcription
          
          console.log('🌐 Fetching transcription...');
          const transcribeResponse = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
            signal: abortControllerRef.current.signal
          }).catch(error => {
            console.error('🌐 Fetch error:', error);
            throw error;
          });
          
          clearTimeout(transcribeTimeoutId);
          console.log('✅ Transcription fetch complete');

          console.log('📡 Transcription response status:', transcribeResponse.status);

          if (!transcribeResponse.ok) {
            const errorData = await transcribeResponse.json().catch(() => ({}));
            console.error('❌ Transcription failed:', errorData);
            throw new Error(errorData.error || 'Transcription failed');
          }

          const transcriptionData = await transcribeResponse.json();
          console.log('📦 Transcription data:', transcriptionData);
          
          const text = transcriptionData.text;
          console.log('📝 Transcription text:', text);

          if (!text || text.trim().length === 0) {
            console.warn('⚠️ Empty transcription');
            throw new Error('Could not understand speech. Try speaking louder.');
          }

          // Show user's transcription on AF screen
          setAfUserText(text.trim());
          setIsListening(false);
          setAfStatus('getting_response');
          setIsLoading(true); // Show "Getting response..."
          console.log('🔄 AF Status: getting_response');

          // 📸 SAVE IMAGE REFERENCE BEFORE ANY STATE CHANGES
          console.log('========================');
          console.log('🔍 [AF-MOBILE] ABOUT TO SEND MESSAGE');
          console.log('🔍 [AF-MOBILE] Checking for image...');
          console.log('🔍 [AF-MOBILE] afImage state:', afImage ? {
            name: afImage.name,
            size: afImage.size,
            type: afImage.type
          } : '❌ NULL - NO IMAGE IN STATE!');
          console.log('🔍 [AF-MOBILE] afImagePreview:', afImagePreview ? 'EXISTS' : 'NULL');
          console.log('🔍 [AF-MOBILE] window.__debugAfImage:', (window as any).__debugAfImage ? {
            name: (window as any).__debugAfImage?.name
          } : 'NULL');
          
          // ALWAYS prefer state if it exists, only use window as emergency fallback
          let imageToSend = afImage;
          if (!imageToSend && (window as any).__debugAfImage) {
            console.warn('⚠️ [AF-MOBILE] State was null, using window.__debugAfImage as fallback!');
            console.warn('⚠️ [AF-MOBILE] Fallback image:', (window as any).__debugAfImage?.name);
            imageToSend = (window as any).__debugAfImage;
          }
          const imagePreviewToShow = afImagePreview;
          
          console.log('🔍 [AF-MOBILE] FINAL imageToSend:', imageToSend ? {
            name: imageToSend.name,
            size: imageToSend.size,
            type: imageToSend.type,
            source: imageToSend === afImage ? 'STATE' : 'WINDOW_FALLBACK'
          } : '❌ NULL - NO IMAGE TO SEND!');
          console.log('========================');

          // Send to Foo
          const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text.trim(),
            imageUrl: imagePreviewToShow || undefined,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, userMessage]);

          const chatFormData = new FormData();
          chatFormData.append('message', userMessage.content);
          
          // Add image using SAVED REFERENCE (not state that might get cleared)
          if (imageToSend) {
            console.log('✅ [AF-MOBILE] ADDING IMAGE TO FORMDATA:', imageToSend.name, 'Size:', (imageToSend.size / 1024).toFixed(2) + 'KB');
            chatFormData.append('image', imageToSend);
            
            // Verify it was added
            console.log('✅ [AF-MOBILE] FormData has image:', chatFormData.has('image'));
          } else {
            console.log('❌ [AF-MOBILE] NO IMAGE TO SEND - imageToSend is null/undefined');
          }
          
          // For AF mode, request voice to be generated
          chatFormData.append('includeVoice', 'true');
          chatFormData.append('advancedVoice', 'true');
          chatFormData.append('afMode', 'true'); // Signal for speed optimization
          
          // Add conversation history for context (last 30 messages for better memory)
          const recentMessages = messages.slice(-30).map(msg => ({
            role: msg.role,
            content: msg.content
          }));
          chatFormData.append('conversationHistory', JSON.stringify(recentMessages));
          
          if (user) {
            chatFormData.append('userId', user.id);
            chatFormData.append('isPro', isPro ? 'true' : 'false');
          }

          console.log('💬 [AF-MOBILE] Sending to Foo:', {
            messageLength: userMessage.content.length,
            hasImage: !!imageToSend,
            imageSize: imageToSend ? (imageToSend.size / 1024).toFixed(2) + 'KB' : 'N/A',
            conversationLength: recentMessages.length,
            totalMessages: messages.length + 1 // +1 for current message
          });

          // Create AbortController with timeout for this request
          abortControllerRef.current = new AbortController();
          const chatTimeoutId = setTimeout(() => {
            console.error('⏰ Chat request timeout after 40 seconds');
            abortControllerRef.current?.abort();
          }, 40000); // 40 second timeout for chat (includes OpenAI + ElevenLabs)

          console.log('🌐 Fetching chat response...');
          const chatResponse = await fetch('/api/chat', {
            method: 'POST',
            body: chatFormData,
            signal: abortControllerRef.current.signal
          }).catch(error => {
            console.error('🌐 Chat fetch error:', error);
            throw error;
          });
          
          clearTimeout(chatTimeoutId);
          console.log('✅ Chat fetch complete');

          console.log('📡 Chat response status:', chatResponse.status);

          if (!chatResponse.ok) {
            const error = await chatResponse.json().catch(() => ({}));
            console.error('❌ Chat failed:', error);
            throw new Error(error.error || 'Failed to get response');
          }

          const data = await chatResponse.json();
          console.log('📦 Chat response:', {
            hasMessage: !!data.message,
            hasAudio: !!data.audioUrl,
            messageLength: data.message?.length,
            crisis: data.crisis,
            imageSent: !!imageToSend
          });

          if (imageToSend) {
            console.log('✅ [AF-MOBILE] Image was sent - Foo should have analyzed it');
          }

          const assistantMessage: Message = {
            id: Date.now().toString() + '-ai',
            role: 'assistant',
            content: data.message,
            audioUrl: data.audioUrl,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, assistantMessage]);

          // Clear AF file input after successful send
          if (afFileInputRef.current && imageToSend) {
            afFileInputRef.current.value = '';
            console.log('🧹 [AF-MOBILE] Cleared AF file input');
          }

          if (!isPro && data.messagesLeft !== undefined) {
            setMessagesLeft(data.messagesLeft);
          }

          // Crisis prevention: Lock AI and stop AF mode if crisis detected
          if (data.crisis) {
            console.log('🚨 Crisis response - locking AI and stopping AF mode (mobile)');
            const lockoutTime = data.crisisTimestamp ? data.crisisTimestamp + (60 * 60 * 1000) : Date.now() + (60 * 60 * 1000);
            setCrisisLockoutUntil(lockoutTime);
            localStorage.setItem('crisisLockoutUntil', lockoutTime.toString());
            setIsAFMode(false);
            setAfUserText('');
            setAfFooText('');
            setAfStatus('idle');
            setIsLoading(false);
            setNotification({ 
              message: '🆘 Crisis resources provided. Foo will not respond for 1 hour. Please use the helplines.', 
              type: 'error' 
            });
            return;
          }

          // Show Foo's response on AF screen
          setAfFooText(data.message);
          setIsLoading(false);
          
          // ✅ Clear master timeout - we made it!
          if (masterTimeoutId) {
            clearTimeout(masterTimeoutId);
            masterTimeoutId = null;
            isProcessingComplete = true;
            console.log('✅ Master timeout cleared - processing successful!');
          }

          // 🔓 Release lock IMMEDIATELY after successful processing
          console.log('🔓 [LOCK] Releasing processing lock (success)');
          isProcessingRef.current = false;

          // Auto-play voice using pre-created audio element
          if (data.audioUrl) {
            console.log('🔊 [AF-MOBILE] Playing voice...');
            
            // ALWAYS reuse the same audio element to avoid glitches
            let audio = afAudioRef.current;
            
            if (!audio) {
              console.log('🎵 [AF-MOBILE] Creating audio element (first time)');
              audio = new Audio();
              afAudioRef.current = audio;
            } else {
              // Clean up previous handlers to avoid duplicate calls
              audio.onended = null;
              audio.onerror = null;
              audio.pause();
            }
            
            // 🎯 Restart function
            let isRestarting = false; // Guard against multiple simultaneous restarts
            const restartListening = () => {
              console.log('🔄 [AF-MOBILE] Restarting...');
              
              // Guard against multiple restart calls
              if (isRestarting) {
                console.warn('⚠️ [AF-MOBILE] Already restarting, skipping...');
                return;
              }
              
              // Quick exit checks
              if (!isAFModeRef.current) {
                console.warn('⚠️ [AF-MOBILE] AF mode closed');
                return;
              }
              
              if (isProcessingRef.current) {
                console.warn('⚠️ [AF-MOBILE] Still processing');
                return;
              }
              
              isRestarting = true;
              
              // DON'T clear text immediately - keep conversation visible!
              // Text will be cleared when new recording starts
              setAfStatus('idle');
              
              // Restart quickly for smooth flow
              setTimeout(() => {
                if (isAFModeRef.current && !isProcessingRef.current) {
                  startMobileRecording().catch(err => {
                    console.error('❌ [AF-MOBILE] Restart failed:', err);
                    setIsAFMode(false);
                  }).finally(() => {
                    isRestarting = false; // Reset guard
                  });
                } else {
                  isRestarting = false; // Reset guard even if we don't restart
                }
              }, 300);
            };
            
            // Set up handlers
            audio.onended = () => {
              console.log('🔚 [AF-MOBILE] Audio ended naturally');
              audio.onended = null; // Remove immediately to prevent multiple calls
              audio.onerror = null; // Also clear error handler
              
              // Wait a moment before restarting to ensure clean audio completion
              setTimeout(() => {
                restartListening();
              }, 500);
            };
            
            audio.onerror = (e) => {
              console.error('❌ [AF-MOBILE] Audio error occurred:', audio.error);
              audio.onerror = null; // Remove immediately
              audio.onended = null; // Also clear ended handler
              
              // Only restart on real errors (ignore code 4 - empty src)
              if (audio.error && audio.error.code !== 4) {
                console.error('❌ [AF-MOBILE] Real audio error - restarting');
                setTimeout(() => {
                  restartListening();
                }, 500);
              } else {
                console.warn('⚠️ [AF-MOBILE] Ignoring empty src error');
              }
            };
            
            // Play audio (optimized)
            audio.src = data.audioUrl;
            setAfStatus('playing');
            audioPlaybackStarted = true; // Mark that audio playback has started
            console.log('🎵 [AF-MOBILE] Audio playback started - emergency timeout will extend if needed');
            
            audio.play().then(() => {
              console.log('✅ [AF-MOBILE] Playing');
            }).catch((err) => {
              console.error('❌ [AF-MOBILE] Play failed');
              setTimeout(() => restartListening(), 300);
            });
            
          } else {
            console.warn('⚠️ [AF-MOBILE] No audio - restarting quickly');
            
            // No audio - keep text visible and restart
            setAfStatus('idle');
            // DON'T clear text - keep it visible for user
            
            // 🔓 Release lock
            isProcessingRef.current = false;
            console.log('🔓 [LOCK] Releasing processing lock (no audio)');
            
            setTimeout(() => {
              if (isAFModeRef.current && !isProcessingRef.current) {
                console.log('▶️ [AF-MOBILE] Restarting (no audio case)');
                startMobileRecording();
              }
            }, 1500); // Give user time to read the text
          }

        } catch (error: any) {
          console.error('❌ AF Mode Error:', error);
          console.error('Error stack:', error.stack);
          
          // Clear master timeout
          if (masterTimeoutId) {
            clearTimeout(masterTimeoutId);
            masterTimeoutId = null;
            isProcessingComplete = true;
          }
          
          // Clean up audio chunks
          audioChunksRef.current = [];
          
          // Clear any abort controller
          if (abortControllerRef.current) {
            abortControllerRef.current = null;
          }
          
          // If request was aborted (timeout), restart AF mode
          if (error.name === 'AbortError') {
            console.log('⏰ Request timed out - restarting AF mode');
            setNotification({ message: 'Request timed out. Restarting...', type: 'info' });
            setAfUserText('');
            setAfFooText('');
            setAfStatus('idle');
            setIsLoading(false);
            
            // 🔓 Release lock before restarting
            console.log('🔓 [LOCK] Releasing processing lock (timeout)');
            isProcessingRef.current = false;
            
            // Restart listening after brief delay
            setTimeout(() => {
              if (isAFModeRef.current) {
                startMobileRecording();
              }
            }, 1000);
            return;
          }
          
          let errorMessage = 'Something went wrong. Try again.';
          let shouldRestart = false;
          
          if (error.message.includes('transcription') || error.message.includes('Transcription')) {
            errorMessage = 'Didn\'t catch that. Restarting...';
            shouldRestart = true;
          } else if (error.message.includes('speech') || error.message.includes('understand')) {
            errorMessage = 'Didn\'t hear you. Restarting...';
            shouldRestart = true;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          setNotification({ message: errorMessage, type: shouldRestart ? 'info' : 'error' });
          
          // Don't close AF mode on transcription errors - just restart
          if (!shouldRestart) {
            setIsAFMode(false);
          }
          
          setAfUserText('');
          setAfFooText('');
          setIsLoading(false);
          setAfStatus('idle');
          
          // 🔓 Release lock on error
          console.log('🔓 [LOCK] Releasing processing lock (error)');
          isProcessingRef.current = false;
          
          // Auto-restart on transcription/speech errors
          if (shouldRestart) {
            setTimeout(() => {
              if (isAFModeRef.current) {
                startMobileRecording();
              }
            }, 1000);
          }
        } finally {
          setIsListening(false);
          setIsRecording(false);
        }
    } catch (processingError: any) {
      console.error('❌ Processing error:', processingError);
      
      // Clean up
      audioChunksRef.current = [];
      setIsListening(false);
      setIsLoading(false);
      setAfStatus('idle');
      
      // 🔓 Release lock on outer error
      console.log('🔓 [LOCK] Releasing processing lock (outer error)');
      isProcessingRef.current = false;
      
      setNotification({ message: 'Processing failed. Restarting...', type: 'error' });
      
      // Restart after error
      setTimeout(() => {
        if (isAFModeRef.current) {
          startMobileRecording();
        }
      }, 1500);
    }
  };


  const stopAFMode = () => {
    console.log('🛑 Stopping AF Mode completely...');
    
    // Stop media stream first
    if (mediaStreamRef.current) {
      console.log('🎙️ Stopping media stream');
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Stop any ongoing speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Recognition already stopped');
      }
      recognitionRef.current = null;
    }
    
    // Stop any ongoing recording
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn('MediaRecorder already stopped');
        }
      }
      // Clear event handlers
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.onerror = null;
      mediaRecorderRef.current = null;
    }
    
    // Clear all timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
    
    // Stop audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    
    // Stop any playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    
    // Stop AF audio
    if (afAudioRef.current) {
      afAudioRef.current.pause();
      afAudioRef.current = null;
    }
    
    // Abort any ongoing API requests
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {
        console.warn('Abort controller already aborted');
      }
      abortControllerRef.current = null;
    }
    
    // Clear audio chunks to free memory
    audioChunksRef.current = [];
    console.log('🧹 Cleared audio chunks in stopAFMode');
    
    // 🔓 Release processing lock when stopping AF mode
    console.log('🔓 [LOCK] Releasing processing lock (stopAFMode)');
    isProcessingRef.current = false;
    
    // Reset all state
    setIsAFMode(false);
    setIsListening(false);
    setIsRecording(false);
    setIsLoading(false);
    setAfUserText('');
    setAfFooText('');
    setAfImage(null);
    setAfImagePreview(null);
    
    // Clear window reference when stopping AF mode
    (window as any).__debugAfImage = null;
    console.log('🗑️ [AF] Cleared window.__debugAfImage on AF mode stop');
    
    if (afFileInputRef.current) {
      afFileInputRef.current.value = '';
    }
    setAfStatus('idle');
    
    console.log('✅ AF Mode stopped');
  };

  const startAdvancedFoo = async () => {
    // Check AF Voice subscription
    if (!hasAFVoice) {
      setNotification({ 
        message: '🎤 AF Voice Mode requires a subscription. Unlock it for just $4.99/mo!', 
        type: 'info' 
      });
      setShowAFVoiceModal(true);
      return;
    }
    
    // Check crisis lockout
    if (crisisLockoutUntil && crisisLockoutUntil > Date.now()) {
      const minutesLeft = Math.ceil((crisisLockoutUntil - Date.now()) / 60000);
      setNotification({ 
        message: `🚨 AF mode unavailable. Please use crisis resources. (${minutesLeft} min remaining)`, 
        type: 'error' 
      });
      return;
    }
    
    // Use mobile recording for mobile devices
    if (isMobile) {
      startMobileRecording();
      return;
    }
    console.log('🎙️ Starting Advanced Foo mode...');
    
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('❌ Speech recognition not supported');
      setNotification({ 
        message: 'Voice mode not supported on this browser. Try Chrome or Edge on desktop.', 
        type: 'error' 
      });
      return;
    }

    // Request microphone permission first
    try {
      console.log('🎤 Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone permission granted');
      
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('❌ Microphone permission denied:', err);
      setNotification({ 
        message: 'Microphone access denied. Please allow microphone access and try again.', 
        type: 'error' 
      });
      return;
    }

    // DON'T clear text here - let previous conversation stay visible
    // Text will be cleared when we set new afUserText or afFooText
    
    setIsAFMode(true);
    setIsListening(true);
    
    // Create audio element during user gesture for mobile autoplay
    createAFAudio();

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition; // Store for cancellation
    
    recognition.continuous = false;
    recognition.interimResults = true; // Show interim results
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onstart = () => {
      console.log('✅ Speech recognition started - speak now!');
      setNotification({ message: '🎤 Listening... speak now!', type: 'info' });
    };

    recognition.onresult = (event: any) => {
      console.log('📝 Speech result received:', event);
      
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          console.log('✅ Final transcript:', finalTranscript);
        } else {
          interimTranscript += transcript;
          console.log('⏳ Interim transcript:', interimTranscript);
        }
      }
      
      // Show interim results in input
      if (interimTranscript) {
        setInputText(interimTranscript);
      }
    };

    recognition.onend = async () => {
      console.log('🛑 Speech recognition ended');
      setIsListening(false);
      
      const transcript = finalTranscript.trim();
      console.log('📝 Final transcript to send:', transcript);
      
      if (!transcript) {
        console.warn('⚠️ No speech detected');
        setIsAFMode(false);
        setNotification({ message: 'No speech detected. Try again.', type: 'error' });
        return;
      }

      // Show user's transcription on AF screen
      setAfUserText(transcript);
      setIsLoading(true);

      // 📸 SAVE IMAGE REFERENCE BEFORE ANY STATE CHANGES
      console.log('========================');
      console.log('🔍 [AF-DESKTOP] ABOUT TO SEND MESSAGE');
      console.log('🔍 [AF-DESKTOP] Checking for image...');
      console.log('🔍 [AF-DESKTOP] afImage state:', afImage ? {
        name: afImage.name,
        size: afImage.size,
        type: afImage.type
      } : '❌ NULL - NO IMAGE IN STATE!');
      console.log('🔍 [AF-DESKTOP] afImagePreview:', afImagePreview ? 'EXISTS' : 'NULL');
      console.log('🔍 [AF-DESKTOP] window.__debugAfImage:', (window as any).__debugAfImage ? {
        name: (window as any).__debugAfImage?.name
      } : 'NULL');
      
      // ALWAYS prefer state if it exists, only use window as emergency fallback
      let imageToSend = afImage;
      if (!imageToSend && (window as any).__debugAfImage) {
        console.warn('⚠️ [AF-DESKTOP] State was null, using window.__debugAfImage as fallback!');
        console.warn('⚠️ [AF-DESKTOP] Fallback image:', (window as any).__debugAfImage?.name);
        imageToSend = (window as any).__debugAfImage;
      }
      const imagePreviewToShow = afImagePreview;
      
      console.log('🔍 [AF-DESKTOP] FINAL imageToSend:', imageToSend ? {
        name: imageToSend.name,
        size: imageToSend.size,
        type: imageToSend.type,
        source: imageToSend === afImage ? 'STATE' : 'WINDOW_FALLBACK'
      } : '❌ NULL - NO IMAGE TO SEND!');
      console.log('========================');

      // Auto-send the message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: transcript,
        imageUrl: imagePreviewToShow || undefined,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);

      try {
        const formData = new FormData();
        formData.append('message', userMessage.content);
        
        // Add image using SAVED REFERENCE (not state that might get cleared)
        if (imageToSend) {
          console.log('✅ [AF-DESKTOP] ADDING IMAGE TO FORMDATA:', imageToSend.name, 'Size:', (imageToSend.size / 1024).toFixed(2) + 'KB');
          formData.append('image', imageToSend);
          
          // Verify it was added
          console.log('✅ [AF-DESKTOP] FormData has image:', formData.has('image'));
        } else {
          console.log('❌ [AF-DESKTOP] NO IMAGE TO SEND - imageToSend is null/undefined');
        }
        
        formData.append('includeVoice', 'true');
        formData.append('advancedVoice', 'true'); // Always use advanced voice in AF mode
        formData.append('afMode', 'true'); // Signal for speed optimization
        
        // Add conversation history for context (last 30 messages for better memory)
        const recentMessages = messages.slice(-30).map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        formData.append('conversationHistory', JSON.stringify(recentMessages));
        
        if (user) {
          formData.append('userId', user.id);
          formData.append('isPro', isPro ? 'true' : 'false');
        }

        console.log('💬 [AF-DESKTOP] Sending to Foo:', {
          messageLength: userMessage.content.length,
          hasImage: !!imageToSend,
          imageSize: imageToSend ? (imageToSend.size / 1024).toFixed(2) + 'KB' : 'N/A',
          conversationLength: recentMessages.length,
          totalMessages: messages.length + 1 // +1 for current message
        });

        // Create AbortController with timeout for this request
        abortControllerRef.current = new AbortController();
        const chatTimeoutId = setTimeout(() => {
          console.error('⏰ Chat request timeout after 40 seconds (desktop)');
          abortControllerRef.current?.abort();
        }, 40000); // 40 second timeout for chat (includes OpenAI + ElevenLabs)

        console.log('🌐 Fetching chat response (desktop)...');
        const response = await fetch('/api/chat', {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current.signal
        }).catch(error => {
          console.error('🌐 Desktop chat fetch error:', error);
          throw error;
        });
        
        clearTimeout(chatTimeoutId);
        console.log('✅ Desktop chat fetch complete');

        if (!response.ok) {
          const error = await response.json();
          if (response.status === 402 || error.code === 'LIMIT_EXCEEDED') {
            setMessagesLeft(0);
            setShowPricingModal(true);
            throw new Error(error.error || 'Daily limit reached');
          }
          throw new Error(error.error || 'Failed to get response');
        }

        const data = await response.json();

        console.log('📦 [AF-DESKTOP] Chat response:', {
          hasMessage: !!data.message,
          hasAudio: !!data.audioUrl,
          messageLength: data.message?.length,
          crisis: data.crisis,
          imageSent: !!imageToSend
        });

        if (imageToSend) {
          console.log('✅ [AF-DESKTOP] Image was sent - Foo should have analyzed it');
        }

        const assistantMessage: Message = {
          id: Date.now().toString() + '-ai',
          role: 'assistant',
          content: data.message,
          audioUrl: data.audioUrl,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Clear AF file input after successful send
        if (afFileInputRef.current && imageToSend) {
          afFileInputRef.current.value = '';
          console.log('🧹 [AF-DESKTOP] Cleared AF file input');
        }
        
        if (!isPro && data.messagesLeft !== undefined) {
          setMessagesLeft(data.messagesLeft);
        }

          // Crisis prevention: Lock AI and stop AF mode if crisis detected
          if (data.crisis) {
            console.log('🚨 Crisis response - locking AI and stopping AF mode (desktop)');
            const lockoutTime = data.crisisTimestamp ? data.crisisTimestamp + (60 * 60 * 1000) : Date.now() + (60 * 60 * 1000);
            setCrisisLockoutUntil(lockoutTime);
            localStorage.setItem('crisisLockoutUntil', lockoutTime.toString());
            setIsAFMode(false);
            setAfUserText('');
            setAfFooText('');
            setAfStatus('idle');
            setIsLoading(false);
            setNotification({ 
              message: '🆘 Crisis resources provided. Foo will not respond for 1 hour. Please use the helplines.', 
              type: 'error' 
            });
            return;
          }

          // Show Foo's response on AF screen
          setAfFooText(data.message);
          setIsLoading(false);

          // Auto-play voice using pre-created audio element
          if (data.audioUrl) {
            console.log('🔊 [AF-DESKTOP] Got audio URL');
            console.log('🔊 [AF-DESKTOP] Audio element exists:', !!afAudioRef.current);
            console.log('🔊 [AF-DESKTOP] Audio element state:', afAudioRef.current ? {
              paused: afAudioRef.current.paused,
              src: afAudioRef.current.src ? 'has src' : 'no src',
              readyState: afAudioRef.current.readyState
            } : 'null');
            console.log('🔊 [AF-DESKTOP] Audio URL length:', data.audioUrl.length);
            
            // Use existing audio element or create fallback
            let audio = afAudioRef.current;
            
            if (!audio || audio.error) {
              console.warn('⚠️ [AF-DESKTOP] No audio element or audio has error! Creating fallback');
              audio = new Audio();
              afAudioRef.current = audio;
            }
            
            // Simple restart function
            const restartListening = () => {
              console.log('🔄 [AF-DESKTOP] Restarting listening...');
              
              // Clean up audio
              if (afAudioRef.current) {
                afAudioRef.current.onended = null;
                afAudioRef.current.onerror = null;
                afAudioRef.current.pause();
                afAudioRef.current.currentTime = 0;
              }
              
              // Reset UI but KEEP TEXT AND IMAGE visible for continuity
              // DON'T clear afUserText/afFooText - keep conversation visible!
              setAfStatus('idle');
              console.log('📸 [AF-DESKTOP] Keeping image and text for continuity');
              
              setTimeout(() => {
                if (isAFModeRef.current) {
                  console.log('▶️ [AF-DESKTOP] Calling startAdvancedFoo()...');
                  startAdvancedFoo();
                } else {
                  console.warn('⚠️ [AF-DESKTOP] AF mode closed, not restarting');
                }
              }, 1000);
            };
            
            // Set up event handlers
            audio.onended = () => {
              console.log('🔚 [AF-DESKTOP] Audio ended naturally');
              restartListening();
            };
            
            audio.onerror = (e) => {
              // Remove handler immediately to prevent loops
              if (audio) {
                audio.onerror = null;
              }
              
              // Only handle real errors (not empty src)
              if (audio.error && audio.error.code !== 4) {
                console.error('❌ [AF-DESKTOP] Audio error:', audio.error);
                restartListening();
              }
              // Ignore empty src errors
            };
            
            // Set source and play
            console.log('📝 [AF-DESKTOP] Setting audio.src and playing...');
            audio.src = data.audioUrl;
            audio.load();
            
            const playPromise = audio.play();
            if (playPromise) {
              playPromise.then(() => {
                console.log('✅ [AF-DESKTOP] Audio is playing!');
                setAfStatus('playing');
              }).catch((err) => {
                console.error('❌ [AF-DESKTOP] Play failed:', err);
                // If play fails, show text and restart
                setNotification({ message: 'Continuing without voice', type: 'info' });
                restartListening();
              });
            } else {
              setAfStatus('playing');
            }
          } else {
            console.warn('⚠️ [AF-DESKTOP] No audio URL in response');
            // No audio - keep text visible and restart listening
            setAfStatus('idle');
            setTimeout(() => {
              if (isAFModeRef.current) {
                startAdvancedFoo();
              }
            }, 2000); // Give user time to read the text
          }

      } catch (error: any) {
        console.error('❌ Chat error:', error);
        
        // If request was aborted (timeout), restart AF mode
        if (error.name === 'AbortError') {
          console.log('⏰ Request timed out - restarting AF mode (desktop)');
          setNotification({ message: 'Request timed out. Restarting...', type: 'info' });
          setAfUserText('');
          setAfFooText('');
          setAfStatus('idle');
          setIsLoading(false);
          setIsListening(false);
          
          // Restart listening after brief delay
          setTimeout(() => {
            if (isAFModeRef.current) {
              startAdvancedFoo();
            }
          }, 1000);
          return;
        }
        
        setNotification({ message: error.message || 'Failed to send message', type: 'error' });
        setMessages(prev => prev.filter(m => m.id !== userMessage.id));
        setIsAFMode(false);
        setAfUserText('');
        setAfFooText('');
      } finally {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error);
      setIsListening(false);
      
      let errorMessage = 'Could not recognize speech. Try again.';
      let shouldRestart = false;
      
      if (event.error === 'no-speech') {
        errorMessage = 'Didn\'t hear you. Restarting...';
        shouldRestart = true;
      } else if (event.error === 'audio-capture') {
        errorMessage = 'Microphone not detected. Check your device settings.';
        setIsAFMode(false);
      } else if (event.error === 'not-allowed') {
        errorMessage = 'Microphone access denied. Enable it in browser settings.';
        setIsAFMode(false);
      } else if (event.error === 'network') {
        errorMessage = 'Network error. Check your internet connection.';
        setIsAFMode(false);
      } else {
        // Other errors - close AF mode
        setIsAFMode(false);
      }
      
      setNotification({ message: errorMessage, type: shouldRestart ? 'info' : 'error' });
      
      // Auto-restart on no-speech
      if (shouldRestart) {
        setAfUserText('');
        setAfFooText('');
        setAfStatus('idle');
        setTimeout(() => {
          if (isAFModeRef.current) {
            startAdvancedFoo();
          }
        }, 1000);
      }
    };

    try {
      console.log('🚀 Starting speech recognition...');
      recognition.start();
    } catch (err) {
      console.error('❌ Failed to start recognition:', err);
      setIsListening(false);
      setIsAFMode(false);
      setNotification({ message: 'Failed to start voice recognition. Try again.', type: 'error' });
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: "Ayy what's good foo? 😎 Fresh start! Hit me with something.",
      timestamp: new Date()
    }]);
  };

  // Always show landing page with chat overlay
  return (
    <>
      {/* Navbar at the top */}
      <Navbar 
        onAuthClick={() => setShowAuthModal(true)}
        onPricingClick={() => setShowPricingModal(true)}
        onTipJarClick={() => setShowTipJarModal(true)}
      />
      
      <div className="min-h-screen flex flex-col landing-bg relative" style={{ 
        background: 'linear-gradient(135deg, #f5e6d3 0%, #e8d5b7 100%)',
      }}>
        
        {/* East Salinas Night Vibes - Police Lights (Dark Mode Only) */}
        {mounted && theme === 'dark' && (
          <>
            {/* Blue light - top left */}
            <div 
              style={{
                position: 'fixed',
                top: '0',
                left: '0',
                width: '50vw',
                height: '50vh',
                background: 'radial-gradient(ellipse at top left, rgba(59, 130, 246, 0.7), transparent 50%)',
                animation: 'fadeInLights 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), policeBlue 4s ease-in-out infinite 0.8s',
                filter: 'blur(60px)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
            
            {/* Red light - top right */}
            <div 
              style={{
                position: 'fixed',
                top: '0',
                right: '0',
                width: '50vw',
                height: '50vh',
                background: 'radial-gradient(ellipse at top right, rgba(239, 68, 68, 0.7), transparent 50%)',
                animation: 'fadeInLights 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), policeRed 4s ease-in-out infinite 0.8s',
                filter: 'blur(60px)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
            
            {/* Blue light - bottom right */}
            <div 
              style={{
                position: 'fixed',
                bottom: '0',
                right: '0',
                width: '50vw',
                height: '50vh',
                background: 'radial-gradient(ellipse at bottom right, rgba(59, 130, 246, 0.65), transparent 50%)',
                animation: 'fadeInLights 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), policeBlue 4s ease-in-out infinite 0.8s',
                filter: 'blur(60px)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
            
            {/* Red light - bottom left */}
            <div 
              style={{
                position: 'fixed',
                bottom: '0',
                left: '0',
                width: '50vw',
                height: '50vh',
                background: 'radial-gradient(ellipse at bottom left, rgba(239, 68, 68, 0.65), transparent 50%)',
                animation: 'fadeInLights 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), policeRed 4s ease-in-out infinite 0.8s',
                filter: 'blur(60px)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          </>
        )}

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-start md:justify-center px-4 pt-8 md:pt-0 text-center relative">
          <div className="max-w-2xl">
            <div className="mb-4 md:mb-6">
              <Image 
                src="/icons/Foo.png" 
                alt="Foo" 
                width={80} 
                height={80}
                className="mx-auto rounded-full shadow-2xl md:w-[120px] md:h-[120px]"
                unoptimized
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-3 md:mb-6 landing-text" style={{ color: '#3d2817' }}>
              FooChat
            </h1>
            <p className="text-xl md:text-3xl mb-2 md:mb-4 font-medium landing-text" style={{ color: '#5a4a3a' }}>
              AI Foo That Talks Like a Local
            </p>
            <p className="text-base md:text-lg mb-6 md:mb-8 max-w-xl mx-auto landing-text-secondary" style={{ color: '#6b5744' }}>
              A chaotic, funny AI that roasts you in full Salinas Foo slang. 
              Send pictures, get roasted. It's that simple, foo.
            </p>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8 max-w-3xl mx-auto">
              <div className="landing-card bg-white/40 backdrop-blur-lg rounded-xl md:rounded-2xl p-3 md:p-6 border-2 shadow-lg" style={{ borderColor: '#d4a574' }}>
                <div className="text-2xl md:text-3xl mb-1 md:mb-2">💬</div>
                <h3 className="font-bold text-xs md:text-base mb-0.5 md:mb-1 landing-text" style={{ color: '#3d2817' }}>Authentic Slang</h3>
                <p className="text-xs md:text-sm landing-text-secondary hidden md:block" style={{ color: '#6b5744' }}>Real Salinas Foo vibes</p>
              </div>
              <div className="landing-card bg-white/40 backdrop-blur-lg rounded-xl md:rounded-2xl p-3 md:p-6 border-2 shadow-lg" style={{ borderColor: '#d4a574' }}>
                <div className="text-2xl md:text-3xl mb-1 md:mb-2">📸</div>
                <h3 className="font-bold text-xs md:text-base mb-0.5 md:mb-1 landing-text" style={{ color: '#3d2817' }}>Send Pics</h3>
                <p className="text-xs md:text-sm landing-text-secondary hidden md:block" style={{ color: '#6b5744' }}>Get roasted instantly</p>
              </div>
              <div className="landing-card bg-white/40 backdrop-blur-lg rounded-xl md:rounded-2xl p-3 md:p-6 border-2 shadow-lg" style={{ borderColor: '#d4a574' }}>
                <div className="text-2xl md:text-3xl mb-1 md:mb-2">🔊</div>
                <h3 className="font-bold text-xs md:text-base mb-0.5 md:mb-1 landing-text" style={{ color: '#3d2817' }}>Voice Mode</h3>
                <p className="text-xs md:text-sm landing-text-secondary hidden md:block" style={{ color: '#6b5744' }}>Hear Foo speak (Pro)</p>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setShowChat(true)}
                  className="px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-base md:text-lg transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)', color: 'white' }}
                >
                  💬 Start Chatting (Free)
                </button>
                <button
                  onClick={() => setShowPricingModal(true)}
                  className="px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-base md:text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2"
                  style={{ 
                    background: 'rgba(255,255,255,0.9)', 
                    color: '#6b5438',
                    borderColor: '#8b6f47'
                  }}
                >
                  ⚡ Go Pro - $5/mo
                </button>
              </div>
              
              {!user && (
                <p className="text-xs md:text-sm landing-text-secondary" style={{ color: '#6b5744' }}>
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="underline hover:no-underline"
                  >
                    Sign in
                  </button> or start free • 10 messages/day • No credit card
                </p>
              )}
              
              {user && (
                <p className="text-xs md:text-sm landing-text-secondary" style={{ color: '#6b5744' }}>
                  Welcome back{isPro && ', Pro user'}! 🎉
                </p>
              )}
            </div>

            {/* Example Messages */}
            <div className="mt-12 space-y-3">
              <div className="landing-card bg-white/50 backdrop-blur-lg rounded-2xl p-4 text-left border-2 shadow-md" style={{ borderColor: '#d4a574' }}>
                <p className="text-sm landing-text" style={{ color: '#3d2817' }}>
                  "Foo really thought that fit was it 💀 Nah but you look good tho, just messin"
                </p>
              </div>
              <div className="landing-card bg-white/50 backdrop-blur-lg rounded-2xl p-4 text-left border-2 shadow-md" style={{ borderColor: '#d4a574' }}>
                <p className="text-sm landing-text" style={{ color: '#3d2817' }}>
                  "No mames, you went to the Steinbeck Center? That's lowkey cultural foo 📚"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-sm landing-text-secondary" style={{ color: '#8b7355' }}>
          Made with 💜 in Salinas
        </div>

        {/* Chat Overlay - Animated */}
        {showChat && (
          <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fadeIn"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowChat(false);
            }}
          >
            {/* Chat Bubble */}
            <div 
              className="w-full sm:max-w-2xl h-[80vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slideUp flex flex-col"
              style={{ background: 'var(--bg-primary)' }}
            >
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between flex-shrink-0" style={{ 
                borderColor: 'var(--border)',
                background: 'var(--bg-secondary)'
              }}>
                <div className="flex items-center gap-3">
                  {/* Tip Button floating to left of avatar */}
                  <button
                    onClick={() => setShowTipJarModal(true)}
                    className="px-2 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 hover:brightness-110 shadow-md flex items-center gap-1"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white'
                    }}
                    title="Support FooChat"
                  >
                    🍔 Tip
                  </button>
                  
                  <Image 
                    src="/icons/Foo.png" 
                    alt="Foo" 
                    width={40} 
                    height={40}
                    className="rounded-full animate-bounce-brief"
                    unoptimized
                  />
                  <div>
                    <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      Foo
                      {isPro && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{
                          background: 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)',
                          color: 'white'
                        }}>
                          PRO
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Online
                        </p>
                        {!isPro && (
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            • {messagesLeft}/10 {user ? 'left today' : 'free messages'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isPro && (
                    <button
                      onClick={() => setShowPricingModal(true)}
                      className="px-3 py-1 rounded-full text-xs font-bold transition-all hover:scale-105 hover:brightness-110 shadow-md"
                      style={{
                        background: 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)',
                        color: 'white'
                      }}
                    >
                      Upgrade
                    </button>
                  )}
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-2 rounded-full hover:scale-110 transition-all"
                    style={{ background: 'var(--bg-tertiary)' }}
                  >
                    <span className="text-xl">×</span>
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
                style={{ minHeight: 0 }}
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                    {/* Foo Avatar for assistant messages */}
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0 mr-2">
                        <Image 
                          src="/icons/Foo.png" 
                          alt="Foo" 
                          width={32} 
                          height={32}
                          className="rounded-full shadow-lg"
                          unoptimized
                        />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] ${
                        msg.role === 'user' 
                          ? 'rounded-3xl rounded-br-lg shadow-lg' 
                          : 'rounded-3xl rounded-bl-lg shadow-md'
                      }`}
                      style={{
                        background: msg.role === 'user' 
                          ? 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)'
                          : 'var(--bg-secondary)',
                        color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                        border: msg.role === 'assistant' ? '2px solid var(--border)' : 'none'
                      }}
                    >
                      <div className="px-5 py-3">
                        {msg.imageUrl && (
                          <img 
                            src={msg.imageUrl} 
                            alt="Shared" 
                            className="rounded-xl mb-3 w-full shadow-md"
                            style={{ maxHeight: '250px', objectFit: 'cover' }}
                          />
                        )}
                        
                        <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2 pt-2" style={{
                          borderTop: msg.audioUrl ? '1px solid rgba(255,255,255,0.1)' : 'none'
                        }}>
                          <div className="text-xs opacity-60">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          
                          {/* Free for testing - was: msg.audioUrl && isPro */}
                          {msg.audioUrl && (
                            <button
                              onClick={() => playAudio(msg.audioUrl!, msg.id)}
                              className="text-xs px-3 py-1 rounded-full font-medium transition-all hover:scale-105"
                              style={{ 
                                background: msg.role === 'user' ? 'rgba(255,255,255,0.2)' : 'var(--accent-purple)',
                                color: 'white'
                              }}
                              title="Play Foo's voice"
                            >
                              🔊 Play
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start animate-fadeIn">
                    <div className="flex-shrink-0 mr-2">
                      <Image 
                        src="/icons/Foo.png" 
                        alt="Foo" 
                        width={32} 
                        height={32}
                        className="rounded-full shadow-lg"
                        unoptimized
                      />
                    </div>
                    <div 
                      className="max-w-[85%] rounded-3xl rounded-bl-lg px-5 py-4 shadow-md"
                      style={{ background: 'var(--bg-secondary)', border: '2px solid var(--border)' }}
                    >
                      <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ 
                          background: 'var(--text-secondary)',
                          animationDelay: '0ms' 
                        }}></div>
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ 
                          background: 'var(--text-secondary)',
                          animationDelay: '150ms' 
                        }}></div>
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ 
                          background: 'var(--text-secondary)',
                          animationDelay: '300ms' 
                        }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t p-4 flex-shrink-0" style={{ 
                background: 'var(--bg-primary)',
                borderColor: 'var(--border)'
              }}>
                {imagePreview && (
                  <div className="mb-3 relative inline-block animate-fadeIn">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-20 rounded-xl shadow-lg border-2"
                      style={{ borderColor: 'var(--accent-purple)' }}
                    />
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white font-bold shadow-lg hover:scale-110 transition-all"
                      style={{ background: '#ef4444' }}
                    >
                      ×
                    </button>
                  </div>
                )}
                
                <div className="flex gap-2 items-end">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-2xl transition-all flex-shrink-0 hover:scale-110 shadow-md"
                    style={{ background: 'var(--bg-tertiary)' }}
                    disabled={isLoading}
                    title="Upload image"
                  >
                    <span className="text-xl">📸</span>
                  </button>
                  
                  <div className="flex-1 relative">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Message Foo..."
                      className="w-full px-5 py-3 rounded-3xl resize-none shadow-md focus:shadow-lg transition-all"
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '2px solid var(--border)',
                        color: 'var(--text-primary)',
                        maxHeight: '120px',
                        minHeight: '52px'
                      }}
                      rows={1}
                      disabled={isLoading}
                    />
                  </div>
                  
                  {/* Advanced Foo Voice Button */}
                  <button
                    onClick={startAdvancedFoo}
                    disabled={isLoading || isListening || isRecording}
                    className="p-4 md:p-3 rounded-2xl transition-all flex-shrink-0 hover:scale-110 active:scale-95 shadow-lg font-bold text-base md:text-sm min-w-[60px] md:min-w-[50px] relative"
                    style={{ 
                      background: (isListening || isRecording)
                        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                        : 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)',
                      color: 'white',
                      animation: (isListening || isRecording) ? 'pulse 1.5s ease-in-out infinite' : 'none',
                      opacity: hasAFVoice ? 1 : 0.7
                    }}
                    title={hasAFVoice 
                      ? (isMobile ? "Advanced Foo - Tap to record" : "Advanced Foo - Talk to Foo")
                      : "AF Voice Mode - Premium $4.99/mo - Click to unlock"}
                  >
                    {!hasAFVoice && (
                      <span className="absolute -top-1 -right-1 text-xs bg-yellow-500 text-black rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                        🔒
                      </span>
                    )}
                    {(isListening || isRecording) ? (
                      <span className="flex items-center gap-1 text-lg md:text-base">
                        <span className="inline-block w-2 h-2 bg-white rounded-full animate-ping"></span>
                        🎤
                      </span>
                    ) : (
                      <span className="text-lg md:text-base">AF</span>
                    )}
                  </button>
                  
                  <button
                    onClick={handleSend}
                    disabled={isLoading || (!inputText.trim() && !selectedImage)}
                    className="p-4 rounded-2xl transition-all flex-shrink-0 disabled:cursor-not-allowed hover:scale-110 hover:brightness-110 disabled:hover:scale-100 disabled:hover:brightness-100 shadow-lg"
                    style={{ 
                      background: (inputText.trim() || selectedImage) && !isLoading
                        ? 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)'
                        : 'rgba(107, 87, 68, 0.5)',
                      color: 'white',
                      opacity: (inputText.trim() || selectedImage) && !isLoading ? 1 : 0.6
                    }}
                    title={!inputText.trim() && !selectedImage ? "Type a message or select an image" : "Send message"}
                  >
                    {isLoading ? (
                      <span className="text-xl animate-spin inline-block">⏳</span>
                    ) : (
                      <span className="text-xl">➤</span>
                    )}
                  </button>
                </div>
                
                {/* Upgrade reminder for free users */}
                {!isPro && messagesLeft <= 3 && messagesLeft > 0 && (
                  <div className="mt-2 text-center">
                    {user ? (
                      <button
                        onClick={() => setShowPricingModal(true)}
                        className="text-xs transition-colors underline"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Only {messagesLeft} messages left today • Upgrade to Pro for unlimited
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="text-xs transition-colors underline"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Only {messagesLeft} free messages left • Sign up to continue (it's free!)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Advanced Foo Mode Overlay */}
        {isAFMode && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fadeIn" style={{
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div className="flex flex-col items-center gap-6" style={{
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              {/* Pulsing Foo Icon */}
              <div className="relative">
                {(isListening || afStatus === 'playing') && (
                  <>
                    {/* Outer pulse rings */}
                    <div className="absolute inset-0 rounded-full animate-ping" style={{
                      background: afStatus === 'playing' 
                        ? 'radial-gradient(circle, rgba(139, 111, 71, 0.6) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(139, 111, 71, 0.4) 0%, transparent 70%)',
                      transform: 'scale(2)'
                    }}></div>
                    <div className="absolute inset-0 rounded-full animate-pulse" style={{
                      background: afStatus === 'playing'
                        ? 'radial-gradient(circle, rgba(139, 111, 71, 0.5) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(139, 111, 71, 0.3) 0%, transparent 70%)',
                      transform: 'scale(1.5)',
                      animationDuration: '2s'
                    }}></div>
                  </>
                )}
                
                {/* Foo Avatar */}
                <div className={`relative ${(isListening || afStatus === 'playing') ? 'animate-pulse' : ''}`} style={{
                  animationDuration: afStatus === 'playing' ? '1s' : '1.5s'
                }}>
                  <Image 
                    src="/icons/Foo.png" 
                    alt="Foo" 
                    width={120} 
                    height={120}
                    className="rounded-full shadow-2xl"
                    style={{
                      border: afStatus === 'playing' 
                        ? '4px solid rgba(139, 111, 71, 0.9)'
                        : '4px solid rgba(139, 111, 71, 0.6)',
                      boxShadow: (isListening || afStatus === 'playing')
                        ? '0 0 40px rgba(139, 111, 71, 0.6)' 
                        : 'none'
                    }}
                    unoptimized
                  />
                  
                  {/* Speaking indicator */}
                  {afStatus === 'playing' && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                      <span className="inline-block w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="inline-block w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="inline-block w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Text */}
              <div className="text-center max-w-md px-4" style={{
                transition: 'all 0.3s ease-in-out'
              }}>
                <h3 className="text-2xl font-bold mb-2" style={{ 
                  color: 'white',
                  transition: 'all 0.3s ease-in-out'
                }}>
                  {
                    afStatus === 'recording' ? '🎤 Recording...' :
                    afStatus === 'processing' ? '🤔 Transcribing...' :
                    afStatus === 'getting_response' ? '💬 Getting Foo\'s response...' :
                    afStatus === 'playing' ? '🔊 Foo says...' :
                    'Advanced Foo'
                  }
                </h3>
                
                {/* Show user's transcription */}
                {afUserText && (
                  <div className="mb-4 p-4 rounded-xl animate-fadeIn" style={{
                    background: 'rgba(139, 111, 71, 0.3)',
                    border: '1px solid rgba(139, 111, 71, 0.5)',
                    animation: 'fadeInSlide 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'translateY(0)'
                  }}>
                    <p className="text-xs mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>You said:</p>
                    <p className="text-base" style={{ color: 'white' }}>"{afUserText}"</p>
                  </div>
                )}

                {/* Show Foo's response - always visible when present */}
                {afFooText && (
                  <div className="mb-4 p-4 rounded-xl animate-fadeIn" style={{
                    background: 'rgba(139, 111, 71, 0.5)',
                    border: '2px solid rgba(139, 111, 71, 0.8)',
                    animation: 'fadeInSlide 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'translateY(0)'
                  }}>
                    <p className="text-base leading-relaxed" style={{ color: 'white' }}>
                      {afFooText}
                    </p>
                  </div>
                )}

                {!afUserText && !afFooText && (
                  <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {isRecording ? 'Speak now • Auto-stops when you finish' : isListening ? 'Transcribing your voice...' : isLoading ? 'Foo is cooking up a response...' : 'Get ready'}
                  </p>
                )}
                
                {/* Continuous conversation hint */}
                {(afUserText || afFooText) && (
                  <p className="text-xs mt-2 opacity-60" style={{ color: 'white' }}>
                    💬 Continuous conversation mode • Foo will listen again after responding
                  </p>
                )}
              </div>

              {/* Image Preview in AF Mode */}
              {afImagePreview && (
                <div className="relative animate-fadeIn mb-4">
                  <img 
                    src={afImagePreview} 
                    alt="Selected" 
                    className="max-w-xs max-h-48 rounded-xl shadow-lg border-2 border-white/30"
                  />
                  <button
                    onClick={() => {
                      console.log('🗑️ [AF] Removing image manually');
                      
                      // Clear preview URL to avoid memory leaks
                      if (afImagePreview) {
                        URL.revokeObjectURL(afImagePreview);
                      }
                      
                      // Clear state
                      setAfImage(null);
                      setAfImagePreview(null);
                      
                      // Clear window reference
                      (window as any).__debugAfImage = null;
                      console.log('🗑️ [AF] Cleared window.__debugAfImage');
                      
                      // Clear file input
                      if (afFileInputRef.current) {
                        afFileInputRef.current.value = '';
                      }
                    }}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white font-bold shadow-lg transition-all hover:scale-110"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Camera Button - Always visible */}
              <div className="flex gap-3">
                {/* Hidden file input */}
                <input
                  ref={afFileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    console.log('📂 [AF] File input onChange triggered!');
                    console.log('📂 [AF] Files:', e.target.files);
                    handleAFImageSelect(e);
                  }}
                  className="hidden"
                />
                
                <button
                  onClick={() => {
                    console.log('🔘 [AF] Camera button clicked!');
                    console.log('🔘 [AF] afFileInputRef.current:', afFileInputRef.current);
                    if (afFileInputRef.current) {
                      console.log('🔘 [AF] Triggering file input click...');
                      afFileInputRef.current.click();
                    } else {
                      console.error('❌ [AF] afFileInputRef.current is null!');
                    }
                  }}
                  className="px-6 py-3 rounded-full transition-all hover:scale-105 font-bold text-base flex items-center gap-2"
                  style={{
                    background: afImage 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #8b6f47 0%, #6b5438 100%)',
                    color: 'white',
                    boxShadow: afImage 
                      ? '0 4px 20px rgba(16, 185, 129, 0.4)'
                      : '0 4px 20px rgba(139, 111, 71, 0.4)',
                    border: '2px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  📸 {afImage ? 'Change Photo' : 'Add Photo'}
                </button>

              </div>

              {/* Stop AF Mode button - Always visible to exit */}
              <button
                onClick={stopAFMode}
                className="px-8 py-3 rounded-full transition-all hover:scale-105 font-bold text-base"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                ✖️ Stop AF Mode
              </button>
            </div>
          </div>
        )}

        {/* Auth Modal */}
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
        
        {/* Pricing Modal */}
        {showPricingModal && <PricingModal onClose={() => setShowPricingModal(false)} />}
        
        {/* Tip Jar Modal */}
        {showTipJarModal && <TipJarModal onClose={() => setShowTipJarModal(false)} />}
        
        {/* AF Voice Modal */}
        {showAFVoiceModal && <AFVoiceModal onClose={() => setShowAFVoiceModal(false)} />}
      </div>

      {/* Notifications */}
      {notification && (
        <Notification
          isOpen={!!notification}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Add animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-bounce-brief {
          animation: bounceFoo 1s ease-in-out 2;
        }
        
        @keyframes bounceFoo {
          0%, 100% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
        
        /* Smooth transitions for all interactive elements */
        button, input, textarea {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </>
  );
}
