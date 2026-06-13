import { useState, useEffect } from 'react'
import { useApp } from '@/hooks/useApp'
import { THEMES } from '@/data/constants'
import { db } from '@/data/db'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, Upload, FileText, Image, Palette, Check, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Settings() {
  const { settings, setTheme } = useApp()
  const setExporting = useState(false)[1]
  const [installPrompt, setInstallPrompt] = useState<any>(null)

  // 监听 PWA 安装事件
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt()
      const result = await installPrompt.userChoice
      if (result.outcome === 'accepted') {
        setInstallPrompt(null)
      }
    } else {
      alert('请使用 Chrome 浏览器，点右上角 ⋮ → 添加到主屏幕')
    }
  }

  // 导出 JSON 备份
  const exportJSON = async () => {
    setExporting(true)
    try {
      const [tasks, recurringRules, monthlyGoals, yearlyGoals] = await Promise.all([
        db.tasks.toArray(),
        db.recurringRules.toArray(),
        db.monthlyGoals.toArray(),
        db.yearlyGoals.toArray(),
      ])
      const data = { tasks, recurringRules, monthlyGoals, yearlyGoals, exportedAt: new Date().toISOString() }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `温暖日历_备份_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  // 导入 JSON 备份
  const importJSON = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (data.tasks) {
          await db.tasks.bulkPut(data.tasks)
        }
        if (data.recurringRules) {
          await db.recurringRules.bulkPut(data.recurringRules)
        }
        if (data.monthlyGoals) {
          await db.monthlyGoals.bulkPut(data.monthlyGoals)
        }
        if (data.yearlyGoals) {
          await db.yearlyGoals.bulkPut(data.yearlyGoals)
        }
        alert('数据已成功导入！刷新页面即可看到。')
        window.location.reload()
      } catch {
        alert('导入失败，请检查文件格式。')
      }
    }
    input.click()
  }

  // 导出为图片 (使用 html2canvas)
  const exportImage = async () => {
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const el = document.getElementById('export-area')
      if (!el) {
        alert('请先切换到月计划或年规划页面查看数据')
        return
      }
      const canvas = await html2canvas(el, { backgroundColor: '#fff8f0' })
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `温暖日历_统计_${new Date().toISOString().slice(0, 10)}.png`
      a.click()
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <header className="px-4 pt-3 pb-2">
        <h2 className="text-lg font-semibold">设置</h2>
      </header>

      <div className="px-4 space-y-5 pb-8">
        {/* 主题选择 */}
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Palette size={14} />主题风格
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                  settings?.activeTheme === theme.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/30 bg-card'
                )}
              >
                <span className="text-2xl">{theme.emoji}</span>
                <span className="text-xs font-medium">{theme.name}</span>
                <span className="text-xs text-muted-foreground">{theme.description}</span>
                {settings?.activeTheme === theme.id && (
                  <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check size={12} className="text-primary-foreground" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* 数据导出 */}
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Download size={14} />数据导出
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Card className="p-3 flex flex-col items-center gap-1.5 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={exportJSON}>
              <FileText size={20} className="text-primary" />
              <span className="text-xs font-medium">JSON 备份</span>
              <span className="text-xs text-muted-foreground">数据恢复用</span>
            </Card>
            <Card className="p-3 flex flex-col items-center gap-1.5 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={exportImage}>
              <Image size={20} className="text-primary" />
              <span className="text-xs font-medium">图片截图</span>
              <span className="text-xs text-muted-foreground">分享回顾用</span>
            </Card>
          </div>
        </section>

        {/* 数据导入 */}
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Upload size={14} />数据导入
          </h3>
          <Button variant="outline" size="sm" onClick={importJSON} className="w-full">
            从 JSON 文件恢复数据
          </Button>
        </section>

        {/* PWA 安装 */}
        {installPrompt && (
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Smartphone size={14} />添加到桌面
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleInstall}
              className="w-full h-12 rounded-2xl text-base font-medium border-2 border-primary/30 hover:bg-primary/5"
            >
              🏠 安装「一小步」到手机桌面
            </Button>
          </section>
        )}

        {/* 关于 */}
        <section className="text-center pt-4">
          <p className="text-xs text-muted-foreground">
            一小步 v1.3.1 · 每一步都算数
          </p>
        </section>
      </div>
    </div>
  )
}
