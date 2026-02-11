import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { SETTINGS_KEY } from '../types'
import type { SocialSettings } from '../types'

export function useSocialSettings() {
    const [settings, setSettings] = useState<SocialSettings>({ webhookUrl: "", pageId: "" })
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    // Load settings from localStorage
    useEffect(() => {
        const savedSettings = localStorage.getItem(SETTINGS_KEY)
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings)
                setSettings(parsed)
            } catch (e) {
                console.error("Failed to parse saved settings", e)
            }
        }
    }, [])

    const saveSettings = (newSettings: SocialSettings) => {
        if (!newSettings.webhookUrl || !newSettings.pageId) {
            toast.error("Please fill in both Webhook URL and Page ID")
            return
        }
        setSettings(newSettings)
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
        setIsSettingsOpen(false)
        toast.success("Settings saved successfully!")
    }

    const isConfigured = Boolean(settings.webhookUrl && settings.pageId)

    return {
        settings,
        isSettingsOpen,
        setIsSettingsOpen,
        saveSettings,
        isConfigured
    }
}
