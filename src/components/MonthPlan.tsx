import { useState, useEffect, useCallback } from 'react'
import { format, subMonths, addMonths } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { db } from '@/data/db'
import type { MonthlyGoal, YearlyGoal } from '@/data/types'
import { cn } from '@/lib/utils'

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
      db.yearlyGoals.where('year').equals(currentMonth.getFullYear()).toArray(),
    ])
    setGoals(g)
    setYearlyGoals(y)
  }, [monthKey, currentMonth])

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
    // 如果关联了年度目标，更新年度目标的里程碑
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
    const goal = goals.find(g => g.id === id)!
    await db.monthlyGoals.update(id, { completed: !goal.completed, updatedAt: new Date().toISOString() })
    await loadData()
    // 检查是否全部完成
    const updated = goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g)
    if (updated.filter(g => g.month === monthKey).length > 0 &&
        updated.filter(g => g.month === monthKey).every(g => g.completed)) {
      setShowCelebration(true)
    }
  }

  const deleteGoal = async (id: string) => {
    await db.monthlyGoals.delete(id)
    await loadData()
  }

  const completeRate = monthGoals.length > 0
    ? Math.round((monthGoals.filter(g => g.completed).length / monthGoals.length) * 100)
    : 0

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'yyyy年M月', { locale: zhCN })} · 月计划
        </h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
            <ChevronLeft size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date())}>
            <span className="text-xs font-bold">今</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </header>

      {/* 进度条 */}
      {monthGoals.length > 0 && (
        <div className="px-4 mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>月度进度</span>
            <span>{completeRate}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${completeRate}%` }}
            />
          </div>
        </div>
      )}

      {/* 目标列表 */}
      <div className="flex-1 overflow-y-auto px-3 space-y-2">
        {monthGoals.length === 0 && !showAdd && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <span className="text-4xl mb-2">🎯</span>
            <p className="text-sm">本月还没有计划</p>
            <Button variant="link" size="sm" onClick={() => setShowAdd(true)} className="mt-1">
              设定月度目标
            </Button>
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
                'flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card',
                goal.completed && 'opacity-60'
              )}
            >
              <Checkbox
                checked={goal.completed}
                onCheckedChange={() => toggleGoal(goal.id)}
                className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
              />
              <div className="flex-1 min-w-0">
                <span className={cn('text-sm', goal.completed && 'line-through text-muted-foreground')}>
                  {goal.title}
                </span>
                {linkedYearly && (
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                    <Link2 size={10} />
                    关联：{linkedYearly.title}
                  </div>
                )}
              </div>
              <button
                onClick={() => deleteGoal(goal.id)}
                className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
              >
                删除
              </button>
            </div>
          )
        })}

        {/* 添加表单 */}
        {showAdd && (
          <div className="p-3 rounded-xl border border-dashed border-primary/50 bg-primary/5 space-y-2">
            <Input
              placeholder="月度目标…"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGoal()}
              autoFocus
            />
            {/* 关联年度目标 */}
            {yearlyGoals.length > 0 && (
              <div className="flex gap-2 items-center">
                <Link2 size={14} className="text-muted-foreground shrink-0" />
                <select
                  value={linkingYearlyId || ''}
                  onChange={e => setLinkingYearlyId(e.target.value || undefined)}
                  className="flex-1 rounded-lg border bg-background px-2 py-1 text-sm"
                >
                  <option value="">不关联年度目标</option>
                  {yearlyGoals.map(y => (
                    <option key={y.id} value={y.id}>
                      {y.title} {y.completed ? '✅' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>取消</Button>
              <Button size="sm" onClick={addGoal}>添加</Button>
            </div>
          </div>
        )}

        {!showAdd && (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => setShowAdd(true)}
          >
            <Plus size={14} className="mr-1" />添加月度目标
          </Button>
        )}
      </div>

      <CelebrationOverlay show={showCelebration} level="month" onClose={() => setShowCelebration(false)} />
    </div>
  )
}
