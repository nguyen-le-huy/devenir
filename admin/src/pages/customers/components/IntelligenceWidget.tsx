import { useEffect, useState } from 'react'
import { IconBrain, IconCheck, IconLoader, IconSparkles, IconTag } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { customerService } from '@/services/customerService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface IntelligenceWidgetProps {
  customerId: string
  onUpdate?: () => void // Callback to refetch customer data after applying tags/notes
}

interface SuggestedTag {
  tag: string
  reason: string
  confidence: number
  type: string
}

interface SuggestedNote {
  type: string
  content: string
  confidence: number
  priority: string
}

interface QuickInsights {
  customerType: string
  engagementScore: number
  riskLevel: string
  topTags: SuggestedTag[]
  topNotes: SuggestedNote[]
  nextAction: {
    action: string
    message: string
    priority: string
  }
  stats: {
    totalViews: number
    totalPurchases: number
    totalSpent: number
    cartAbandonment: number
  }
  dataSource?: 'hybrid' | 'orders' | 'eventlog' // NEW: For debugging
}

const typeColors: Record<string, string> = {
  interest: 'bg-blue-100 text-blue-900 border-blue-200',
  preference: 'bg-purple-100 text-purple-900 border-purple-200',
  behavior: 'bg-green-100 text-green-900 border-green-200',
  needs: 'bg-orange-100 text-orange-900 border-orange-200',
}

const notePriorityColors: Record<string, string> = {
  high: 'border-l-4 border-l-red-500 bg-red-50',
  medium: 'border-l-4 border-l-yellow-500 bg-yellow-50',
  low: 'border-l-4 border-l-blue-500 bg-blue-50',
}

const customerTypeColors: Record<string, string> = {
  'VIP Premium': 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  'Loyal Customer': 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
  'High-Intent Browser': 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
  'Price-Conscious Shopper': 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
  'Window Shopper': 'bg-gray-100 text-gray-900',
  'New Visitor': 'bg-gray-50 text-gray-600',
}

