import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { db, initSettings } from '@/data/db'
import type { AppSettings, ThemeId } from '@/data/types'
import { themeToDataAttr } from '@/data/constants'

interface AppContextType {
  settings: AppSettings | null
  setTheme: (theme: ThemeId) => Promise<void>
}

const AppContext = createContext<AppContextType>({
  settings: null,
  setTheme: async () => {},
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    initSettings().then(setSettings)
  }, [])

  useEffect(() => {
    if (settings) {
      const attr = themeToDataAttr(settings.activeTheme)
      if (attr) {
        document.documentElement.setAttribute('data-theme', attr)
      } else {
        document.documentElement.removeAttribute('data-theme')
      }
    }
  }, [settings])

  const setTheme = async (theme: ThemeId) => {
    const updated = { ...settings!, activeTheme: theme }
    await db.settings.put({ ...updated, id: 'main' })
    setSettings(updated)
  }

  return (
    <AppContext.Provider value={{ settings, setTheme }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
