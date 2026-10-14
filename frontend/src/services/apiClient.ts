/* eslint-disable @typescript-eslint/no-explicit-any */
import { getOrCreateUserId } from '@/utils/session'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const userId = getOrCreateUserId()

    const headers = new Headers(options.headers || {})

    headers.set('Authorization', `Bearer ${userId}`)

    const config: RequestInit = {
        ...options,
        headers,
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config)

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        const error = new Error(errorData.detail || `API Error: ${response.status} ${response.statusText}`);
        (error as any).response = errorData;
        (error as any).status = response.status

        throw error
    }

    return (await response.json()) as T
}