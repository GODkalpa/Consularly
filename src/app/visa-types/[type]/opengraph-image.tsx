import { ImageResponse } from 'next/og'
import { visaTypes } from '../data'

export const runtime = 'edge'

export const alt = 'Consularly Visa Interview Guide'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

interface Props {
    params: Promise<{ type: string }>
}

export default async function Image({ params }: Props) {
    const { type } = await params
    const visa = visaTypes.find((v) => v.id === type)
    const title = visa?.title || 'Visa Interview Guide'
    const description = visa?.description || 'Ace your visa interview with AI-powered mock tests.'

    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(to bottom right, #1e1b4b, #4338ca)',
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif',
                    color: 'white',
                    padding: '40px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                        padding: '10px 20px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50px',
                        border: '1px solid rgba(255,255,255,0.2)',
                    }}
                >
                    <span style={{ fontSize: 24, fontWeight: 600 }}>Consularly</span>
                </div>

                <h1
                    style={{
                        fontSize: 60,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        marginBottom: '20px',
                        lineHeight: 1.2,
                        maxWidth: '1000px',
                    }}
                >
                    {title}
                </h1>

                <p
                    style={{
                        fontSize: 30,
                        textAlign: 'center',
                        color: '#e0e7ff',
                        maxWidth: '800px',
                        lineHeight: 1.4,
                    }}
                >
                    {description}
                </p>

                <div style={{
                    marginTop: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80' }}></div>
                    <span style={{ fontSize: 20, color: '#4ade80' }}>AI-Powered Mock Tests Included</span>
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
