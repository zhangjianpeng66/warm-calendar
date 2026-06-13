import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Trash2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task } from '@/data/types'

const categoryColors: Record<string, string> = {
  '工作': 'bg-blue-100 text-blue-700 border-blue-200',
  '学习': 'bg-purple-100 text-purple-700 border-purple-200',
  '生活': 'bg-amber-100 text-amber-700 border-amber-200',
  '健康': 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const priorityDots: Record<string, string> = {
  '高': 'bg-red-400',
  '中': 'bg-amber-400',
  '低': 'bg-slate-300',
}

interface Props {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TaskItem({ task, onToggle, onDelete }: Props) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group',
        'bg-card hover:shadow-sm border border-border/50',
        task.completed && 'opacity-60'
      )}
    >
      {/* 拖拽手柄 */}
      <GripVertical size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />

      {/* 勾选框 */}
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        className="shrink-0 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
      />

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {task.timeSlot && (
            <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {task.timeSlot}
            </span>
          )}
          <span className={cn(
            'text-sm font-medium truncate',
            task.completed && 'line-through text-muted-foreground'
          )}>
            {task.title}
          </span>
          {/* 优先级 */}
          <span className={cn('w-2 h-2 rounded-full shrink-0', priorityDots[task.priority])} />
        </div>
        <div className="flex gap-1.5 mt-1">
          <Badge variant="outline" className={cn('text-xs px-1.5 py-0', categoryColors[task.category])}>
            {task.category}
          </Badge>
        </div>
      </div>

      {/* 删除按钮 */}
      <button
        onClick={() => onDelete(task.id)}
        className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
