import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { visaTypes } from '../data'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ShareButtons } from '@/components/share-buttons'

interface Props {
    params: Promise<{ type: string }>
}

export async function generateStaticParams() {
    return visaTypes.map((visa) => ({
        type: visa.id,
    }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { type } = await params
    const visa = visaTypes.find((v) => v.id === type)

    if (!visa) {
        return {}
    }

    return {
        title: `${visa.title} | Consularly`,
        description: visa.description,
        keywords: visa.keywords,
        openGraph: {
            title: visa.title,
            description: visa.description,
            type: 'article',
        },
    }
}

export default async function VisaTypePage({ params }: Props) {
    const { type } = await params
    const visa = visaTypes.find((v) => v.id === type)

    if (!visa) {
        notFound()
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: visa.faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    }

    return (
        <div className="min-h-screen bg-background pt-20 pb-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="container px-4 mx-auto max-w-4xl">
                <div className="flex flex-col items-center text-center space-y-6 mb-16">
                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                        Visa Guide
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                        {visa.title}
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl">
                        {visa.description}
                    </p>

                    <ShareButtons title={visa.title} url={`https://consularly.com/visa-types/${visa.id}`} />

                    <div className="flex gap-4 pt-4">
                        <Button asChild size="lg">
                            <Link href="/signin">Start Mock Interview</Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </div>
                </div>

                <div className="space-y-12">
                    <section>
                        <h2 className="text-2xl font-bold tracking-tight mb-6">Common Questions</h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            {visa.faq.map((item, index) => (
                                <div key={index} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                                    <h3 className="font-semibold leading-none tracking-tight mb-3">
                                        {item.question}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {item.answer}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-muted/50 rounded-2xl p-8 text-center">
                        <h2 className="text-2xl font-bold mb-4">Want to test these answers?</h2>
                        <p className="text-muted-foreground mb-6">
                            Our AI interviewer is trained specifically on {visa.keywords[0]} scenarios.
                            Practice in a realistic environment and get instant feedback.
                        </p>
                        <Button size="lg" className="w-full sm:w-auto">
                            <Link href="/signin">Launch Simulation</Link>
                        </Button>
                    </section>
                </div>
            </div>
        </div>
    )
}
