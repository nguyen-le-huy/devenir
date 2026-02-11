import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconPhoto, IconCheck, IconClock, IconEdit } from "@tabler/icons-react"

interface SocialStatsCardsProps {
    totalProducts: number
    postedCount: number
    scheduledCount: number
    draftCount: number
}

export function SocialStatsCards({
    totalProducts,
    postedCount,
    scheduledCount,
    draftCount
}: SocialStatsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                    <IconPhoto className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalProducts}</div>
                    <p className="text-xs text-muted-foreground mt-1">All content assets</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Published</CardTitle>
                    <IconCheck className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{postedCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">Live on Facebook</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                    <IconClock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{scheduledCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">Queued for posting</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                    <IconEdit className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{draftCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">Need attention</p>
                </CardContent>
            </Card>
        </div>
    )
}
