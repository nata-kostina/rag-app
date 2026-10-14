
import type { FallbackProps } from 'react-error-boundary'

import { DataError } from '@/components/DataError'
import { Button } from '@/components/ui/button'

export function GlobalErrorFallback({ error }: FallbackProps) {
    const errorMessage =
        error instanceof Error
            ? error.message
            : typeof error === 'string'
                ? error
                : 'Something went wrong on our end.'

    return (
        <div className="flex h-screen w-full items-center justify-center p-4 bg-background">
            <div className="max-w-md w-full text-center space-y-4">
                <DataError
                    title="Critical Application Error"
                    message={errorMessage}
                />
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Reload Page
                </Button>
            </div>
        </div>
    )
}