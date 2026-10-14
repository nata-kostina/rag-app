import {
    FileText, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react'

import { DataEmpty } from '@/components/DataEmpty'
import { DataError } from '@/components/DataError'
import { DataSkeleton } from '@/components/DataSkeleton'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ApiService } from '@/services/ApiService'
import { type Document } from '@/types/document'
import { useFetch } from '@/utils/hooks'

export function DocumentsLayout() {
    const {
        data: documents,
        isLoading,
        error,
        refetch,
    } = useFetch(ApiService.getDocuments)

    const renderStatusBadge = (status: Document['status']) => {
        switch (status) {
            case 'uploaded':
                return (
                    <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800 gap-1.5 py-1 px-2.5 shrink-0"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Uploaded
                    </Badge>
                )
            case 'processing':
                return (
                    <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800 gap-1.5 py-1 px-2.5 shrink-0"
                    >
                        <Loader2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                        Processing
                    </Badge>
                )
            case 'failed':
                return (
                    <Badge
                        variant="outline"
                        className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800 gap-1.5 py-1 px-2.5 shrink-0"
                    >
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        Failed
                    </Badge>
                )
        }
    }

    return (
        <div className="w-full max-w-5xl mx-auto py-6 px-4 sm:px-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Documents</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    A list of your indexed documents and their processing status.
                </p>
            </div>

            {isLoading ? (
                <DataSkeleton count={4} />
            ) : error ? (
                <DataError
                    title="Failed to load documents"
                    message={error.message}
                    onRetry={refetch}
                />
            ) : documents?.length === 0 ? (
                <DataEmpty
                    title="No documents found"
                    description="There are no documents available in your knowledge base."
                    icon={<FileText className="w-6 h-6" />}
                />
            ) : (
                <ScrollArea className="h-[calc(100vh-220px)] pr-3">
                    <div className="space-y-2.5">
                        {documents?.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-accent/40 transition-colors gap-4"
                            >
                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm text-foreground truncate">
                                            {doc.originalFilename}
                                        </p>
                                    </div>
                                </div>

                                {renderStatusBadge(doc.status)}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    )
}