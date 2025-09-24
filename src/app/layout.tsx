import { Inter } from 'next/font/google'
import ClientProvider from '../components/ClientProvider'
import DeploymentNotice from '../components/DeploymentNotice'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200`}>
        <ClientProvider>
          <div className="min-h-screen">
            {children}
          </div>
          <DeploymentNotice />
        </ClientProvider>
      </body>
    </html>
  )
}
