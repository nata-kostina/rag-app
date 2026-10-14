import {
    Home,
    MessageSquare,
    History,
    FolderOpen,
    Menu
} from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from '@/components/ui/sheet'
import { Layout } from '@/types/ui'

interface HeaderProps {
    changeLayout: (layout: Layout) => void
    activeLayout: Layout
}

export function Header({
    changeLayout,
    activeLayout,
}: Readonly<HeaderProps>) {
    const [isOpen, setIsOpen] = useState(false)

    const handleLayoutChange = (layout: Layout) => {
        changeLayout(layout)
        setIsOpen(false)
    }

    const navItems = [
        {
            layout: Layout.CHAT,
            label: 'Chat',
            icon: MessageSquare,
        },
        {
            layout: Layout.DOCUMENTS,
            label: 'My Documents',
            icon: FolderOpen,
        },
        {
            layout: Layout.HISTORY,
            label: 'History',
            icon: History,
        },
    ]

    return (
        <header className="flex h-14 w-full items-center justify-between border-b border-border bg-card px-4 shrink-0">
            {/* Кнопка Main слева */}
            <div className="flex items-center gap-2">
                <Button
                    variant={activeLayout === Layout.WELCOME ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => changeLayout(Layout.WELCOME)}
                    className="gap-2"
                >
                    <Home className="h-4 w-4" />
                    <span>Main</span>
                </Button>
            </div>

            {/* Навигация для десктопа (hidden на md и ниже) */}
            <div className="hidden md:flex items-center gap-2">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeLayout === item.layout
                    return (
                        <Button
                            key={item.layout}
                            variant={isActive ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => changeLayout(item.layout)}
                            className="gap-2"
                        >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                        </Button>
                    )
                })}
            </div>

            {/* Бургер-меню для мобильных (показывается только на md и меньше) */}
            <div className="flex md:hidden">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger
                        className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground outline-none"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </SheetTrigger>

                    <SheetContent side="right" className="w-[240px] p-4 flex flex-col">
                        <SheetHeader className="mb-4 text-left">
                            <SheetTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Navigation
                            </SheetTitle>
                        </SheetHeader>

                        <nav className="flex flex-col gap-2">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const isActive = activeLayout === item.layout
                                return (
                                    <Button
                                        key={item.layout}
                                        variant={isActive ? 'secondary' : 'ghost'}
                                        size="sm"
                                        onClick={() => handleLayoutChange(item.layout)}
                                        className="justify-start gap-3 w-full"
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{item.label}</span>
                                    </Button>
                                )
                            })}
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    )
}