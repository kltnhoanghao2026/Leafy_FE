import { useState } from 'react'
import { ProfileSettingsCard } from '../components/ProfileSettingsCard'
import { DisplaySettingsCard } from '../components/DisplaySettingsCard'
import { AboutCard } from '../components/AboutCard'
import { SecuritySettingsCard } from '../components/SecuritySettingsCard'
import { PrivacySettingsCard } from '../components/PrivacySettingsCard'
import { NotificationSettingsCard } from '../components/NotificationSettingsCard'
import { MessageSettingsCard } from '../components/MessageSettingsCard'
import { SyncAndUtilitiesCard } from '../components/SyncAndUtilitiesCard'
import { User, Monitor, Shield, Bell, MessageCircle } from 'lucide-react'
import { useTranslation } from '../../../i18n/useTranslation'

type TabId = 'account' | 'display' | 'privacy' | 'notifications' | 'messaging'

export function SettingsView() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabId>('account')

  const tabs = [
    { id: 'account', label: t('settings.tabs.account'), icon: <User className="w-4 h-4" /> },
    { id: 'display', label: t('settings.tabs.display'), icon: <Monitor className="w-4 h-4" /> },
    { id: 'privacy', label: t('settings.tabs.privacy'), icon: <Shield className="w-4 h-4" /> },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: <Bell className="w-4 h-4" /> },
    { id: 'messaging', label: t('settings.tabs.messaging'), icon: <MessageCircle className="w-4 h-4" /> },
  ] as const

  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-screen pb-10 pt-6 px-4 sm:px-8 lg:px-12 xl:px-16">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">{t('settings.title')}</h1>
        <p className="text-sm font-semibold text-slate-500 mt-1.5">
          {t('settings.subtitle')}
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
                activeTab === tab.id
                  ? 'bg-[#245A34] text-white shadow-md shadow-[#245A34]/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full space-y-6">
          {activeTab === 'account' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ProfileSettingsCard />
              <SecuritySettingsCard />
            </div>
          )}
          
          {activeTab === 'display' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <DisplaySettingsCard />
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <PrivacySettingsCard />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <NotificationSettingsCard />
            </div>
          )}

          {activeTab === 'messaging' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <MessageSettingsCard />
              <SyncAndUtilitiesCard />
              <AboutCard />
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 text-center pb-4 border-t border-slate-200 pt-8">
        <p className="text-[13px] font-bold text-slate-400">
          {t('settings.copyright')}
        </p>
      </div>
    </div>
  )
}
