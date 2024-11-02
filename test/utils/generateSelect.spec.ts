import { expect, it } from 'vitest'
import { generateSelect } from '../../src/plugin/utils/generateSelect'
import { ViewColumn } from '../../src/plugin/types'

it("generateSelect", () => {

  const columns: ViewColumn[] = [
    { name: "A", systemColumn: "name" },
    { name: "A", systemColumn: "surname" },
  ]

  expect(generateSelect(columns, [])).toEqual({ name: true, surname: true })
})

it("generateSelect with nested columns", () => {

  const columns: ViewColumn[] = [
    { name: "A", systemColumn: "name" },
    { name: "A", systemColumn: "surname" },
    { name: "B", systemColumn: "user.login" },
    { name: "B", systemColumn: "user.ip" }
  ]

  expect(generateSelect(columns, [])).toEqual({ 
    name: true, 
    surname: true, 
    user: { select: { login: true, ip: true } }
  })
})


it("generateSelect with count format", () => {

  const columns: ViewColumn[] = [
    { name: "A", systemColumn: "name" },
    { name: "A", systemColumn: "surname" },
    { name: "B", systemColumn: "user.login" },
    { name: "B", systemColumn: "sessions", format: "count" }
  ]

  expect(generateSelect(columns, [])).toEqual({ 
    name: true, 
    surname: true, 
    user: { select: { login: true } },
    _count: { select: { sessions: true } }
  })
})
