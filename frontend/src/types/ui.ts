export const Layout = {
    WELCOME: 'welcome',
    CHAT: 'chat',
    DOCUMENTS: 'documents',
    HISTORY: 'history',
} as const

export type Layout = (typeof Layout)[keyof typeof Layout]

export interface UploadedFile {
    id: string
    file: File
    size: string
    status: 'pending' | 'uploaded' | 'processing' | 'failed'
}