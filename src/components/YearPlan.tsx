import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, ChevronDown, ChevronUp, Milestone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { db } from '@/data/db'
import type { YearlyGoal, MonthlyGoal } from '@/data/types'
import { cn } from '@/lib/utils'

export function YearPlan() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [goals, setGoals] = useState<YearlyGoal[]>([])
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  const yearGoals = goals.filter(g => g.year === currentYear)

  const loadData = useCallback(async () => {
    const [y, m] = await Promise.all([
      db.yearlyGoals.where('year').equals(currentYear).toArray(),
      db.monthlyGoals.toArray(),
    ])
    setGoals(y)
    setMonthlyGoals(m)
  }, [currentYear])

  useEffect(() => { loadData() }, [loadData])

  const addGoal = async () => {
    if (!newTitle.trim()) return
    const goal: YearlyGoal = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      year: currentYear,
      completed: false,
      monthlyMilestones: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.yearlyGoals.add(goal)
    setNewTitle('')
    setShowAdd(false)
    await loadData()
  }

  const toggleGoal = async (id: string) => {
    const goal = goals.find(g => g.id === id)!
    await db.yearlyGoals.update(id, { completed: !goal.completed, updatedAt: new Date().toISOString() })
    await loadData()
    const updated = goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g)
    if (updated.filter(g => g.year === currentYear).length > 0 &&
        updated.filter(g => g.year === currentYear).every(g => g.completed)) {
      setShowCelebration(true)
    }
  }

  const deleteGoal = async (id: string) => {
    await db.yearlyGoals.delete(id)
    await loadData()
  }

  const getMilestones = (goal: YearlyGoal) => {
    return monthlyGoals.filter(m => goal.monthlyMilestones.includes(m.id))
  }

  const completeRate = yearGoals.length > 0
    ? Math.round((yearGoals.filter(g => g.completed).length / yearGoals.length) * 100)
    : 0

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {currentYear}年 · 年度规划
        </h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setCurrentYear(y => y - 1)}>
            <ChevronLeft size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCurrentYear(new Date().getFullYear())}>
            <span className="text-xs font-bold">今</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCurrentYear(y => y + 1)}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </header>

      {/* 进度条 */}
      {yearGoals.length > 0 && (
        <div className="px-4 mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>年度进度</span>
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

      <div className="flex-1 overflow-y-auto px-3 space-y-2">
        {yearGoals.length === 0 && !showAdd && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <span className="text-4xl mb-2">🏆</span>
            <p className="text-sm">还没有年度目标</p>
            <Button variant="link" size="sm" onClick={() => setShowAdd(true)} className="mt-1">
              设定今年的大目标
            </Button>
          </div>
        )}

        {yearGoals.map(goal => {
          const milestones = getMilestones(goal)
          const isExpanded = expandedId === goal.id

          return (
            <div
              key={goal.id}
              className={cn(
                'rounded-xl border bg-card overflow-hidden transition-all',
                goal.completed && 'opacity-60',
                isExpanded && 'border-primary/30 shadow-sm'
              )}
            >
              {/* 主行 */}
              <div className="flex items-center gap-3 p-3">
                <Checkbox
                  checked={goal.completed}
                  onCheckedChange={() => toggleGoal(goal.id)}
                  className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    'text-sm font-medium',
                    goal.completed && 'line-through text-muted-foreground'
                  )}>
                    {goal.title}
                  </span>
                  {milestones.length > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {milestones.filter(m => m.completed).length}/{milestones.length} 月目标
                      </Badge>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : goal.id)}
                  className="p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
                >
                  删除
                </button>
              </div>

              {/* 展开的月度里程碑 */}
              {isExpanded && (
                <div className="border-t border-border/50 bg-muted/20 px-4 py-2 space-y-1.5">
                  {milestones.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2">
                      <Milestone size={12} className="inline mr-1" />
                      暂无关联月度目标。在「月计划」中添加目标时可关联此年度目标
                    </p>
                  )}
                  {milestones.map(m => (
                    <div key={m.id} className="flex items-center gap-2 text-sm">
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        m.completed ? 'bg-emerald-400' : 'bg-muted-foreground/30'
                      )} />
                      <span className={cn(
                        'flex-1',
                        m.completed && 'line-through text-muted-foreground'
                      )}>
                        {m.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(m.month + '-01'), 'M月', { locale: zhCN })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* 添加表单 */}
        {showAdd && (
          <div className="p-3 rounded-xl border border-dashed border-primary/50 bg-primary/5 flex gap-2">
            <Input
              placeholder="年度目标…"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGoal()}
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>取消</Button>
            <Button size="sm" onClick={addGoal}>添加</Button>
          </div>
        )}

        {!showAdd && (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => setShowAdd(true)}
          >
            <Plus size={14} className="mr-1" />添加年度目标
          </Button>
        )}
      </div>

      <CelebrationOverlay show={showCelebration} level="year" onClose={() => setShowCelebration(false)} />
    </div>
  )
}
