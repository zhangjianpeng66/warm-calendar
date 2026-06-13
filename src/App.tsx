import { useState } from 'react'
import { AppProvider } from '@/hooks/useApp'
import { WeekView } from '@/components/WeekView'
import { MonthPlan } from '@/components/MonthPlan'
import { YearPlan } from '@/components/YearPlan'
import { Settings } from '@/components/Settings'
import { BottomNav } from '@/components/BottomNav'

export type Tab = 'week' | 'month' | 'year' | 'settings'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('week')

  return (
    <AppProvider>
      <div className="flex flex-col h-dvh bg-background text-foreground">
        <main className="flex-1 overflow-hidden">
          {activeTab === 'week' && <WeekView />}
          {activeTab === 'month' && <MonthPlan />}
          {activeTab === 'year' && <YearPlan />}
          {activeTab === 'settings' && <Settings />}
        </main>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </AppProvider>
  )
}
