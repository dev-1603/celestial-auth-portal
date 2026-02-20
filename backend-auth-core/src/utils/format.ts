import { inspect } from 'util'

export const safeStringify = (v: unknown) => {
  try {
    return JSON.stringify(v)
  } catch {
    return inspect(v, { depth: 5 })
  }
}