export function IntelligenceWidget({ customerId, onUpdate }: IntelligenceWidgetProps) {
  const [insights, setInsights] = useState<QuickInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApplying, setIsApplying] = useState<string | null>(null)
  const [appliedTags, setAppliedTags] = useState<Set<string>>(new Set())
  const [appliedNotes, setAppliedNotes] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!customerId) return
    loadInsights()
  }, [customerId])

  const loadInsights = async () => {
    try {
      setIsLoading(true)
      const response = await customerService.getQuickInsights(customerId)
      if (response.success) {
        setInsights(response.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải dữ liệu intelligence')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyTag = async (tag: SuggestedTag) => {
    try {
      setIsApplying(tag.tag)
      await customerService.applyTags(customerId, [tag.tag])
      setAppliedTags(prev => new Set(prev).add(tag.tag))
      toast.success(`Đã thêm tag "${tag.tag}" vào customer profile`)
      onUpdate?.() // Trigger refetch customer data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể áp dụng tag')
    } finally {
      setIsApplying(null)
    }
  }

  const handleApplyNote = async (note: SuggestedNote, index: number) => {
    try {
      setIsApplying(`note-${index}`)
      await customerService.applyNotes(customerId, [{
        type: note.type,
        content: note.content,
        priority: note.priority
      }])
      setAppliedNotes(prev => new Set(prev).add(index))
      toast.success('Note đã được thêm vào customer profile')
      onUpdate?.() // Trigger refetch customer data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể áp dụng note')
    } finally {
      setIsApplying(null)
    }
  }

  const handleApplyAllTags = async () => {
    if (!insights?.topTags.length) return
    
    try {
      setIsApplying('all-tags')
      const tags = insights.topTags.map(t => t.tag)
      console.log('[Apply Tags] Sending request:', { customerId, tags })
      const response = await customerService.applyTags(customerId, tags)
      console.log('[Apply Tags] Success:', response)
      setAppliedTags(new Set(tags))
      toast.success(`Đã thêm ${tags.length} tags vào customer profile`)
      onUpdate?.() // Trigger refetch customer data
    } catch (error: any) {
      console.error('[Apply Tags] Error:', error)
      console.error('[Apply Tags] Error response:', error.response)
      toast.error(error.response?.data?.message || 'Không thể áp dụng tags')
    } finally {
      setIsApplying(null)
    }
  }

  const handleApplyAllNotes = async () => {
    if (!insights?.topNotes.length) return
    
    try {
      setIsApplying('all-notes')
      const notes = insights.topNotes.map(n => ({
        type: n.type,
        content: n.content,
        priority: n.priority
      }))
      console.log('[Apply Notes] Sending request:', { customerId, notes })
      const response = await customerService.applyNotes(customerId, notes)
      console.log('[Apply Notes] Success:', response)
      setAppliedNotes(new Set(insights.topNotes.map((_, i) => i)))
      toast.success(`Đã thêm ${notes.length} notes vào customer profile`)
      onUpdate?.() // Trigger refetch customer data
    } catch (error: any) {
      console.error('[Apply Notes] Error:', error)
      console.error('[Apply Notes] Error response:', error.response)
      toast.error(error.response?.data?.message || 'Không thể áp dụng notes')
    } finally {
      setIsApplying(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!insights) {
    return null
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconBrain className="h-5 w-5 text-primary" />
            <CardTitle>AI Customer Intelligence</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <IconSparkles className="h-5 w-5 text-amber-500" />
            {insights.dataSource && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  insights.dataSource === 'hybrid' && "bg-green-50 text-green-700 border-green-200",
                  insights.dataSource === 'orders' && "bg-blue-50 text-blue-700 border-blue-200",
                  insights.dataSource === 'eventlog' && "bg-purple-50 text-purple-700 border-purple-200"
                )}
              >
                {insights.dataSource === 'hybrid' ? '⚡ Hybrid' : 
                 insights.dataSource === 'orders' ? '📊 Orders' : 
                 '🔍 Tracking'}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          AI-powered insights từ behavior analysis (30 ngày gần nhất)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Customer Type & Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge 
              className={cn(
                'px-4 py-1.5 text-sm font-semibold',
                customerTypeColors[insights.customerType] || 'bg-gray-100 text-gray-900'
              )}
            >
              {insights.customerType}
            </Badge>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="text-muted-foreground text-xs">Engagement</p>
                <p className="font-bold text-lg">{insights.engagementScore}/100</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-center">
                <p className="text-muted-foreground text-xs">Risk</p>
                <Badge variant={insights.riskLevel === 'high' ? 'destructive' : insights.riskLevel === 'low' ? 'default' : 'secondary'}>
                  {insights.riskLevel}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-lg border bg-card p-2">
              <p className="text-xs text-muted-foreground">Views</p>
              <p className="font-bold">{insights.stats.totalViews}</p>
            </div>
            <div className="rounded-lg border bg-card p-2">
              <p className="text-xs text-muted-foreground">Orders</p>
              <p className="font-bold">{insights.stats.totalPurchases}</p>
            </div>
            <div className="rounded-lg border bg-card p-2">
              <p className="text-xs text-muted-foreground">Spent</p>
              <p className="font-bold text-xs">${(insights.stats.totalSpent / 1000).toFixed(0)}k</p>
            </div>
            <div className="rounded-lg border bg-card p-2">
              <p className="text-xs text-muted-foreground">Abandon</p>
              <p className="font-bold">{insights.stats.cartAbandonment}%</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Suggested Tags */}
        {insights.topTags.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <IconTag className="h-4 w-4" />
                AI-Suggested Tags ({insights.topTags.length})
              </h4>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleApplyAllTags}
                disabled={isApplying === 'all-tags' || insights.topTags.every(t => appliedTags.has(t.tag))}
              >
                {isApplying === 'all-tags' ? (
                  <><IconLoader className="mr-2 h-3 w-3 animate-spin" /> Đang áp dụng...</>
                ) : (
                  'Áp dụng tất cả'
                )}
              </Button>
            </div>

            <div className="space-y-2">
              {insights.topTags.map((tag) => {
                const isApplied = appliedTags.has(tag.tag)
                const isApplying_  = isApplying === tag.tag
                
                return (
                  <div 
                    key={tag.tag} 
                    className={cn(
                      'rounded-lg border p-3 transition-all',
                      isApplied && 'bg-green-50 border-green-200'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={cn('text-xs', typeColors[tag.type] || 'bg-gray-100 text-gray-900')}>
                            {tag.tag}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(tag.confidence * 100)}% confidence
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{tag.reason}</p>
                      </div>
                      
                      {isApplied ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <IconCheck className="h-3 w-3 mr-1" /> Applied
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleApplyTag(tag)}
                          disabled={isApplying_}
                          className="h-7 px-2"
                        >
                          {isApplying_ ? (
                            <IconLoader className="h-3 w-3 animate-spin" />
                          ) : (
                            <IconCheck className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Suggested Notes */}
        {insights.topNotes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">AI-Suggested Notes ({insights.topNotes.length})</h4>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleApplyAllNotes}
                disabled={isApplying === 'all-notes' || insights.topNotes.every((_, i) => appliedNotes.has(i))}
              >
                {isApplying === 'all-notes' ? (
                  <><IconLoader className="mr-2 h-3 w-3 animate-spin" /> Đang áp dụng...</>
                ) : (
                  'Áp dụng tất cả'
                )}
              </Button>
            </div>

            <div className="space-y-2">
              {insights.topNotes.map((note, index) => {
                const isApplied = appliedNotes.has(index)
                const isApplying_ = isApplying === `note-${index}`
                
                return (
                  <div 
                    key={index}
                    className={cn(
                      'rounded-lg p-3 transition-all',
                      notePriorityColors[note.priority] || 'border-l-4 border-l-gray-300',
                      isApplied && 'bg-green-50 border-l-green-500'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {note.type}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-xs',
                              note.priority === 'high' && 'bg-red-50 text-red-700 border-red-200',
                              note.priority === 'medium' && 'bg-yellow-50 text-yellow-700 border-yellow-200',
                              note.priority === 'low' && 'bg-blue-50 text-blue-700 border-blue-200'
                            )}
                          >
                            {note.priority} priority
                          </Badge>
                        </div>
                        <p className="text-sm">{note.content}</p>
                      </div>

                      {isApplied ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <IconCheck className="h-3 w-3 mr-1" /> Applied
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleApplyNote(note, index)}
                          disabled={isApplying_}
                          className="h-7 px-2"
                        >
                          {isApplying_ ? (
                            <IconLoader className="h-3 w-3 animate-spin" />
                          ) : (
                            <IconCheck className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Next Best Action */}
        <div className="rounded-lg bg-linear-to-r from-primary/10 to-primary/5 p-4 border border-primary/20">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <IconSparkles className="h-4 w-4 text-primary" />
            Recommended Action
          </h4>
          <p className="text-sm mb-2">{insights.nextAction.message}</p>
          <Badge variant={insights.nextAction.priority === 'high' ? 'default' : 'secondary'} className="text-xs">
            {insights.nextAction.priority} priority
          </Badge>
        </div>

        {/* No Suggestions */}
        {insights.topTags.length === 0 && insights.topNotes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <IconBrain className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Chưa đủ dữ liệu để generate insights</p>
            <p className="text-xs mt-1">Insights sẽ xuất hiện khi customer có hoạt động</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
