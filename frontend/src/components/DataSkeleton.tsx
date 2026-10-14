import { Skeleton } from '@/components/ui/skeleton'

interface DataSkeletonProps {
    count?: number;
    variant?: 'card' | 'line' | 'table';
}

export function DataSkeleton({ count = 3, variant = 'card' }: DataSkeletonProps) {
    if (variant === 'line') {
        return (
            <div className="space-y-2.5 w-full">
                {Array.from({ length: count }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full rounded-lg" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-3 w-full">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="p-4 border border-border rounded-xl bg-card/50 flex items-center gap-4 justify-between"
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                        <div className="space-y-2 flex-1 min-w-0">
                            <Skeleton className="h-4 w-2/3 rounded" />
                            <Skeleton className="h-3 w-1/3 rounded" />
                        </div>
                    </div>
                    <Skeleton className="h-6 w-16 rounded-md shrink-0" />
                </div>
            ))}
        </div>
    )
}

