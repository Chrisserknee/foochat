import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: "FooChat - AI Foo That Talks Like a Local",
  description: "A chaotic, funny AI that roasts you in full Salinas Foo slang. Send pictures, get roasted. It's that simple, foo.",
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  if (savedTheme) {
                    document.documentElement.setAttribute('data-theme', savedTheme);
                  } else {
                    // Default to dark mode for first-time visitors
                    document.documentElement.setAttribute('data-theme', 'dark');
                  }
                } catch (e) {
                  // Fallback to dark mode if error
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
        {/* Eruda Mobile Debugger - Load FIRST */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Load Eruda synchronously FIRST
              (function() {
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                const hasDebugParam = window.location.search.includes('debug=true');
                
                if (isMobile || hasDebugParam) {
                  // Load eruda inline for immediate availability
                  var script = document.createElement('script');
                  script.src = 'https://cdn.jsdelivr.net/npm/eruda';
                  script.onload = function() {
                    eruda.init();
                    console.log('🐛 Eruda mobile debugger loaded!');
                    console.log('📱 Device:', navigator.userAgent);
                    console.log('🌐 URL:', window.location.href);
                  };
                  document.head.appendChild(script);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

