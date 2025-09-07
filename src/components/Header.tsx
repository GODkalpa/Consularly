import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
              Next.js Boilerplate
            </Link>
          </div>
          
          <nav className="flex space-x-8">
            <Link 
              href="/" 
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/about" 
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              About
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
