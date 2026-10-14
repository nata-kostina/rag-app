import {
    CheckCircle2, AlertCircle, MessageSquare, Coins, Quote, FileText
} from 'lucide-react'

import type { Query } from '@/types/query'

import { DataEmpty } from '@/components/DataEmpty'
import { DataError } from '@/components/DataError'
import { DataSkeleton } from '@/components/DataSkeleton'
import {
    Accordion, AccordionItem, AccordionTrigger, AccordionContent
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ApiService } from '@/services/ApiService'
import { useFetch } from '@/utils/hooks'

export function HistoryLayout() {
    const {
        data: queries,
        isLoading,
        error,
        refetch,
    } = useFetch(ApiService.getQueries)

    const renderStatusBadge = (status: Query['status']) => {
        switch (status) {
            case 'success':
                return (
                    <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800 gap-1.5 py-0.5 px-2 shrink-0 text-xs"
                    >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Success
                    </Badge>
                )
            case 'error':
                return (
                    <Badge
                        variant="outline"
                        className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800 gap-1.5 py-0.5 px-2 shrink-0 text-xs"
                    >
                        <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        Error
                    </Badge>
                )
        }
    }

    return (
        <div className="w-full max-w-5xl mx-auto py-6 px-4 sm:px-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Query History</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Review your past searches, model responses, and cited document fragments.
                </p>
            </div>

            {isLoading ? (
                <DataSkeleton count={4} />
            ) : error ? (
                <DataError
                    title="Failed to load history"
                    message={error.message}
                    onRetry={refetch}
                />
            ) : queries?.length === 0 ? (
                <DataEmpty
                    title="No queries yet"
                    description="Your search history will appear here once you start querying documents."
                    icon={<MessageSquare className="w-6 h-6" />}
                />
            ) : (
                <ScrollArea className="h-[calc(100vh-220px)] pr-3">
                    <Accordion
                        className="space-y-2.5"
                    >
                        {queries &&
                            queries.map((item) => (
                                <AccordionItem
                                    key={item.id}
                                    value={item.id}
                                    className="border border-border rounded-xl bg-card px-4 py-1 transition-colors hover:bg-accent/30 data-[state=open]:bg-accent/20"
                                >
                                    <AccordionTrigger className="hover:no-underline py-3.5 gap-3 items-start">
                                        <div className="flex items-start gap-3 min-w-0 flex-1 text-left">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                                                <MessageSquare className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0 flex-1 pr-2 space-y-1">
                                                <p className="font-medium text-sm text-foreground break-words leading-snug line-clamp-2 data-[state=open]:line-clamp-none">
                                                    {item.query}
                                                </p>
                                                {item.total_tokens !== undefined && (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Coins className="w-3 h-3 shrink-0" />
                                                        <span>{item.total_tokens} tokens</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mr-2 shrink-0 mt-0.5">
                                            {renderStatusBadge(item.status)}
                                        </div>
                                    </AccordionTrigger>

                                    <AccordionContent className="pt-2 pb-4 space-y-4 border-t border-border/60 mt-1">
                                        <div>
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                                Response
                                            </h4>
                                            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-muted/40 p-3.5 rounded-lg border border-border/40">
                                                {item.response || (
                                                    <span className="text-muted-foreground italic">
                                                        No response generated.
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {item.citations && item.citations.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                                                    <Quote className="w-3.5 h-3.5" />
                                                    Citations ({item.citations.length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {item.citations.map((citation, index) => (
                                                        <div
                                                            key={`${citation.chunk_id}-${index}`}
                                                            className="text-xs p-3 rounded-lg border border-border bg-background/60 space-y-1"
                                                        >
                                                            <div className="flex items-center gap-1.5 font-medium text-primary">
                                                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                                                <span className="truncate">{citation.original_filename}</span>
                                                                <span className="text-muted-foreground text-[10px]">
                                                                    (Chunk: {citation.chunk_id.slice(0, 8)}...)
                                                                </span>
                                                            </div>
                                                            <p className="text-muted-foreground leading-normal line-clamp-3 italic pl-5 border-l-2 border-primary/30 mt-1">
                                                                &quot;{citation.text}&quot;
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {(item.prompt_tokens !== undefined || item.completion_tokens !== undefined) && (
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/40">
                                                {item.prompt_tokens !== undefined && (
                                                    <span>Prompt tokens: <strong>{item.prompt_tokens}</strong></span>
                                                )}
                                                {item.completion_tokens !== undefined && (
                                                    <span>Completion tokens: 
                                                        <strong>{item.completion_tokens}</strong></span>
                                                )}
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                    </Accordion>
                </ScrollArea>
            )}
        </div>
    )
}