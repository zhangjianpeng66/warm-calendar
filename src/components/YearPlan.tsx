import { useState, useEffect, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, ChevronDown, ChevronUp, Trash2, Sparkles, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { YearRangePicker } from '@/components/TimePicker'
import { db } from '@/data/db'
import type { YearlyGoal, MonthlyGoal } from '@/data/types'
import { cn } from '@/lib/utils'

// 可爱进度条
function CuteYearProgress({ rate }: { rate: number }) {
  if (rate === 0) return null
  const messages = rate >= 100 ? '全部完成！🏆' : rate >= 50 ? '过半了！🔥' : rate >= 25 ? '稳步推进 🌱' : '刚刚开始 💫'
  return (
    <div className="px-4 mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Star size={12} className="text-amber-400" /> 年度总览
        </span>
        <span className="text-xs font-bold text-primary">{rate}%</span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full progress-themed transition-all duration-700"
          style={{ width: `${Math.max(rate, 3)}%` }}
        />
      </div>
      <p className="text-xs text-center text-muted-foreground mt-0.5">{messages}</p>
    </div>
  )
}

export function YearPlan() {
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [goals, setGoals] = useState<YearlyGoal[]>([])
  const [allMonthlyGoals, setAllMonthlyGoals] = useState<MonthlyGoal[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newStartYear, setNewStartYear] = useState(viewYear)
  const [newEndYear, setNewEndYear] = useState(viewYear)
  const [showAdd, setShowAdd] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  // 筛选当年相关的年度目标（startYear <= viewYear <= endYear）
  const yearGoals = goals.filter(g => g.startYear <= viewYear && g.endYear >= viewYear)

  const loadData = useCallback(async () => {
    const [y, m] = await Promise.all([
      db.yearlyGoals.toArray(),
      db.monthlyGoals.toArray(),
    ])
    setGoals(y)
    setAllMonthlyGoals(m)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // 计算每个年度目标的进度（基于关联月度目标的完成率）
  const goalProgress = useMemo(() => {
    const map: Record<string, number> = {}
    for (const g of goals) {
      const milestones = allMonthlyGoals.filter(m => g.monthlyMilestones.includes(m.id))
      if (milestones.length === 0) {
        map[g.id] = 0
      } else {
        const completed = milestones.filter(m => m.completed).length
        map[g.id] = Math.round((completed / milestones.length) * 100)
      }
    }
    return map
  }, [goals, allMonthlyGoals])

  // 年度总览进度
  const overallRate = yearGoals.length > 0
    ? Math.round(Object.values(goalProgress).reduce((a, b) => a + b, 0) / yearGoals.length)
    : 0

  const addGoal = async () => {
    if (!newTitle.trim()) return
    const goal: YearlyGoal = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      startYear: newStartYear,
      endYear: newEndYear,
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
    const newCompleted = !goal.completed
    await db.yearlyGoals.update(id, { completed: newCompleted, updatedAt: new Date().toISOString() })
    await loadData()
    if (newCompleted) {
      const updated = goals.map(g => g.id === id ? { ...g, completed: true } : g)
      if (updated.filter(g => g.startYear <= viewYear && g.endYear >= viewYear).every(g => g.completed)) {
        setShowCelebration(true)
      }
    }
  }

  const deleteGoal = async (id: string) => {
    await db.yearlyGoals.delete(id)
    await loadData()
  }

  const getGoalMilestones = (goal: YearlyGoal) => {
    return allMonthlyGoals.filter(m => goal.monthlyMilestones.includes(m.id))
  }

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>🏆</span> {viewYear}年
        </h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setViewYear(y => y - 1)}>
            <ChevronLeft size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setViewYear(new Date().getFullYear())}>
            <span className="text-xs font-bold bg-primary/10 px-1.5 py-0.5 rounded-full">今年</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setViewYear(y => y + 1)}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </header>

      <CuteYearProgress rate={overallRate} />

      <div className="flex-1 overflow-y-auto px-3 space-y-2.5">
        {yearGoals.length === 0 && !showAdd && (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <span className="text-6xl mb-4">🌟</span>
            <p className="text-sm font-medium">还没有年度目标</p>
            <p className="text-xs mt-1">设定大目标，一步步去实现</p>
          </div>
        )}

        {yearGoals.map(goal => {
          const milestones = getGoalMilestones(goal)
          const progress = goalProgress[goal.id] || 0
          const isExpanded = expandedId === goal.id
          const isMultiYear = goal.startYear !== goal.endYear

          return (
            <div
              key={goal.id}
              className={cn(
                'rounded-2xl border-2 overflow-hidden transition-all duration-300',
                goal.completed
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : 'border-purple-100 bg-card hover:shadow-md',
                isExpanded && 'shadow-md border-purple-200'
              )}
            >
              {/* 主行 */}
              <div className="flex items-center gap-3 p-3.5">
                <Checkbox
                  checked={goal.completed}
                  onCheckedChange={() => toggleGoal(goal.id)}
                  className="shrink-0 w-5 h-5 data-[state=checked]:bg-emerald-400 data-[state=checked]:border-emerald-400"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      'text-sm font-semibold',
                      goal.completed && 'line-through text-muted-foreground'
                    )}>
                      {goal.title}
                    </span>
                    {isMultiYear && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 font-medium">
                        {goal.startYear}-{goal.endYear}
                      </span>
                    )}
                  </div>
                  {/* 进度条 */}
                  {milestones.length > 0 && (
                    <div className="mt-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                        <span>{milestones.filter(m => m.completed).length}/{milestones.length} 月目标完成</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            progress >= 100 ? 'bg-emerald-400' : progress >= 50 ? 'bg-amber-400' : 'bg-purple-300'
                          )}
                          style={{ width: `${Math.max(progress, 2)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {milestones.length === 0 && !goal.completed && (
                    <p className="text-xs text-muted-foreground mt-1">
                      去「月计划」里关联月度目标吧 💡
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : goal.id)}
                  className="shrink-0 p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="shrink-0 p-1 rounded-lg opacity-30 hover:opacity-100 hover:bg-red-50 text-muted-foreground hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* 展开的里程碑 */}
              {isExpanded && (
                <div className="border-t border-border/30 bg-gradient-to-b from-purple-50/50 to-transparent px-4 py-3 space-y-2">
                  {milestones.length === 0 && (
                    <div className="text-center py-3">
                      <span className="text-2xl block mb-1">🔗</span>
                      <p className="text-xs text-muted-foreground">
                        在「月计划」中添加目标时，选择关联此年度目标即可自动建立连接
                      </p>
                    </div>
                  )}
                  {milestones.sort((a, b) => a.startMonth.localeCompare(b.startMonth)).map(m => (
                    <div key={m.id} className="flex items-center gap-2 text-sm py-1">
                      <span className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        m.completed ? 'bg-emerald-400' : 'bg-muted-foreground/25'
                      )} />
                      <span className={cn(
                        'flex-1 text-sm',
                        m.completed && 'line-through text-muted-foreground'
                      )}>
                        {m.title}
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                        {format(new Date(m.startMonth + '-01'), 'M月', { locale: zhCN })}
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
          <div className="rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/50 p-4 space-y-3 animate-in slide-in-from-top-2">
            <Input
              placeholder="今年的年度目标是什么？✨"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGoal()}
              autoFocus
              className="border-purple-200 focus:border-purple-400"
            />
            <div className="bg-white/60 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-2">计划周期</p>
              <YearRangePicker
                startYear={newStartYear}
                endYear={newEndYear}
                onChange={(s, e) => { setNewStartYear(s); setNewEndYear(e) }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>取消</Button>
              <Button size="sm" onClick={addGoal} className="bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 border-0">
                <Sparkles size={14} className="mr-1" /> 设定目标
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 底部固定添加按钮 */}
      {!showAdd && (
        <div className="p-3 border-t border-border/30 bg-card/80 backdrop-blur-sm">
          <Button
            onClick={() => { setShowAdd(true); setNewStartYear(viewYear); setNewEndYear(viewYear) }}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-base shadow-lg shadow-purple-200/50 border-0"
          >
            <Plus size={20} className="mr-2" /> 添加年度目标
          </Button>
        </div>
      )}

      <CelebrationOverlay show={showCelebration} level="year" onClose={() => setShowCelebration(false)} />
    </div>
  )
}
