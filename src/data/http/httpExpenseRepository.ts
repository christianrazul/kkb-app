import { setPhpRates } from '@/domain/currency'
import { todayIso } from '@/domain/format'
import type { CurrencyCode, Expense, Group, Member, TimeFormat } from '@/domain/types'
import type { ExpenseRepository, NewExpenseInput, SettlementInput } from '../types'
import { request } from './apiClient'

interface GroupApiResponse {
  id: string
  name: string
  tileColor: string
  timeFormat: TimeFormat
  owner: boolean
  members: Array<{
    userId: string
    displayName: string
    email: string
    avatarUrl?: string
  }>
  formerMembers?: Array<{
    userId: string
    displayName: string
    email: string
    avatarUrl?: string
  }>
  pendingInvites: Array<{
    id: string
    email: string
    inviteUrl: string
    deliveryStatus: 'QUEUED' | 'SENT' | 'FAILED'
  }>
}

interface ExpenseApiResponse {
  id: string
  groupId: string
  description: string
  originalAmount: string
  originalCurrency: CurrencyCode
  phpAmount: string
  paidByUserId: string
  expenseDate: string
  expenseTime?: string
  createdAt: string
  shares: Array<{ userId: string; originalAmount: string; phpAmount: string }>
}

interface SettlementApiResponse {
  id: string
  groupId: string
  fromUserId: string
  toUserId: string
  originalAmount: string
  originalCurrency: CurrencyCode
  phpAmount: string
  settlementDate: string
  createdAt: string
}

interface FxRatesApiResponse {
  rates: Array<{ currency: CurrencyCode; phpPerUnit: string }>
}

const MEMBER_COLORS = ['#c25e3a', '#5b7ec9', '#c98a2e', '#b0568f', '#5a9260']

function memberColor(id: string): string {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return MEMBER_COLORS[hash % MEMBER_COLORS.length]
}

function mapMember(member: GroupApiResponse['members'][number]): Member {
  const firstName = member.displayName.trim().split(/\s+/)[0] || member.displayName
  return {
    id: member.userId,
    name: firstName,
    full: member.displayName,
    email: member.email,
    avatarUrl: member.avatarUrl,
    color: memberColor(member.userId),
  }
}

function mapGroup(group: GroupApiResponse): Group {
  return {
    id: group.id,
    name: group.name,
    tile: group.tileColor,
    timeFormat: group.timeFormat ?? 'TWELVE_HOUR',
    members: group.members.map((member) => member.userId),
    formerMembers: (group.formerMembers ?? []).map((member) => member.userId),
    owner: group.owner,
    pendingInvites: group.pendingInvites,
  }
}

function mapExpense(expense: ExpenseApiResponse): Expense {
  return {
    id: expense.id,
    gid: expense.groupId,
    desc: expense.description,
    amount: Number(expense.originalAmount),
    phpAmount: Number(expense.phpAmount),
    cur: expense.originalCurrency,
    paidBy: expense.paidByUserId,
    parts: expense.shares.map((share) => share.userId),
    shares: expense.shares.map((share) => ({
      userId: share.userId,
      originalAmount: Number(share.originalAmount),
      phpAmount: Number(share.phpAmount),
    })),
    date: expense.expenseDate,
    time: expense.expenseTime?.slice(0, 5),
    createdAt: expense.createdAt,
    settle: false,
  }
}

function mapSettlement(settlement: SettlementApiResponse): Expense {
  return {
    id: settlement.id,
    gid: settlement.groupId,
    desc: 'Settlement',
    amount: Number(settlement.originalAmount),
    phpAmount: Number(settlement.phpAmount),
    cur: settlement.originalCurrency,
    paidBy: settlement.fromUserId,
    parts: [settlement.toUserId],
    shares: [],
    date: settlement.settlementDate,
    createdAt: settlement.createdAt,
    settle: true,
  }
}

