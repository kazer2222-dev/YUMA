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
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
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

