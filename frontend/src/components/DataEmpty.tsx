import { Inbox } from 'lucide-react'

interface DataEmptyProps {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
}

export function DataEmpty({
    title = 'No items found',
    description = 'There is no data to display right now.',
    icon,
}: DataEmptyProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-xl border-border text-center p-6 bg-card/30">
            <div className="p-3 bg-muted rounded-full mb-3 text-muted-foreground">
                {icon || <Inbox className="w-6 h-6" />}
            </div>
            <h3 className="font-semibold text-base text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
        </div>
    )
}