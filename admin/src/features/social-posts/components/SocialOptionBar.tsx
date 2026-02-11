import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { IconList, IconLayoutGrid, IconCalendar } from "@tabler/icons-react"
import type { ViewMode, FilterTab } from '../types'

interface SocialOptionBarProps {
    filterTab: FilterTab
    setFilterTab: (tab: FilterTab) => void
    viewMode: ViewMode
    setViewMode: (mode: ViewMode) => void
    searchQuery: string
    setSearchQuery: (query: string) => void
    counts: {
        total: number
        drafts: number
        scheduled: number
        published: number
        errors: number
    }
}

export function SocialOptionBar({
    filterTab,
    setFilterTab,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    counts
}: SocialOptionBarProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Filter Tabs */}
                    <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as FilterTab)}>
                        <TabsList>
                            <TabsTrigger value="all">All ({counts.total})</TabsTrigger>
                            <TabsTrigger value="drafts">Drafts ({counts.drafts})</TabsTrigger>
                            <TabsTrigger value="scheduled">Scheduled ({counts.scheduled})</TabsTrigger>
                            <TabsTrigger value="published">Published ({counts.published})</TabsTrigger>
                            <TabsTrigger value="errors">Errors ({counts.errors})</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Search & View Controls */}
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-64"
                        />
                        <div className="flex items-center border rounded-md">
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className="rounded-r-none"
                            >
                                <IconList className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className="rounded-none border-x"
                            >
                                <IconLayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('calendar')}
                                className="rounded-l-none"
                            >
                                <IconCalendar className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
