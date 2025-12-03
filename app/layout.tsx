import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import 'reactflow/dist/style.css'
import { ToastProvider } from '@/components/toast'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { NavigationProvider } from '@/lib/navigation-context'
import { QueryProvider } from '@/components/providers/query-provider'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'YUMA - Task Management Platform',
  description: 'A modern task management and collaboration platform with AI-powered features',
  keywords: ['task management', 'project management', 'collaboration', 'AI', 'productivity'],
  authors: [{ name: 'YUMA Team' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3B82F6', // YUMA Primary accent color
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('yuma-theme');
                  const theme = stored && (stored === 'dark' || stored === 'light' || stored === 'system')
                    ? stored
                    : 'dark';
                  
                  const root = document.documentElement;
                  root.classList.remove('light', 'dark');
                  
                  if (theme === 'system') {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                      ? 'dark'
                      : 'light';
                    root.classList.add(systemTheme);
                  } else {
                    root.classList.add(theme);
                  }
                } catch (e) {
                  // Fallback to dark theme if localStorage access fails
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`} style={{ margin: 0, padding: 0, height: '100vh', width: '100%' }}>
        <ThemeProvider defaultTheme="dark" storageKey="yuma-theme">
          <QueryProvider>
            <NavigationProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </NavigationProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

