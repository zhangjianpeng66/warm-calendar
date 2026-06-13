import { useState, useEffect, useCallback } from 'react'
import { format, subMonths, addMonths } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Link2, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { db } from '@/data/db'
import type { MonthlyGoal, YearlyGoal } from '@/data/types'
import { cn } from '@/lib/utils'

// 可爱进度条组件
function CuteProgress({ rate, emoji }: { rate: number; emoji: string }) {
  if (rate === 0) return null
  const messages = rate >= 100 ? '完美！🎉' : rate >= 70 ? '加油！💪' : rate >= 40 ? '继续努力 🌱' : '刚开始呢 🌟'
  return (
    <div className="px-4 mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          {emoji} 月度进度
        </span>
        <span className="text-xs font-bold text-primary">{rate}%</span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden relative">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-700"
          style={{ width: `${Math.max(rate, 3)}%` }}
        />
      </div>
      <p className="text-xs text-center text-muted-foreground mt-0.5">{messages}</p>
    </div>
  )
}

export function MonthPlan() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [goals, setGoals] = useState<MonthlyGoal[]>([])
  const [yearlyGoals, setYearlyGoals] = useState<YearlyGoal[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [linkingYearlyId, setLinkingYearlyId] = useState<string | undefined>(undefined)

  const monthKey = format(currentMonth, 'yyyy-MM')
  const monthGoals = goals.filter(g => g.month === monthKey)

  const loadData = useCallback(async () => {
    const [g, y] = await Promise.all([
      db.monthlyGoals.where('month').equals(monthKey).toArray(),
      db.yearlyGoals.toArray(),  // 取全部年度目标，跨年份关联
    ])
    setGoals(g)
    setYearlyGoals(y)
  }, [monthKey])

  useEffect(() => { loadData() }, [loadData])

  const addGoal = async () => {
    if (!newTitle.trim()) return
    const goal: MonthlyGoal = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      month: monthKey,
      completed: false,
      linkedYearlyGoalId: linkingYearlyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.monthlyGoals.add(goal)
    if (linkingYearlyId) {
      const yearly = await db.yearlyGoals.get(linkingYearlyId)
      if (yearly) {
        await db.yearlyGoals.update(linkingYearlyId, {
          monthlyMilestones: [...yearly.monthlyMilestones, goal.id]
        })
      }
    }
    setNewTitle('')
    setLinkingYearlyId(undefined)
    setShowAdd(false)
    await loadData()
  }

  const toggleGoal = async (id: string) => {
    const goal = monthGoals.find(g => g.id === id)!
    await db.monthlyGoals.update(id, { completed: !goal.completed, updatedAt: new Date().toISOString() })
    await loadData()
    const updated = monthGoals.map(g => g.id === id ? { ...g, completed: !g.completed } : g)
    if (updated.length > 0 && updated.every(g => g.completed)) {
      setShowCelebration(true)
    }
  }

  const deleteGoal = async (id: string) => {
    const goal = monthGoals.find(g => g.id === id)
    if (goal?.linkedYearlyGoalId) {
      const yearly = await db.yearlyGoals.get(goal.linkedYearlyGoalId)
      if (yearly) {
        await db.yearlyGoals.update(goal.linkedYearlyGoalId, {
          monthlyMilestones: yearly.monthlyMilestones.filter(mid => mid !== id)
        })
      }
    }
    await db.monthlyGoals.delete(id)
    await loadData()
  }

  const completeRate = monthGoals.length > 0
    ? Math.round((monthGoals.filter(g => g.completed).length / monthGoals.length) * 100)
    : 0

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>📅</span> {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
        </h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
            <ChevronLeft size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date())}>
            <span className="text-xs font-bold bg-primary/10 px-1.5 py-0.5 rounded-full">今月</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </header>

      <CuteProgress rate={completeRate} emoji="🎯" />

      <div className="flex-1 overflow-y-auto px-3 space-y-2.5">
        {monthGoals.length === 0 && !showAdd && (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <span className="text-6xl mb-4">🌙</span>
            <p className="text-sm font-medium">这个月还是一张白纸</p>
            <p className="text-xs mt-1">写下你想做的事，让每个月都有意义</p>
          </div>
        )}

        {monthGoals.map(goal => {
          const linkedYearly = yearlyGoals.find(y =>
            goal.linkedYearlyGoalId && y.id === goal.linkedYearlyGoalId
          )
          return (
            <div
              key={goal.id}
              className={cn(
                'flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all duration-300',
                'bg-card hover:shadow-md hover:-translate-y-0.5',
                goal.completed
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : 'border-amber-100 hover:border-amber-200'
              )}
            >
              <Checkbox
                checked={goal.completed}
                onCheckedChange={() => toggleGoal(goal.id)}
                className="shrink-0 w-5 h-5 data-[state=checked]:bg-emerald-400 data-[state=checked]:border-emerald-400"
              />
              <div className="flex-1 min-w-0">
                <span className={cn(
                  'text-sm font-medium',
                  goal.completed && 'line-through text-muted-foreground'
                )}>
                  {goal.title}
                </span>
                {linkedYearly && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      🏆 {linkedYearly.title}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => deleteGoal(goal.id)}
                className="shrink-0 p-1.5 rounded-lg opacity-30 hover:opacity-100 hover:bg-red-50 text-muted-foreground hover:text-red-400 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}

        {/* 添加表单 - 始终可展开 */}
        {showAdd && (
          <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 space-y-3 animate-in slide-in-from-top-2">
            <Input
              placeholder="这个月想完成什么？✨"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGoal()}
              autoFocus
              className="border-amber-200 focus:border-amber-400"
            />
            {/* 关联年度目标 - 始终显示 */}
            <div className="flex gap-2 items-center bg-white/50 rounded-xl px-3 py-2">
              <Link2 size={14} className="text-primary shrink-0" />
              {yearlyGoals.filter(y => !y.completed).length > 0 ? (
                <select
                  value={linkingYearlyId || ''}
                  onChange={e => setLinkingYearlyId(e.target.value || undefined)}
                  className="flex-1 bg-transparent text-sm outline-none"
                >
                  <option value="">不关联（独立月度目标）</option>
                  {yearlyGoals.filter(y => !y.completed).map(y => (
                    <option key={y.id} value={y.id}>
                      🔗 {y.title} ({y.startYear}-{y.endYear})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-muted-foreground flex-1">
                  暂无年度目标，去「年规划」创建一个吧 📝
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setLinkingYearlyId(undefined) }}>
                取消
              </Button>
              <Button size="sm" onClick={addGoal} className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 border-0">
                <Sparkles size={14} className="mr-1" /> 添加
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 固定在底部的添加按钮 */}
      {!showAdd && (
        <div className="p-3 border-t border-border/30 bg-card/80 backdrop-blur-sm">
          <Button
            onClick={() => setShowAdd(true)}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-base shadow-lg shadow-amber-200/50 border-0"
          >
            <Plus size={20} className="mr-2" /> 添加月度目标
          </Button>
        </div>
      )}

      <CelebrationOverlay show={showCelebration} level="month" onClose={() => setShowCelebration(false)} />
    </div>
  )
}
