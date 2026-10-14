export interface Citation {
    chunk_id: string
    doc_id: string
    original_filename: string
    text: string
}

export interface Query {
    id: string
    query: string
    response?: string
    citations?: Citation[]
    status: 'success' | 'error'
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
}
