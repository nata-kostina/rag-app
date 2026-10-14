import {
    Upload, Loader2, FileClock
} from 'lucide-react'
import {
    useEffect, useRef, useState
} from 'react'

import type { Citation, Message } from '@/types/chat'
import type { UploadedFile } from '@/types/ui'

import { ChatWindow } from '@/components/ChatWindow'
import { DocumentUploader } from '@/components/DocumentUploader'
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger
} from '@/components/ui/sheet'
import { ApiService } from '@/services/ApiService'

const POLL_INTERVAL_MS = 3000

export function ChatLayout() {
    const [messages, setMessages] = useState<Message[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const abortControllerRef = useRef<AbortController | null>(null)
    const [files, setFiles] = useState<UploadedFile[]>([])
    const [isUploading, setIsUploading] = useState(false)

    const filesRef = useRef(files)

    useEffect(() => {
        filesRef.current = files
    }, [files])

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
                abortControllerRef.current = null
            }
        }
    }, [])

    useEffect(() => {
        const intervalId = setInterval(async () => {
            const processingFiles = filesRef.current.filter(
                (f) => f.status === 'processing'
            )

            if (processingFiles.length === 0) return

            const documentIds = processingFiles.map((f) => f.id)

            try {
                const documents = await ApiService.searchDocuments({ documentIds })
                if (documents && documents.length > 0) {
                    setFiles((prevFiles) =>
                        prevFiles.map((file) => {
                            const updatedDoc = documents.find((d) => d.id === file.id)
                            if (updatedDoc) {
                                return {
                                    ...file,
                                    status: updatedDoc.status as UploadedFile['status']
                                }
                            }
                            return file
                        }))
                }
            } catch (error) {
                console.error('Error polling document status:', error)
            }
        }, POLL_INTERVAL_MS)

        return () => clearInterval(intervalId)
    }, [])

    const processingCount = files.filter((f) => f.status === 'processing').length
    const isBackgroundProcessing = processingCount > 0 || isUploading

    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
        setIsGenerating(false)
    }

    const handleSendMessage = async (query: string) => {
        if (isGenerating) return

        const userTimestamp = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        })

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: query,
            timestamp: userTimestamp,
        }

        const botMsgId = (Date.now() + 1).toString()
        const botMsg: Message = {
            id: botMsgId,
            sender: 'assistant',
            text: '',
            citations: [],
            timestamp: userTimestamp,
        }

        setMessages((prev) => [
            ...prev,
            userMsg,
            botMsg
        ])
        setIsGenerating(true)

        const controller = new AbortController()
        abortControllerRef.current = controller

        try {
            const stream = ApiService.streamChat(query, controller.signal)

            for await (const chunk of stream) {
                if (chunk.type === 'message') {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === botMsgId
                                ? {
                                    ...msg,
                                    text: msg.text + (chunk.content as string)
                                }
                                : msg))
                } else if (chunk.type === 'citations') {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === botMsgId
                                ? {
                                    ...msg,
                                    citations: chunk.citations as Citation[]
                                }
                                : msg))
                } else if (chunk.type === 'error') {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const errorObj = chunk.error as any
                    const errorMessage =
                        typeof errorObj === 'object' && errorObj !== null
                            ? errorObj.message || 'An error occurred while generating the response.'
                            : (typeof chunk.error === 'string' ? chunk.error : 'An error occurred while generating the response. Please try again later.')

                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === botMsgId
                                ? {
                                    ...msg,
                                    text: msg.text
                                        ? `${msg.text}\n\n${errorMessage}`
                                        : errorMessage,
                                }
                                : msg))
                    break
                } else if (chunk.type === 'done') {
                    break
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.log(error)
            console.dir(error)
            if (error.name === 'AbortError') {
                console.log('Stream canceled by user or navigation')
            } else {
                console.error('Streaming error:', error)

                const errorMessage =
                    error?.response?.data?.detail ||
                    error?.response?.data?.message ||
                    error?.detail ||
                    error?.message ||
                    'An error occurred while generating the response.'

                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === botMsgId
                            ? {
                                ...msg,
                                text: msg.text
                                    ? `${msg.text}\n\n[Error: ${errorMessage}]`
                                    : errorMessage,
                            }
                            : msg))
            }

        } finally {
            setIsGenerating(false)
            abortControllerRef.current = null
        }
    }

    const handleUploadDocument = async () => {
        const pendingFiles = files.filter((f) => f.status === 'pending')

        if (pendingFiles.length === 0 || isUploading) return

        setIsUploading(true)

        const pendingIds = new Set(pendingFiles.map((f) => f.id))

        setFiles((prev) =>
            prev.map((file) =>
                pendingIds.has(file.id)
                    ? {
                        ...file,
                        status: 'processing'
                    }
                    : file))

        const uploadPromises = pendingFiles.map(async (item) => {
            try {
                await ApiService.uploadDocument({
                    file: item.file,
                    docId: item.id
                })

            } catch (error) {
                console.error(`Error uploading ${item.file.name}:`, error)

                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === item.id
                            ? {
                                ...f,
                                status: 'failed'
                            }
                            : f))
            }
        })

        await Promise.allSettled(uploadPromises)
        setIsUploading(false)
    }

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
            <div className="flex items-center justify-between p-3 bg-card shrink-0 border-b border-border">
                <div className="flex items-center gap-2 px-2">
                    {isBackgroundProcessing && (
                        <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full animate-pulse">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>
                                Processing {processingCount} {processingCount === 1 ? 'document' : 'documents'} in background...
                            </span>
                        </div>
                    )}
                </div>

                <Sheet open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <SheetTrigger className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground relative">
                        <Upload className="h-4 w-4" />
                        <span>Upload Documents</span>
                        {isBackgroundProcessing && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                            </span>
                        )}
                    </SheetTrigger>

                    <SheetContent side="left" className="w-[85%] sm:w-[400px] p-4 flex flex-col h-full">
                        <SheetHeader className="mb-2 shrink-0">
                            <SheetTitle className="text-left text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Add Context Documents</span>
                                {isBackgroundProcessing && (
                                    <span className="flex items-center gap-1.5 text-xs font-normal text-amber-600 dark:text-amber-400 capitalize">
                                        <FileClock className="h-3.5 w-3.5 animate-spin" />
                                        Processing
                                    </span>
                                )}
                            </SheetTitle>
                        </SheetHeader>

                        <div className="flex-1 min-h-0 overflow-hidden">
                            <DocumentUploader
                                files={files}
                                isUploading={isUploading}
                                handleUploadDocument={handleUploadDocument}
                                setFiles={setFiles}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <main className="flex-1 min-h-0 overflow-hidden">
                <ChatWindow
                    messages={messages}
                    isGenerating={isGenerating}
                    onSendMessage={handleSendMessage}
                    onStopGeneration={handleStopGeneration}
                />
            </main>
        </div>
    )
}