
import { useState, useRef, useEffect } from 'react'
import { useAssistantStore } from '@/stores/useAssistantStore'
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AssistantIcon } from './Icon'
import {
    IconPaperclip,
    IconMicrophone,
    IconSparkles,
    IconChartBar,
    IconPhoto,
    IconMessage,
    IconPencil,
    IconGripVertical,
    IconRefresh,
    IconCopy,
    IconDownload,
    IconArrowDown
} from '@tabler/icons-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { cn } from '@/lib/utils'
import { ragService } from '@/services/ragService'
import { toast } from 'sonner'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content?: string
    isTyping?: boolean
    attachment?: {
        name: string
        type: 'csv' | 'pdf' | 'img'
        url?: string
    }
}

export function ChatWindow() {
    const { isOpen, close } = useAssistantStore()
    const { user } = useAdminAuth()
    const [query, setQuery] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollViewportRef = useRef<HTMLDivElement>(null)
    const [showScrollButton, setShowScrollButton] = useState(false)

    // Initial empty state to show Welcome Screen
    const [messages, setMessages] = useState<Message[]>([])

    // Quick prompt suggestions
    const suggestions = [
        { icon: <IconPhoto size={18} />, label: 'Create image' },
        { icon: <IconChartBar size={18} />, label: 'Analyze data' },
        { icon: <IconSparkles size={18} />, label: 'Make a plan' },
        { icon: <IconMessage size={18} />, label: 'Summarize text' },
        { icon: <IconPencil size={18} />, label: 'Help me write' },
        { icon: <IconGripVertical size={18} />, label: 'More' },
    ]

    const handleSend = async (e?: React.KeyboardEvent | React.MouseEvent | KeyboardEvent) => {
        // Prevent sending when using IME (Vietnamese, Japanese, etc.)
        if (e && 'nativeEvent' in e && (e.nativeEvent as any).isComposing) return

        if (e && e.type === 'keydown') {
            e.preventDefault()
        }

        if (!query.trim()) return

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: query
        }

        // 1. Optimistic update
        setMessages(prev => [...prev, userMsg])
        setQuery('')

        // 2. Show typing indicator
        const typingId = 'typing-' + Date.now()
        setMessages(prev => [...prev, { id: typingId, role: 'assistant', isTyping: true }])

        try {
            // 3. Call API
            const response = await ragService.sendMessage(userMsg.content!)

            // 4. Remove typing & add real response
            setMessages(prev => {
                const filtered = prev.filter(m => m.id !== typingId)
                return [...filtered, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: response.answer || "Sorry, I couldn't generate a response. Please check the system logs.",
                    // Map backend metadata to attachment if needed (future proofing)
                    attachment: response.data?.attachment || response.attachment
                }]
            })

        } catch (error) {
            console.error(error)
            toast.error('Failed to send message')

            // Remove typing on error
            setMessages(prev => prev.filter(m => m.id !== typingId))
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleScroll = () => {
        if (!scrollViewportRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight
        setShowScrollButton(distanceFromBottom > 100)
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    return (
        <Sheet open={isOpen} onOpenChange={close}>
            <SheetContent className="w-full sm:max-w-[450px] p-0 flex flex-col gap-0 border-l border-border/40 shadow-2xl">
                <SheetTitle className="sr-only">Admin Assistant Chat</SheetTitle>
                <SheetDescription className="sr-only">
                    AI Assistant to help with operational tasks like checking revenue, inventory, and orders.
                </SheetDescription>
                {/* Header Icons */}
                <div className='absolute top-2 left-4 z-20'>
                    <div className="h-10 w-10 rounded-full bg-linear-to-b from-background to-muted shadow-sm flex items-center justify-center ring-1 ring-border/50">
                        <AssistantIcon className="h-6 w-6" />
                    </div>
                </div>

                <div className='absolute top-2 right-12 z-20'>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50 hover:text-foreground transition-colors">
                        <IconGripVertical size={20} />
                    </Button>
                </div>

                {/* Main Content Area */}
                <div
                    ref={scrollViewportRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-4 pt-16 space-y-6 scroll-smooth"
                >
                    {messages.length === 0 ? (
                        // Welcome State
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in duration-500">
                            {/* Re-render large icon for welcome state only if empty */}
                            <div className="h-20 w-20 rounded-full bg-linear-to-b from-background to-muted shadow-lg flex items-center justify-center ring-1 ring-border mb-4">
                                <AssistantIcon className="h-12 w-12" />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-xl font-semibold text-foreground">
                                    Hi {user?.username || 'Admin'},
                                </h2>
                                <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                                    Welcome back! How can I help?
                                </h1>
                                <p className="text-muted-foreground text-sm max-w-[280px] mx-auto pt-2">
                                    I'm here to help you tackle your tasks. Choose from the prompts below or just tell me what you need!
                                </p>
                            </div>

                            {/* Suggestion Grid */}
                            <div className="grid grid-cols-2 gap-3 w-full max-w-[360px] pt-4">
                                {suggestions.map((item, idx) => (
                                    <Button
                                        key={idx}
                                        variant="outline"
                                        className="h-auto py-3 px-4 justify-start gap-3 rounded-xl border-dashed hover:border-solid hover:bg-muted/50 hover:text-primary transition-all duration-300"
                                        onClick={() => {
                                            setQuery(item.label)
                                            // Handle send manually if you want instant send, 
                                            // but setting query lets user confirm. 
                                            // Or call handleSend directly:
                                            // handleSend() 
                                        }}
                                    >
                                        <span className="text-muted-foreground group-hover:text-primary">{item.icon}</span>
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Chat Message List
                        <div className="flex flex-col gap-6 pb-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex w-full group relative",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {/* Message Bubble */}
                                    <div
                                        className={cn(
                                            "max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm",
                                            msg.role === 'user'
                                                ? "bg-muted/50 text-foreground rounded-tr-sm"
                                                : "bg-background border border-border/50 text-foreground rounded-tl-sm"
                                        )}
                                    >
                                        {msg.isTyping ? (
                                            <div className="flex gap-1 items-center h-6 px-1">
                                                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce"></span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-3 whitespace-pre-wrap">
                                                {msg.content}

                                                {/* Attachment Card */}
                                                {msg.attachment && (
                                                    <div
                                                        onClick={() => msg.attachment?.url && window.open(msg.attachment.url, '_blank')}
                                                        className="flex items-center gap-3 p-3 mt-1 bg-black text-white rounded-xl shadow-md cursor-pointer hover:bg-black/90 transition-colors group/file"
                                                    >
                                                        <div className="h-8 w-8 rounded-lg bg-green-600/20 flex items-center justify-center text-green-500 font-bold text-xs uppercase border border-green-600/30">
                                                            {msg.attachment.type}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-xs truncate">{msg.attachment.name}</p>
                                                        </div>
                                                        <IconDownload size={16} className="text-gray-400 group-hover/file:text-white transition-colors" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* User Actions Toolbar (Floating on hover) */}
                                    {msg.role === 'user' && !msg.isTyping && (
                                        <div className="absolute -bottom-10 right-0 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                                            <div className="flex items-center gap-1 p-1 bg-foreground text-background rounded-lg shadow-lg scale-90">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-background/20 text-background rounded-md">
                                                    <IconSparkles size={14} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-background/20 text-background rounded-md">
                                                    <IconPencil size={14} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-background/20 text-background rounded-md">
                                                    <IconRefresh size={14} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-background/20 text-background rounded-md">
                                                    <IconCopy size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Floating Scroll Button */}
                {showScrollButton && (
                    <Button
                        size="icon"
                        className="absolute bottom-32 right-6 z-50 rounded-full h-8 w-8 bg-foreground/80 hover:bg-foreground text-background shadow-lg transition-all animate-in fade-in zoom-in duration-300 border border-border/20 backdrop-blur-sm"
                        onClick={scrollToBottom}
                    >
                        <IconArrowDown size={18} />
                    </Button>
                )}

                {/* Footer Input Area */}
                <div className="p-4 border-t bg-background/50 backdrop-blur-sm z-30">
                    <div className="relative flex items-center bg-muted/50 rounded-full border border-input shadow-sm focus-within:ring-1 focus-within:ring-ring transition-all group-focus-within:bg-background">
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground rounded-l-full hover:bg-transparent">
                            <IconPaperclip size={20} />
                        </Button>

                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend(e)}
                            placeholder="Ask me anything..."
                            className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-12"
                        />

                        {query ? (
                            <Button size="icon" className="h-9 w-9 mr-1.5 rounded-full shrink-0" onClick={handleSend}>
                                <IconArrowUp size={18} />
                            </Button>
                        ) : (
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground rounded-r-full hover:bg-transparent">
                                <IconMicrophone size={20} />
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center justify-between px-2 mt-2">
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground gap-1.5 border rounded-md">
                                <span>UUI v6.0</span>
                                <IconChevronDown size={10} />
                            </Button>
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
                            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                                <div className="h-3 w-3 border rounded-[3px] flex items-center justify-center">⌘</div>
                                Shortcuts
                            </button>
                            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                                <IconPaperclip size={10} />
                                Attach
                            </button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

function IconArrowUp({ size = 24, ...props }: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 5l0 14" /><path d="M18 11l-6 -6" /><path d="M6 11l6 -6" /></svg>
}

function IconChevronDown({ size = 24, ...props }: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 9l6 6l6 -6" /></svg>
}
