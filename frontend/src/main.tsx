import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'

import { App } from './App'

import { GlobalErrorFallback } from '@/components/GlobalErrorFallback'

import './index.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ErrorBoundary
            FallbackComponent={GlobalErrorFallback}
        >
            <App />
        </ErrorBoundary>
    </StrictMode >,
)
