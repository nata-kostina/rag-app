export interface Document {
    id: string
    userId: string
    originalFilename: string
    status: 'processing' | 'failed' | 'uploaded'
    errorMessage?: string
}