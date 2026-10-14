import {
    Upload, FileText, X, CheckCircle2, Loader2, ArrowUpRight, AlertCircle
} from 'lucide-react'
import {
    useState, useRef, type ChangeEvent, type DragEvent
} from 'react'

import type { UploadedFile } from '@/types/ui'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface DocumentUploaderProps {
    files: UploadedFile[]
    isUploading: boolean
    handleUploadDocument: () => Promise<void>
    setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>
}

export function DocumentUploader({
    files, isUploading, handleUploadDocument, setFiles
}: DocumentUploaderProps) {
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const handleFiles = (incomingFiles: FileList | null) => {
        if (!incomingFiles) return
        const newFiles: UploadedFile[] = Array.from(incomingFiles)
            .filter((file) => file.type === 'application/pdf')
            .map((file) => ({
                id: crypto.randomUUID(),
                file,
                size: formatSize(file.size),
                status: 'pending'
            }))

        setFiles((prev) => [...prev, ...newFiles])
    }

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
        handleFiles(e.dataTransfer.files)
    }

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((item) => item.id !== id))
    }

    const pendingCount = files.filter((f) => f.status === 'pending').length
    const processingCount = files.filter((f) => f.status === 'processing').length

    return (
        <div className="flex h-full w-full flex-col overflow-hidden space-y-4">
            <Card
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`shrink-0 border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:bg-muted/50'
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
                />
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mx-auto">
                    <Upload className="h-5 w-5" />
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">
                    Click or drag PDF files here
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Up to 10MB each</p>
            </Card>

            {files.length > 0 && (
                <div className="flex flex-1 flex-col min-h-0 space-y-3 overflow-hidden">
                    <div className="flex items-center justify-between shrink-0">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Selected Documents
                        </span>
                        <Badge variant="secondary">{files.length}</Badge>
                    </div>

                    <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-border bg-card">
                        <ScrollArea className="h-full w-full">
                            <ul className="divide-y divide-border">
                                {files.map(({
                                    id, file, size, status
                                }) => (
                                    <li key={id} className="flex items-center justify-between p-3 text-sm">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FileText className="h-5 w-5 shrink-0 text-primary" />
                                            <div className="truncate">
                                                <p className="truncate font-medium text-foreground">
                                                    {file.name}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">{size}</span>
                                                    {status === 'failed' && (
                                                        <span className="text-xs font-medium text-destructive">
                                                            Failed to process
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {status === 'processing' && (
                                                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    <span>Processing</span>
                                                </div>
                                            )}

                                            {status === 'uploaded' && (
                                                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span>Ready</span>
                                                </div>
                                            )}

                                            {status === 'failed' && (
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            removeFile(id)
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}

                                            {status === 'pending' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    disabled={isUploading}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        removeFile(id)
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </ScrollArea>
                    </div>

                    {processingCount > 0 && pendingCount === 0 && !isUploading && (
                        <p className="text-xs text-muted-foreground text-center animate-pulse">
                            Documents are being indexed in the background. You can close this panel.
                        </p>
                    )}

                    <Button
                        onClick={handleUploadDocument}
                        disabled={isUploading || pendingCount === 0}
                        className="w-full shrink-0 gap-2"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Uploading to server...</span>
                            </>
                        ) : (
                            <>
                                <ArrowUpRight className="h-4 w-4" />
                                <span>
                                    {pendingCount > 0
                                        ? `Upload ${pendingCount} new ${pendingCount === 1 ? 'file' : 'files'}`
                                        : 'All documents uploaded'}
                                </span>
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}