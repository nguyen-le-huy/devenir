import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { IconSettings } from "@tabler/icons-react"
import type { SocialSettings as SocialSettingsType } from '../types'

interface SocialSettingsProps {
    isOpen: boolean
    onClose: () => void
    settings: SocialSettingsType
    onSave: (settings: SocialSettingsType) => void
}

export function SocialSettings({
    isOpen,
    onClose,
    settings,
    onSave
}: SocialSettingsProps) {
    const [tempSettings, setTempSettings] = useState<SocialSettingsType>(settings)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <IconSettings className="h-5 w-5" />
                        Social Media Settings
                    </DialogTitle>
                    <DialogDescription>
                        Configure your n8n webhook and Facebook Page credentials.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="webhook">N8N Webhook URL</Label>
                        <Input
                            id="webhook"
                            placeholder="https://n8n.your-domain.com/webhook/..."
                            value={tempSettings.webhookUrl}
                            onChange={(e) => setTempSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                            The endpoint from your n8n Webhook node (Production URL).
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pageId">Facebook Page ID</Label>
                        <Input
                            id="pageId"
                            placeholder="e.g. 905478369317354"
                            value={tempSettings.pageId}
                            onChange={(e) => setTempSettings(prev => ({ ...prev, pageId: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                            Your Facebook Page ID (found in Page Settings &gt; Transparency).
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={() => onSave(tempSettings)}>
                        Save Settings
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
