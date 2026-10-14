import { useState } from 'react'

import { Header } from './components/Header'
import { ChatLayout } from './layouts/ChatLayout'
import { DocumentsLayout } from './layouts/DocumentsLayout'
import { HistoryLayout } from './layouts/HistoryLayout'
import { WelcomeLayout } from './layouts/WelcomeLayout'
import { Layout } from './types/ui'

export function App() {
    const [layout, setLayout] = useState<Layout>(Layout.WELCOME)

    const changeLayout = (layout: Layout) => {
        setLayout(layout)
    }

    return (
        <div className="flex flex-1 flex-col overflow-hidden h-screen bg-background text-foreground">
            {layout !== Layout.WELCOME && <Header changeLayout={changeLayout} activeLayout={layout} />}
            {layout == Layout.WELCOME && <WelcomeLayout changeLayout={changeLayout} />}
            {layout == Layout.CHAT && <ChatLayout />}
            {layout == Layout.DOCUMENTS && <DocumentsLayout />}
            {layout == Layout.HISTORY && <HistoryLayout />}
        </div >
    )
}