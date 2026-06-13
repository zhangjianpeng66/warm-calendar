import { useState, useEffect, useCallback } from 'react'
import { addDays, startOfWeek, format, isToday, isSameDay, subWeeks, addWeeks } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TaskItem } from '@/components/TaskItem'
import { TimePicker } from '@/components/TimePicker'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { db } from '@/data/db'
import type { Task, Category, Priority, DayStats } from '@/data/types'
import { cn } from '@/lib/utils'

export function WeekView() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [dayStats, setDayStats] = useState<Record<string, DayStats>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<Category>('生活')
  const [newPriority, setNewPriority] = useState<Priority>('中')
  const [newTimeSlot, setNewTimeSlot] = useState<string | undefined>(undefined)
  const [showCelebration, setShowCelebration] = useState(false)

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // 加载本周所有任务
  const loadTasks = useCallback(async () => {
    const weekEnd = addDays(weekStart, 6)
    const all = await db.tasks
      .where('date')
      .between(format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd'))
      .toArray()
    setTasks(all)

    // 计算每日统计
    const stats: Record<string, DayStats> = {}
    for (const day of days) {
      const key = format(day, 'yyyy-MM-dd')
      const dayTasks = all.filter(t => t.date === key)
      const completed = dayTasks.filter(t => t.completed).length
      stats[key] = {
        total: dayTasks.length,
        completed,
        rate: dayTasks.length > 0 ? completed / dayTasks.length : 0
      }
    }
    setDayStats(stats)
  }, [weekStart])

  useEffect(() => { loadTasks() }, [loadTasks])

  // 今日任务
  const todayKey = format(selectedDate, 'yyyy-MM-dd')
  const todayTasks = tasks.filter(t => t.date === todayKey)

  // 切换完成状态（只有用户主动打勾时才检测庆祝）
  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)!
    const newCompleted = !task.completed
    await db.tasks.update(id, { completed: newCompleted, updatedAt: new Date().toISOString() })
    // 先从本地状态计算（不等 loadTasks 返回）
    const updated = tasks.map(t => t.id === id ? { ...t, completed: newCompleted } : t)
    const dayTasks = updated.filter(t => t.date === todayKey)
    if (newCompleted && dayTasks.length > 0 && dayTasks.every(t => t.completed)) {
      setShowCelebration(true)
    }
    await loadTasks()
  }

  // 删除任务
  const deleteTask = async (id: string) => {
    await db.tasks.delete(id)
    await loadTasks()
  }

  // 添加任务
  const addTask = async () => {
    if (!newTitle.trim()) return
    const task: Task = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      timeSlot: newTimeSlot || undefined,
      category: newCategory,
      priority: newPriority,
      completed: false,
      date: todayKey,
      isRecurring: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.tasks.add(task)
    setNewTitle('')
    setNewTimeSlot(undefined)
    setShowAdd(false)
    await loadTasks()
  }

  // 日期颜色
  const dayColorClass = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd')
    const stats = dayStats[key]
    if (!stats || stats.total === 0) return 'bg-rose-100 text-rose-600'
    if (stats.rate >= 1) return 'bg-emerald-100 text-emerald-700 font-bold'
    if (stats.rate >= 0.7) return 'bg-amber-100 text-amber-700'
    return 'bg-rose-100 text-rose-600'
  }

  const completionRate = todayTasks.length > 0
    ? Math.round((todayTasks.filter(t => t.completed).length / todayTasks.length) * 100)
    : 0

  return (
    <div className="flex flex-col h-full">
      {/* 顶部导航 */}
      <header className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {format(weekStart, 'yyyy年M月', { locale: zhCN })}
        </h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setWeekStart(w => subWeeks(w, 1))}>
            <ChevronLeft size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setWeekStart(new Date())}>
            <span className="text-xs font-bold">今</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setWeekStart(w => addWeeks(w, 1))}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </header>

      {/* 周历网格 */}
      <div className="grid grid-cols-7 gap-1 px-2 mb-2">
        {days.map((day, i) => {
          const key = format(day, 'yyyy-MM-dd')
          const selected = isSameDay(day, selectedDate)
          const today = isToday(day)
          const stats = dayStats[key]
          const completeCount = stats?.completed ?? 0
          const totalCount = stats?.total ?? 0

          return (
            <button
              key={key}
              onClick={() => setSelectedDate(day)}
              className={cn(
                'flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-150',
                selected && 'bg-primary/10 ring-1 ring-primary/30 scale-105',
                today && !selected && 'ring-1 ring-primary/40'
              )}
            >
              <span className="text-xs text-muted-foreground">
                {['一','二','三','四','五','六','日'][i]}
              </span>
              <span className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors',
                dayColorClass(day),
                today && 'ring-2 ring-primary/50 ring-offset-1'
              )}>
                {format(day, 'd')}
              </span>
              {/* 任务统计小点 */}
              {totalCount > 0 && (
                <span className="text-xs text-muted-foreground font-mono">
                  {completeCount}/{totalCount}
                </span>
              )}
              {totalCount === 0 && (
                <span className="text-xs text-muted-foreground/40">--</span>
              )}
            </button>
          )
        })}
      </div>

      {/* 今日任务抽屉区域 */}
      <div className="flex-1 bg-card/50 rounded-t-2xl border-t border-border overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-border/50">
          <div>
            <h3 className="font-semibold text-foreground">
              {isToday(selectedDate) ? '今日任务' : format(selectedDate, 'M月d日 EEEE', { locale: zhCN })}
            </h3>
            {todayTasks.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                完成 {todayTasks.filter(t => t.completed).length}/{todayTasks.length} · {completionRate}%
              </p>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => setShowAdd(!showAdd)}
            className="rounded-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-bold border-0 shadow-md shadow-amber-200/50 px-4"
          >
            <Plus size={14} className="mr-1" />添加
          </Button>
        </div>

        {/* 添加任务表单 */}
        {showAdd && (
          <div className="px-4 py-3 border-b border-border/50 bg-muted/30 flex flex-col gap-2">
            <Input
              placeholder="任务标题…"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <TimePicker value={newTimeSlot} onChange={setNewTimeSlot} />
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as Category)}
                className="flex-1 rounded-lg border bg-background px-2 text-sm"
              >
                <option value="工作">💼 工作</option>
                <option value="学习">📚 学习</option>
                <option value="生活">🏠 生活</option>
                <option value="健康">💪 健康</option>
              </select>
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value as Priority)}
                className="w-20 rounded-lg border bg-background px-2 text-sm"
              >
                <option value="高">🔴 高</option>
                <option value="中">🟡 中</option>
                <option value="低">⚪ 低</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>取消</Button>
              <Button size="sm" onClick={addTask}>添加任务</Button>
            </div>
          </div>
        )}

        {/* 任务列表 */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {todayTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <span className="text-4xl mb-2">📝</span>
              <p className="text-sm">今天还没有任务</p>
              <p className="text-xs mt-1">点击"添加"开始规划吧</p>
            </div>
          )}
          {todayTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
          ))}
        </div>
      </div>

      {/* 庆祝特效 */}
      <CelebrationOverlay
        show={showCelebration}
        level="day"
        onClose={() => setShowCelebration(false)}
      />
    </div>
  )
}
