export interface Citation {
    id: string
    docId: string
    originalFilename: string
    text: string
}

export interface Message {
    id: string
    sender: 'user' | 'assistant'
    text: string
    timestamp: string
    citations?: Citation[]
}