import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { randomEncouragement } from '@/data/constants'
import type { CelebrationLevel } from '@/data/types'

interface Props {
  show: boolean
  level: CelebrationLevel
  onClose: () => void
}

function Confetti({ count = 40 }: { count?: number }) {
  const colors = ['#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#3b82f6', '#f43f5e', '#06b6d4']

  return (
    <div className="particle-canvas">
      {Array.from({ length: count }).map((_, i) => {
        const color = colors[i % colors.length]
        const left = Math.random() * 100
        const delay = Math.random() * 2
        const duration = 2 + Math.random() * 3
        const size = 6 + Math.random() * 10
        const rotate = Math.random() * 720 - 360

        return (
          <motion.div
            key={i}
            initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
            animate={{
              y: window.innerHeight + 50,
              x: (Math.random() - 0.5) * 150,
              opacity: [1, 1, 0],
              rotate,
            }}
            transition={{ duration, delay, ease: 'easeIn' }}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: -20,
              width: size,
              height: size * 0.6,
              background: color,
              borderRadius: 3,
            }}
          />
        )
      })}
    </div>
  )
}

export function CelebrationOverlay({ show, level, onClose }: Props) {
  const [text] = useState(() => randomEncouragement(level))
  const particleCount = level === 'day' ? 40 : level === 'month' ? 80 : 120
  const onCloseRef = useRef(onClose)

  // 保持 onClose 引用最新，但不触发 effect 重新执行
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!show) return
    const timer = setTimeout(() => {
      onCloseRef.current()
    }, level === 'day' ? 4000 : level === 'month' ? 6000 : 8000)
    return () => clearTimeout(timer)
  }, [show, level]) // 不再依赖 onClose，避免重复触发

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] bg-background/60 backdrop-blur-sm flex items-center justify-center"
          onClick={() => onCloseRef.current()}
        >
          <Confetti count={particleCount} />
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="bg-card rounded-2xl shadow-2xl p-8 mx-6 max-w-sm text-center border border-border z-[10000]"
          >
            {level === 'day' && <span className="text-5xl mb-4 block">🌟</span>}
            {level === 'month' && <span className="text-5xl mb-4 block">🎯</span>}
            {level === 'year' && <span className="text-5xl mb-4 block">🏆</span>}

            <p className="text-lg font-medium text-foreground leading-relaxed font-[family-name:var(--font-heading)]">
              {text}
            </p>

            {level === 'month' && (
              <p className="text-xs text-muted-foreground mt-3">
                一个月的坚持，值得被记住 ✨
              </p>
            )}
            {level === 'year' && (
              <p className="text-xs text-muted-foreground mt-3">
                这一年的故事，都是你一笔一笔写下来的
              </p>
            )}

            <button
              onClick={() => onCloseRef.current()}
              className="mt-6 text-sm text-primary font-medium hover:underline"
            >
              {level === 'day' ? '继续加油 →' : '太好了！'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
