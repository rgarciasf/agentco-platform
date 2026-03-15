import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AgentCo Platform',
  description: 'Agent-native software company for Latin America',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, background: '#0e0f11' }}>{children}</body>
    </html>
  )
}
