import { useState } from 'react'

export function BuggyButton() {
    const [hasError, setHasError] = useState(false)

    if (hasError) {
        throw new Error('Test critical error: ErrorBoundary is working!')
    }

    return (
        <button
            onClick={() => setHasError(true)}
            className="p-2 bg-red-500 text-white rounded text-xs"
        >
            Break the App (Test Error)
        </button>
    )
}