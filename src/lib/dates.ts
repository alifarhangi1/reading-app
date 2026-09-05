/** Local-calendar ISO dates (YYYY-MM-DD) — shared by the shell, shelf, and log. */

export function todayIso(): string {
  return toIso(new Date())
}

export function yesterdayIso(): string {
  return shiftIso(todayIso(), -1)
}

export function shiftIso(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toIso(d)
}

function toIso(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
