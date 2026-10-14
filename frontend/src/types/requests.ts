export interface UploadDocumentRequest {
    file: File
    docId: string
}

export interface SearchDocumentsRequest {
    documentIds: string[]
}

export interface QueryStreamRequest {
    query: string
}