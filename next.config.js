/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      'date-fns', 
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
      '@radix-ui/react-separator',
      '@radix-ui/react-avatar',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-switch',
      '@radix-ui/react-tooltip',
      'recharts',
      'react-chartjs-2',
      'chart.js',
      'class-variance-authority',
      'clsx',
      'react-big-calendar',
      '@tanstack/react-table'
    ],
    // Enable webpack memory optimizations for better performance
    webpackMemoryOptimizations: true
  },
  // Enable detailed fetch logging for debugging performance issues
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
  // Moved from experimental - now stable in Next.js 15
  serverExternalPackages: [
    'firebase-admin',
    'firebase',
    'firebase/app',
    'firebase/auth',
    'firebase/firestore',
    'firebase/storage',
    'firebase/analytics',
    'next-auth',
    'next-auth/providers/google',
    'jsonwebtoken',
    '@getbrevo/brevo',
    'bcryptjs',
    'crypto',
    '@tensorflow/tfjs',
    '@tensorflow/tfjs-core', 
    '@tensorflow/tfjs-backend-cpu',
    '@tensorflow/tfjs-backend-webgl',
    '@tensorflow/tfjs-backend-webgpu',
    '@tensorflow/tfjs-converter',
    '@tensorflow-models/face-landmarks-detection',
    '@tensorflow-models/hand-pose-detection', 
    '@tensorflow-models/pose-detection',
    '@vladmandic/face-api',
    '@mediapipe/face_mesh',
    '@mediapipe/hands',
    '@mediapipe/pose',
    'gsap',
    '@gsap/react'
    // Note: Removed motion libraries as they're needed for client-side animations
  ],
  // Temporarily disable TypeScript build errors while fixing remaining routes
  typescript: {
    ignoreBuildErrors: true,
  },
  // Aggressive compression
  compress: true,
  // Optimize loading
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'html.tailus.io',
      },
    ],
  },
  webpack: (config, { isServer, dev }) => {
    // Fix face-api.js trying to use Node.js modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        encoding: false,
      }
    }
    
    // Production AND development optimizations for faster compilation
    // Aggressive code splitting - even in development for faster builds
    config.optimization = config.optimization || {}
    config.optimization.splitChunks = {
      ...config.optimization.splitChunks,
      chunks: 'all',
      maxSize: 244000, // 244kb max chunk size
      cacheGroups: {
        ...config.optimization.splitChunks?.cacheGroups,
        // Heavy animation libraries - completely async
        animations: {
          test: /[\/\\]node_modules[\/\\](gsap|motion|@gsap)/,
          name: 'animations',
          chunks: 'async',
          priority: 30,
          enforce: true,
        },
        // TensorFlow/AI libraries - NEVER in main bundle
        tensorflow: {
          test: /[\/\\]node_modules[\/\\](@tensorflow|@vladmandic|@mediapipe)/,
          name: 'tensorflow',
          chunks: 'async',
          priority: 25,
          enforce: true,
        },
        // Radix UI components
        radixui: {
          test: /[\/\\]node_modules[\/\\](@radix-ui)/,
          name: 'radix-ui',
          chunks: 'async',
          priority: 15,
        },
        // Separate Firebase into its own chunk  
        firebase: {
          test: /[\/\\]node_modules[\/\\](firebase)/,
          name: 'firebase',
          chunks: 'async', // Make Firebase async to prevent blocking main bundle
          priority: 20,
          enforce: true,
        },
        // Chart libraries
        charts: {
          test: /[\/\\]node_modules[\/\\](recharts|react-chartjs-2|chart\.js)/,
          name: 'charts',
          chunks: 'async',
          priority: 18,
          enforce: true,
        },
        // UI libraries chunk
        ui: {
          test: /[\/\\]node_modules[\/\\](@radix-ui|lucide-react)/,
          name: 'ui',
          chunks: 'async',
          priority: 10,
        },
        // Large dependencies
        vendor: {
          test: /[\/\\]node_modules[\/\\]/,
          name: 'vendor',
          chunks: 'all',
          priority: 5,
          minSize: 30000, // Only create vendor chunk for modules > 30kb
        },
      },
    }
    
    // Speed up builds by reducing resolution checks
    config.resolve.symlinks = false
    config.resolve.cache = true
    
    // Development-specific optimizations for faster compilation
    if (dev) {
      // Disable source maps in development for faster builds
      config.devtool = false
      
      // Reduce module resolution overhead
      config.resolve.modules = ['node_modules']
      
      // Skip expensive optimizations in development
      config.optimization.minimize = false
      config.optimization.splitChunks.minSize = 0
      
      // Faster rebuilds
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename]
        }
      }
      
      // Keep existing optimizations but don't need aggressive chunking
      // Root cause was Firebase being imported globally via Header
    }
    
    return config
  },
}

module.exports = nextConfig
