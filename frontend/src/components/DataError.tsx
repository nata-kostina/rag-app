import { AlertCircle, RefreshCw } from 'lucide-react'

import {
    Alert, AlertDescription, AlertTitle 
} from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface DataErrorProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
}

export function DataError({
    title = 'Failed to load data',
    message = 'An unexpected error occurred. Please try again.',
    onRetry,
}: DataErrorProps) {
    return (
        <div className="py-6 max-w-lg mx-auto w-full">
            <Alert variant="destructive" className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-semibold">{title}</AlertTitle>
                <AlertDescription className="mt-1 text-xs opacity-90 leading-relaxed">
                    {message}
                </AlertDescription>
            </Alert>

            {onRetry && (
                <div className="mt-4 flex justify-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="gap-2 text-xs hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 border-border"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Try Again
                    </Button>
                </div>
            )}
        </div>
    )
}