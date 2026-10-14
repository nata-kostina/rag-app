
import { Button } from '@/components/ui/button'
import {
    Card, CardContent, CardHeader
} from '@/components/ui/card'
import { Layout } from '@/types/ui'

interface WelcomeLayoutProps {
    changeLayout: (layout: Layout) => void
}

const STEPS = [
    [
        '01',
        'Upload PDFs',
        'Upload your PDF documents — manuals, reports, papers, or books.',
    ],
    [
        '02',
        'Ask anything',
        'Ask any question about your content, and the model will retrieve the relevant passages.',
    ],
    [
        '03',
        'Get insights',
        'Receive accurate, AI-generated answers grounded directly in your uploaded files.',
    ],
] as const

export function WelcomeLayout({ changeLayout }: Readonly<WelcomeLayoutProps>) {
    return (
        <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12">
            <Card className="w-full">
                <CardHeader className="border-b border-border p-8 sm:p-10">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        RAG-Powered AI Assistant
                    </p>
                    <h1 className="pt-2 text-3xl font-semibold tracking-tight text-foreground">
                        Smart PDF Assistant
                    </h1>
                    <p className="max-w-xl pt-2 text-base leading-7 text-muted-foreground">
                        Upload your PDFs to search, analyze, and ask questions with precise source attribution.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-6">
                        <Button onClick={() => changeLayout(Layout.CHAT)}>Get started</Button>
                        <Button onClick={() => changeLayout(Layout.HISTORY)} variant="outline">
                            View history
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-8 sm:p-10">
                    <h2 className="text-sm font-medium text-foreground">How it works</h2>
                    <ol className="mt-5 divide-y divide-border">
                        {STEPS.map(([
                            number,
                            title,
                            copy
                        ]) => (
                            <li
                                key={number}
                                className="grid items-center gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[32px_160px_1fr] sm:items-center"
                            >
                                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                                    {number}
                                </span>
                                <span className="text-sm font-medium text-foreground">{title}</span>
                                <span className="text-sm leading-6 text-muted-foreground">{copy}</span>
                            </li>
                        ))}
                    </ol>
                </CardContent>
            </Card>
        </main>
    )
}