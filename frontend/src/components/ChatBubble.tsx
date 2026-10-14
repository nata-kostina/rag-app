import {
    Bot, Sparkles, FileText, ChevronUp, ChevronDown, User
} from 'lucide-react'
import { useState } from 'react'

import type { Message } from '@/types/chat'

import { Badge } from '@/components/ui/badge'

interface ChatBubbleProps {
    msg: Message
}

export function ChatBubble({ msg }: Readonly<ChatBubbleProps>) {
    const [expandedCitationId, setExpandedCitationId] = useState<string | null>(null)

    const toggleCitation = (citationId: string) => {
        setExpandedCitationId((prev) => (prev === citationId ? null : citationId))
    }

    return (
        <div
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
        >
            {msg.sender === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bot className="h-5 w-5" />
                </div>
            )}

            <div className="flex max-w-[80%] flex-col space-y-2">
                <div
                    className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-card border border-border text-card-foreground rounded-tl-none'
                    }`}
                >
                    {/* Если текст есть — выводим текст. Если текста еще нет (бот ожидает) — выводим 3 точки */}
                    {msg.text ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    ) : (
                        msg.sender === 'assistant' && (
                            <div className="flex items-center gap-1.5 py-1 px-0.5">
                                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
                            </div>
                        )
                    )}

                    {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border/60">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                <span>Sources:</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {msg.citations.map((cite) => {
                                    const isExpanded = expandedCitationId === cite.id
                                    return (
                                        <div key={cite.id} className="w-full">
                                            <Badge
                                                variant="outline"
                                                onClick={() => toggleCitation(cite.id)}
                                                className="cursor-pointer hover:bg-muted/80 gap-1.5 py-1 px-2.5 font-normal transition-colors"
                                            >
                                                <FileText className="h-3.5 w-3.5 text-primary" />
                                                <span>{cite.originalFilename}</span>
                                                {isExpanded ? (
                                                    <ChevronUp className="h-3 w-3 ml-1 text-muted-foreground" />
                                                ) : (
                                                    <ChevronDown className="h-3 w-3 ml-1 text-muted-foreground" />
                                                )}
                                            </Badge>

                                            {isExpanded && (
                                                <div className="mt-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground border border-border/80 space-y-1">
                                                    <div className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                                                        Document Excerpt:
                                                    </div>
                                                    <p className="italic font-serif leading-normal">
                                                        {cite.text}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <span className="text-[10px] text-muted-foreground px-1 self-end">
                    {msg.timestamp}
                </span>
            </div>

            {msg.sender === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <User className="h-5 w-5" />
                </div>
            )}
        </div>
    )
}