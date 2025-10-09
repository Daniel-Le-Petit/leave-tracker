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
        
        {/* Open Graph Meta Tags for Social Media */}
        <meta property="og:title" content="Leave Tracker - Gestionnaire de Congés" />
        <meta property="og:description" content="Application de gestion des congés et des absences pour les employés. Suivez vos jours de congé, demandez des absences et consultez votre historique." />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:url" content="https://your-domain.com" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Leave Tracker" />
        <meta property="og:locale" content="fr_FR" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Leave Tracker - Gestionnaire de Congés" />
        <meta name="twitter:description" content="Application de gestion des congés et des absences pour les employés. Suivez vos jours de congé, demandez des absences et consultez votre historique." />
        <meta name="twitter:image" content="/og-image.jpg" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="description" content="Application de gestion des congés et des absences pour les employés. Suivez vos jours de congé, demandez des absences et consultez votre historique." />
        <meta name="keywords" content="congés, absences, gestion, employés, RH, ressources humaines" />
        <meta name="author" content="Leave Tracker" />
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
