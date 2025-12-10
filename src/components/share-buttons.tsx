'use client'

import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'

export function ShareButtons({ title, url }: { title: string; url: string }) {
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text: `Check out this ${title} guide on Consularly!`,
                    url,
                })
            } catch (err) {
                console.error('Error sharing:', err)
            }
        } else {
            navigator.clipboard.writeText(url)
            toast.success('Link copied to clipboard!')
        }
    }

    return (
        <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                <Share2 className="w-4 h-4" />
                Share this Guide
            </Button>
        </div>
    )
}
