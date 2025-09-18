import Link from 'next/link'

export default function About() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center p-24 pt-16 bg-background">
        <div className="max-w-4xl w-full text-center">
          <h1 className="text-4xl font-bold mb-8 text-foreground">About This Boilerplate</h1>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
          <div className="p-6 border border-border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Next.js 14</h2>
            <p className="text-muted-foreground">
              Built with the latest Next.js App Router for optimal performance and developer experience.
            </p>
          </div>
          
          <div className="p-6 border border-border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">TypeScript</h2>
            <p className="text-muted-foreground">
              Full TypeScript support with strict type checking for better code quality.
            </p>
          </div>
          
          <div className="p-6 border border-border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Tailwind CSS</h2>
            <p className="text-muted-foreground">
              Utility-first CSS framework for rapid UI development with dark mode support.
            </p>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Features Included</h2>
          <ul className="text-left max-w-md mx-auto space-y-2">
            <li>✅ Next.js 14 with App Router</li>
            <li>✅ TypeScript configuration</li>
            <li>✅ Tailwind CSS with PostCSS</li>
            <li>✅ ESLint configuration</li>
            <li>✅ Responsive design</li>
            <li>✅ Dark mode support</li>
            <li>✅ Modern folder structure</li>
          </ul>
        </div>
        
        <Link 
          href="/"
          className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          ← Back to Home
        </Link>
        </div>
      </main>
    </>
  )
}
