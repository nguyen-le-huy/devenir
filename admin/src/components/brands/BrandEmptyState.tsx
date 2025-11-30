import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconMoodEmpty, IconPlus } from '@tabler/icons-react'

interface BrandEmptyStateProps {
  onCreate?: () => void
}

export function BrandEmptyState({ onCreate }: BrandEmptyStateProps) {
  return (
    <Card className="border-dashed text-center">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
        <IconMoodEmpty className="h-10 w-10" />
        <p>No brands match your filter.</p>
        <Button onClick={onCreate}>
          <IconPlus className="mr-2 h-4 w-4" /> Add first brand
        </Button>
      </CardContent>
    </Card>
  )
}