export class HttpExpenseRepository implements ExpenseRepository {
  async load(): Promise<{ members: Member[]; groups: Group[]; expenses: Expense[] }> {
    const [groupResponses, fxRates] = await Promise.all([
      request<GroupApiResponse[]>('/api/groups'),
      request<FxRatesApiResponse>('/api/fx/rates'),
    ])
    setPhpRates(Object.fromEntries(fxRates.rates.map((rate) => [rate.currency, Number(rate.phpPerUnit)])))

    const activityByGroup = await Promise.all(groupResponses.map(async (group) => {
      const [expenses, settlements] = await Promise.all([
        request<ExpenseApiResponse[]>(`/api/groups/${group.id}/expenses`),
        request<SettlementApiResponse[]>(`/api/groups/${group.id}/settlements`),
      ])
      return [...expenses.map(mapExpense), ...settlements.map(mapSettlement)]
    }))
    const membersById = new Map<string, Member>()
    groupResponses.flatMap((group) => [...group.members, ...(group.formerMembers ?? [])]).forEach((member) => {
      membersById.set(member.userId, mapMember(member))
    })

    return {
      members: [...membersById.values()],
      groups: groupResponses.map(mapGroup),
      expenses: activityByGroup.flat(),
    }
  }

  async addExpense(input: NewExpenseInput): Promise<Expense> {
    const response = await request<ExpenseApiResponse>(`/api/groups/${input.gid}/expenses`, {
      method: 'POST',
      body: JSON.stringify({
        description: input.desc,
        amount: input.amount,
        currency: input.cur,
        paidByUserId: input.paidBy,
        participantIds: input.parts,
        expenseDate: input.date,
        expenseTime: input.time || null,
      }),
    })
    return mapExpense(response)
  }

  async updateExpense(expenseId: string, input: NewExpenseInput): Promise<Expense> {
    const response = await request<ExpenseApiResponse>(`/api/groups/${input.gid}/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify({
        description: input.desc,
        amount: input.amount,
        currency: input.cur,
        paidByUserId: input.paidBy,
        participantIds: input.parts,
        expenseDate: input.date,
        expenseTime: input.time || null,
      }),
    })
    return mapExpense(response)
  }

  async deleteExpense(groupId: string, expenseId: string): Promise<void> {
    await request(`/api/groups/${groupId}/expenses/${expenseId}`, { method: 'DELETE' })
  }

  async recordSettlement(input: SettlementInput): Promise<Expense> {
    const fractionDigits = input.cur === 'JPY' ? 0 : 2
    const response = await request<SettlementApiResponse>(`/api/groups/${input.gid}/settlements`, {
      method: 'POST',
      body: JSON.stringify({
        fromUserId: input.from,
        toUserId: input.to,
        amount: input.amount.toFixed(fractionDigits),
        currency: input.cur,
        settlementDate: todayIso(),
      }),
    })
    return mapSettlement(response)
  }

  async createGroup(name: string, tileColor: string): Promise<void> {
    await request('/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name, tileColor }),
    })
  }

  async updateGroup(groupId: string, name: string, tileColor: string, timeFormat: TimeFormat): Promise<void> {
    await request(`/api/groups/${groupId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, tileColor, timeFormat }),
    })
  }

  async deleteGroup(groupId: string): Promise<void> {
    await request(`/api/groups/${groupId}`, { method: 'DELETE' })
  }

  async inviteMember(groupId: string, email: string): Promise<void> {
    await request(`/api/groups/${groupId}/invites`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async revokeInvite(groupId: string, inviteId: string): Promise<void> {
    await request(`/api/groups/${groupId}/invites/${inviteId}`, { method: 'DELETE' })
  }

  async removeMember(groupId: string, memberId: string): Promise<void> {
    await request(`/api/groups/${groupId}/members/${memberId}`, { method: 'DELETE' })
  }

  async inviteToKkb(email: string): Promise<{ inviteUrl: string; deliveryStatus: 'QUEUED' | 'SENT' | 'FAILED' }> {
    return request('/api/invitations/kkb', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }
}
