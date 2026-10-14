
import { apiClient } from './apiClient'

import type { Citation } from '@/types/chat'
import type { SearchDocumentsRequest, UploadDocumentRequest } from '@/types/requests'
import type {
    GetDocumentsResponse, GetQueriesResponse, SearchDocumentsResponse, UploadDocumentResponse
} from '@/types/responses'

import { getOrCreateUserId } from '@/utils/session'

export interface StreamChunk {
    type: 'citations' | 'message' | 'done' | 'error'
    content?: string
    citations?: Citation[]
    error?: string
}

export class ApiService {

    static async getDocuments(): Promise<GetDocumentsResponse> {
        return apiClient<GetDocumentsResponse>('/documents', { method: 'GET' })
    }

    static async getQueries(): Promise<GetQueriesResponse> {
        return apiClient<GetQueriesResponse>('/queries', { method: 'GET' })
    }

    static async searchDocuments({ documentIds }: SearchDocumentsRequest): Promise<SearchDocumentsResponse> {
        return apiClient<SearchDocumentsResponse>('/documents/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({ documentIds })
        })
    }

    static async uploadDocument({ file, docId }: UploadDocumentRequest): Promise<UploadDocumentResponse> {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('docId', docId)

        return apiClient<UploadDocumentResponse>('/documents/upload', {
            method: 'POST',
            body: formData,
        })
    }

    static async *streamChat(
        query: string,
        signal?: AbortSignal
    ): AsyncGenerator<StreamChunk, void, unknown> {
        const userId = getOrCreateUserId()
        const BASE_URL = import.meta.env.VITE_API_BASE_URL

        const response = await fetch(`${BASE_URL}/queries/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                'Authorization': `Bearer ${userId}`,
            },
            body: JSON.stringify({ query }),
            signal,
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const errorMessage = errorData.detail || `API Error: ${response.status} ${response.statusText}`
            throw new Error(errorMessage)
        }

        if (!response.body) return

        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''

        try {
            while (true) {
                const { value, done } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })

                const blocks = buffer.split('\n\n')
                buffer = blocks.pop() || ''

                for (const block of blocks) {
                    if (!block.trim()) continue

                    let currentEvent = ''
                    let currentData = ''

                    const lines = block.split('\n')
                    for (const line of lines) {
                        const trimmed = line.trim()

                        if (trimmed.startsWith('event:')) {
                            currentEvent = trimmed.replace(/^event:\s*/, '').trim()
                        } else if (trimmed.startsWith('data:')) {
                            currentData = trimmed.replace(/^data:\s*/, '').trim()
                        }
                    }

                    if (currentEvent === 'done') {
                        yield { type: 'done' }
                        return
                    }

                    if (!currentData) continue

                    try {
                        const parsedData = JSON.parse(currentData)

                        if (currentEvent === 'message') {
                            yield {
                                type: 'message',
                                content: parsedData,
                            }
                        } else if (currentEvent === 'citations') {
                            yield {
                                type: 'citations',
                                citations: parsedData as Citation[],
                            }
                        } else if (currentEvent === 'error') {
                            yield {
                                type: 'error',
                                error: parsedData
                            }
                            return
                        }
                    } catch (e) {
                        console.warn('Failed to parse SSE data JSON:', currentData, e)
                    }
                }
            }
        } finally {
            reader.releaseLock()
        }
    }
}