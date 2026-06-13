// ========== Dexie.js 数据库 ==========
import Dexie, { type EntityTable } from 'dexie'
import type { Task, RecurringRule, MonthlyGoal, YearlyGoal, AppSettings } from './types'

export class WarmCalendarDB extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  recurringRules!: EntityTable<RecurringRule, 'id'>
  monthlyGoals!: EntityTable<MonthlyGoal, 'id'>
  yearlyGoals!: EntityTable<YearlyGoal, 'id'>
  settings!: EntityTable<AppSettings & { id: string }, 'id'>

  constructor() {
    super('WarmCalendarDB')
    this.version(1).stores({
      tasks: 'id, date, category, completed',
      recurringRules: 'id, taskTemplateId',
      monthlyGoals: 'id, month',
      yearlyGoals: 'id, year',
      settings: 'id'
    })
  }
}

export const db = new WarmCalendarDB()

// 初始化默认设置
export async function initSettings(): Promise<AppSettings> {
  const existing = await db.settings.get('main')
  if (existing) return existing
  const defaults: AppSettings & { id: string } = {
    id: 'main',
    activeTheme: 'sunflower'
  }
  await db.settings.put(defaults)
  return defaults
}
