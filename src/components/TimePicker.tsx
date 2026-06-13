import { useState, useRef, useEffect, useCallback } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value?: string
  onChange: (val: string | undefined) => void
  className?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

// 当前时间取整到最近15分钟
function getDefaultStart() {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = now.getMinutes()
  const roundedM = MINUTES[Math.round(m / 15) % 4]
  return { h, m: roundedM === '00' && m > 52 ? '00' : (roundedM === '45' && m < 7 ? '00' : roundedM) }
}

function getDefaultEnd(startH: string, startM: string) {
  const h = (parseInt(startH) + 1) % 24
  return { h: String(h).padStart(2, '0'), m: startM }
}

function Wheel({ items, value, onChange }: {
  items: string[]
  value: string
  onChange: (v: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemH = 40  // 每项高度

  const idx = items.indexOf(value)

  // 打开时滚动到正确位置
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: idx * itemH, behavior: 'instant' as ScrollBehavior })
    }
  }, [idx])

  // 监听滚动确定选中值
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const scrollTop = containerRef.current.scrollTop
    const newIdx = Math.round(scrollTop / itemH)
    if (newIdx >= 0 && newIdx < items.length && items[newIdx] !== value) {
      onChange(items[newIdx])
    }
  }, [items, value, onChange])

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[200px] w-16 overflow-y-auto snap-y snap-mandatory rounded-2xl bg-muted/50 border-2 border-border/50"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      {/* 顶部留白 */}
      <div className="h-[80px]" />
      {items.map(item => {
        const selected = item === value
        return (
          <div
            key={item}
            onClick={() => {
              onChange(item)
              // 点击后滚动到该项
              const targetIdx = items.indexOf(item)
              containerRef.current?.scrollTo({ top: targetIdx * itemH, behavior: 'smooth' as ScrollBehavior })
            }}
            className={cn(
              'h-10 flex items-center justify-center text-base cursor-pointer snap-center transition-all duration-150 select-none',
              selected
                ? 'scale-110 font-bold text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item}
          </div>
        )
      })}
      {/* 底部留白 */}
      <div className="h-[80px]" />
    </div>
  )
}

export function TimePicker({ value, onChange, className }: Props) {
  const defaults = getDefaultStart()
  const endDefaults = getDefaultEnd(defaults.h, defaults.m)

  // 解析外部 value 或使用默认值
  const parseValue = (val?: string) => {
    if (val) {
      const parts = val.split('-')
      if (parts.length === 2) {
        const [sh, sm] = parts[0].split(':')
        const [eh, em] = parts[1].split(':')
        return { sh: sh || defaults.h, sm: sm || defaults.m, eh: eh || endDefaults.h, em: em || endDefaults.m }
      }
    }
    return { sh: defaults.h, sm: defaults.m, eh: endDefaults.h, em: endDefaults.m }
  }

  const parsed = parseValue(value)

  const [open, setOpen] = useState(false)
  const [startH, setStartH] = useState(parsed.sh)
  const [startM, setStartM] = useState(parsed.sm)
  const [endH, setEndH] = useState(parsed.eh)
  const [endM, setEndM] = useState(parsed.em)

  // 每次打开时从外部 value 同步
  useEffect(() => {
    if (open) {
      const p = parseValue(value)
      setStartH(p.sh)
      setStartM(p.sm)
      setEndH(p.eh)
      setEndM(p.em)
    }
  }, [open, value])

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
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-all',
          hasValue
            ? 'border-primary/50 bg-primary/5 text-primary font-medium'
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
            className="w-full max-w-md bg-card rounded-t-3xl p-5 shadow-2xl border border-border"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-center font-semibold text-lg mb-4 flex items-center justify-center gap-2">
              <span className="text-2xl">⏰</span> 选择时间段
            </h3>

            {/* 滚轮区域 */}
            <div className="flex items-start justify-center gap-3 mb-4">
              {/* 开始时间 */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground font-medium">开始</span>
                <div className="flex gap-1">
                  <Wheel items={HOURS} value={startH} onChange={setStartH} />
                  <span className="self-center text-lg font-bold">:</span>
                  <Wheel items={MINUTES} value={startM} onChange={setStartM} />
                </div>
              </div>

              <span className="text-muted-foreground text-sm self-center pt-5 px-1">至</span>

              {/* 结束时间 */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground font-medium">结束</span>
                <div className="flex gap-1">
                  <Wheel items={HOURS} value={endH} onChange={setEndH} />
                  <span className="self-center text-lg font-bold">:</span>
                  <Wheel items={MINUTES} value={endM} onChange={setEndM} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={clear}
                className="flex-1 py-3 rounded-xl border-2 border-border text-sm text-muted-foreground hover:bg-muted transition-colors font-medium"
              >
                清除
              </button>
              <button
                onClick={apply}
                className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-bold transition-colors shadow-lg shadow-amber-200/30"
              >
                确定 {startH}:{startM} - {endH}:{endM}
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
