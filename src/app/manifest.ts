import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Consularly',
        short_name: 'Consularly',
        description: 'AI-powered visa interview mock test platform',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4840A3',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    }
}
