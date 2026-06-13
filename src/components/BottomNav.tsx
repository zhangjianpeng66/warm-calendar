import { CalendarDays, CalendarRange, CalendarFold, Settings } from 'lucide-react'
import type { Tab } from '@/App'

const tabs: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
  { id: 'week', label: '周视图', icon: CalendarDays },
  { id: 'month', label: '月计划', icon: CalendarRange },
  { id: 'year', label: '年规划', icon: CalendarFold },
  { id: 'settings', label: '设置', icon: Settings },
]

export function BottomNav({ activeTab, onTabChange }: {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}) {
  return (
    <nav className="flex items-center justify-around bg-card border-t border-border pb-safe px-2 pt-1">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200 min-w-0 ${
            activeTab === id
              ? 'text-primary scale-105'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon size={20} strokeWidth={activeTab === id ? 2.5 : 1.8} />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </nav>
  )
}
