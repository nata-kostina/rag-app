import {
    useState, useEffect, useCallback, useRef 
} from 'react'

interface UseFetchResult<T> {
    data: T | null
    isLoading: boolean
    error: Error | null
    refetch: () => void
}

export function useFetch<T>(fetchFn: () => Promise<T>): UseFetchResult<T> {
    const [data, setData] = useState<T | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<Error | null>(null)

    const [reloadCount, setReloadCount] = useState(0)

    const fetchFnRef = useRef(fetchFn)
    useEffect(() => {
        fetchFnRef.current = fetchFn
    }, [fetchFn])

    useEffect(() => {
        const controller = new AbortController()

        const loadData = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const result = await fetchFnRef.current()
                if (!controller.signal.aborted) {
                    setData(result)
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError(err instanceof Error ? err : new Error(String(err)))
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }

        loadData()

        return () => {
            controller.abort()
        }
    }, [reloadCount])

    const refetch = useCallback(() => {
        setReloadCount((prev) => prev + 1)
    }, [])

    return {
        data,
        isLoading,
        error,
        refetch 
    }
}