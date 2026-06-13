import { useState, useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value?: string  // "HH:mm-HH:mm" or undefined
  onChange: (val: string | undefined) => void
  className?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

function Wheel({ items, value, onChange, label }: {
  items: string[]
  value: string
  onChange: (v: string) => void
  label: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const itemH = 36
  const idx = items.indexOf(value)

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = idx * itemH
    }
  }, [idx])

  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-muted-foreground mb-1">{label}</span>
      <div
        ref={ref}
        className="h-[108px] w-14 overflow-y-auto scroll-smooth snap-y snap-mandatory rounded-xl bg-muted/50 border border-border/50"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {items.map(item => (
          <div
            key={item}
            onClick={() => onChange(item)}
            className={cn(
              'h-9 flex items-center justify-center text-sm cursor-pointer snap-center transition-colors',
              item === value
                ? 'bg-primary text-primary-foreground font-bold rounded-lg'
                : 'hover:bg-muted rounded-lg'
            )}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

export function TimePicker({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false)
  const [startH, setStartH] = useState('08')
  const [startM, setStartM] = useState('00')
  const [endH, setEndH] = useState('09')
  const [endM, setEndM] = useState('00')

  // 初始化
  useEffect(() => {
    if (value) {
      const parts = value.split('-')
      if (parts.length === 2) {
        const [sh, sm] = parts[0].split(':')
        const [eh, em] = parts[1].split(':')
        if (sh) setStartH(sh)
        if (sm) setStartM(sm)
        if (eh) setEndH(eh)
        if (em) setEndM(em)
      }
    }
  }, [value])

  const display = value || '选择时间'
  const hasValue = !!value

  const apply = () => {
    onChange(`${startH}:${startM}-${endH}:${endM}`)
    setOpen(false)
  }

  const clear = () => {
    onChange(undefined)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-all',
          hasValue
            ? 'border-primary/50 bg-primary/5 text-primary'
            : 'border-border bg-background text-muted-foreground hover:border-primary/30',
          className
        )}
      >
        <Clock size={14} />
        <span>{display}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-sm"
             onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md bg-card rounded-t-3xl p-5 shadow-2xl border border-border animate-in slide-in-from-bottom"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-center font-semibold mb-4 flex items-center justify-center gap-2">
              <span className="text-xl">⏰</span> 选择时间段
            </h3>

            <div className="flex items-center justify-center gap-4 mb-2">
              <Wheel items={HOURS} value={startH} onChange={setStartH} label="时" />
              <span className="text-lg font-bold pt-4">:</span>
              <Wheel items={MINUTES} value={startM} onChange={setStartM} label="分" />
              <span className="text-muted-foreground text-sm pt-4 px-2">至</span>
              <Wheel items={HOURS} value={endH} onChange={setEndH} label="时" />
              <span className="text-lg font-bold pt-4">:</span>
              <Wheel items={MINUTES} value={endM} onChange={setEndM} label="分" />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={clear}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                清除
              </button>
              <button
                onClick={apply}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// 年份范围选择器
export function YearRangePicker({ startYear, endYear, onChange }: {
  startYear: number
  endYear: number
  onChange: (start: number, end: number) => void
}) {
  const years = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - 5 + i)

  return (
    <div className="flex items-center gap-2">
      <select
        value={startYear}
        onChange={e => onChange(Number(e.target.value), endYear)}
        className="rounded-xl border bg-background px-3 py-2 text-sm appearance-none text-center"
      >
        {years.map(y => (
          <option key={y} value={y}>{y}年</option>
        ))}
      </select>
      <span className="text-muted-foreground text-sm">至</span>
      <select
        value={endYear}
        onChange={e => onChange(startYear, Number(e.target.value))}
        className="rounded-xl border bg-background px-3 py-2 text-sm appearance-none text-center"
      >
        {years.filter(y => y >= startYear).map(y => (
          <option key={y} value={y}>{y}年</option>
        ))}
      </select>
    </div>
  )
}
