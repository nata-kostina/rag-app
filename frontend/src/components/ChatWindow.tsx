import { Send, Square } from 'lucide-react'
import {
    useEffect, useRef, useState 
} from 'react'

import { ChatBubble } from './ChatBubble'

import type { Message } from '@/types/chat'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ChatWindowProps {
    messages: Message[]
    isGenerating: boolean
    onSendMessage: (text: string) => void
    onStopGeneration?: () => void
}

export function ChatWindow({
    messages,
    isGenerating,
    onSendMessage,
    onStopGeneration,
}: Readonly<ChatWindowProps>) {
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = () => {
        if (!input.trim() || isGenerating) return
        onSendMessage(input.trim())
        setInput('')
    }

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-background">
            <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full w-full p-4">
                    <div className="mx-auto max-w-3xl space-y-6 pb-4">
                        {messages.map((msg) => (
                            <ChatBubble key={msg.id} msg={msg} />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </div>

            <div className="shrink-0 border-t border-border bg-card p-4">
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        handleSend()
                    }}
                    className="mx-auto flex max-w-3xl items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-ring/50"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        disabled={isGenerating}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
                    />

                    {isGenerating ? (
                        <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={onStopGeneration}
                            title="Stop generation"
                            className="shrink-0 text-destructive hover:bg-destructive/10"
                        >
                            <Square className="h-4 w-4 fill-current" />
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            size="icon-sm"
                            disabled={!input.trim()}
                            className="shrink-0"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    )}
                </form>
            </div>
        </div>
    )
}