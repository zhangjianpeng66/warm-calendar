// ========== 数据类型定义 ==========

export type Category = '工作' | '学习' | '生活' | '健康'
export type Priority = '高' | '中' | '低'
export type RecurringType = '每天' | '每周' | '每月' | '自定义'

export interface Task {
  id: string
  title: string
  timeSlot?: string
  category: Category
  priority: Priority
  completed: boolean
  date: string // YYYY-MM-DD
  isRecurring: boolean
  recurringRuleId?: string
  createdAt: string
  updatedAt: string
}

export interface RecurringRule {
  id: string
  taskTemplateId: string
  type: RecurringType
  interval: number // 自定义间隔天数
  startDate: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

export interface MonthlyGoal {
  id: string
  title: string
  month: string // YYYY-MM
  completed: boolean
  linkedYearlyGoalId?: string
  createdAt: string
  updatedAt: string
}

export interface YearlyGoal {
  id: string
  title: string
  startYear: number
  endYear: number
  completed: boolean
  monthlyMilestones: string[] // MonthlyGoal id[]
  createdAt: string
  updatedAt: string
}

export type ThemeId = 'sunflower' | 'sakura' | 'fresh' | 'sunset' | 'matcha' | 'starry'

export interface ThemeConfig {
  id: ThemeId
  name: string
  emoji: string
  description: string
}

export interface AppSettings {
  activeTheme: ThemeId
}

// 完成任务统计
export interface DayStats {
  total: number
  completed: number
  rate: number // 0-1
}

// 庆祝层级
export type CelebrationLevel = 'day' | 'month' | 'year'
