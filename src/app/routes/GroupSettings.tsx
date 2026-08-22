import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { copyText } from '../copyText'
import { useAuth } from '../providers/AuthProvider'
import { useData } from '../providers/DataProvider'
import type { Group } from '@/domain/types'

const COLORS = ['#5b7ec9', '#c98a2e', '#5a9260', '#b0568f', '#c25e3a']

export function GroupSettings() {
  const { groupId } = useParams()
  const { loaded, groupById } = useData()
  const group = groupId ? groupById(groupId) : undefined

  if (loaded && (!group || !group.owner)) {
    return <Navigate to={group ? `/groups/${group.id}` : '/dashboard'} replace />
  }
  if (!group) return null

  return <GroupSettingsContent key={group.id} group={group} />
}

function GroupSettingsContent({ group }: { group: Group }) {
  const navigate = useNavigate()
  const { meId } = useAuth()
  const {
    memberById,
    updateGroup,
    deleteGroup,
    inviteMember,
    revokeInvite,
    removeMember,
  } = useData()
  const [name, setName] = useState(group.name)
  const [tileColor, setTileColor] = useState(group.tile)
  const [email, setEmail] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const run = async (key: string, action: () => Promise<void>, success?: string) => {
    if (busy) return
    setBusy(key)
    setError(null)
    setNotice(null)
    try {
      await action()
      if (success) setNotice(success)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update the group')
    } finally {
      setBusy(null)
    }
  }

  const saveGeneral = () => run(
    'general',
    () => updateGroup(group.id, name.trim(), tileColor),
    'Group details saved.',
  )

  const sendInvite = () => run('invite', async () => {
    await inviteMember(group.id, email.trim())
    setEmail('')
  }, 'Group invitation queued. They must accept it before joining.')

  const remove = (memberId: string, memberName: string) => {
    if (!window.confirm(`Remove ${memberName} from ${group.name}? They can be invited again later.`)) return
    void run(`member-${memberId}`, () => removeMember(group.id, memberId), `${memberName} was removed.`)
  }

  const revoke = (inviteId: string, inviteEmail: string) => {
    if (!window.confirm(`Revoke the pending invitation for ${inviteEmail}?`)) return
    void run(`invite-${inviteId}`, () => revokeInvite(group.id, inviteId), 'Invitation revoked.')
  }

  const copyInvite = async (inviteUrl: string) => {
    setError(null)
    try {
      await copyText(inviteUrl)
      setNotice('Group invitation link copied.')
    } catch {
      setError('Could not copy the invitation link.')
    }
  }

  const destroyGroup = async () => {
    if (deleteConfirmation !== group.name || busy) return
    setBusy('delete')
    setError(null)
    try {
      await deleteGroup(group.id)
      navigate('/dashboard', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete the group')
      setBusy(null)
    }
  }

  const deliveryLabel = {
    QUEUED: 'Email queued',
    SENT: 'Email sent',
    FAILED: 'Email delivery failed',
  } as const

  return (
    <div className="rise mx-auto max-w-[760px]">
      <button
        type="button"
        onClick={() => navigate(`/groups/${group.id}`)}
        className="mb-4 min-h-10 cursor-pointer rounded-xl px-2 text-[12.5px] font-bold text-mute-2 transition-colors hover:bg-sand-2 hover:text-ink"
      >
        ← Back to {group.name}
      </button>

      <div className="mb-5 flex items-center gap-3">
        <Avatar label={group.name[0]} color={group.tile} size={48} radius={14} fontSize={19} display />
        <div>
          <h1 className="font-display text-[24px] font-bold">Group settings</h1>
          <p className="mt-0.5 text-[12.5px] text-mute">Manage {group.name}</p>
        </div>
      </div>

      {(error || notice) && (
        <div className={`mb-4 rounded-xl border px-3.5 py-2.5 text-[12.5px] font-semibold ${error ? 'border-neg/20 bg-neg/5 text-neg' : 'border-pos/20 bg-pos/5 text-pos'}`}>
          {error ?? notice}
        </div>
      )}

      <section className="rounded-[18px] border border-ink/[.08] bg-cream p-5 sm:p-6">
        <h2 className="font-display text-[17px] font-bold">General</h2>
        <div className="mt-4 flex flex-col gap-4">
          <Field label="GROUP NAME" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} />
          <div>
            <div className="mb-2 text-[11.5px] font-bold tracking-[.5px] text-mute-2">COLOR</div>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Use ${color}`}
                  onClick={() => setTileColor(color)}
                  className={`size-10 cursor-pointer rounded-xl border-2 transition-transform ${tileColor === color ? 'scale-110 border-ink' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <Button onClick={() => void saveGeneral()} disabled={!name.trim() || busy !== null} className="min-h-11 self-start px-5">
            {busy === 'general' ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </section>

      <section className="mt-4 rounded-[18px] border border-ink/[.08] bg-cream p-5 sm:p-6">
        <h2 className="font-display text-[17px] font-bold">Members</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-mute">
          A member must be fully settled before they can be removed. Removed members remain visible in historical expenses.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {group.members.map((memberId) => {
            const member = memberById(memberId)
            const isOwner = memberId === meId
            return (
              <div key={memberId} className="flex items-center gap-3 rounded-xl bg-sand px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold">{member?.full}</div>
                  <div className="truncate text-[11.5px] text-mute">{member?.email}{isOwner ? ' · Owner' : ''}</div>
                </div>
                {!isOwner && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => remove(memberId, member?.full ?? 'this member')}
                    className="min-h-10 cursor-pointer rounded-lg px-2 text-[11.5px] font-bold text-neg transition-colors hover:bg-neg/5 disabled:cursor-default disabled:opacity-50"
                  >
                    {busy === `member-${memberId}` ? 'Removing…' : 'Remove'}
                  </button>
                )}
              </div>
            )
          })}
          {group.pendingInvites.map((invite) => (
            <div key={invite.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-ink/15 px-3.5 py-2.5 sm:flex-nowrap sm:gap-3">
              <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                <div className="truncate text-[13px] font-bold">{invite.email}</div>
                <div className={`text-[11.5px] ${invite.deliveryStatus === 'FAILED' ? 'text-neg' : 'text-mute'}`}>
                  Pending acceptance · {deliveryLabel[invite.deliveryStatus]}
                </div>
              </div>
              <button type="button" onClick={() => void copyInvite(invite.inviteUrl)} className="min-h-10 cursor-pointer rounded-lg px-2 text-[11.5px] font-bold text-terra hover:bg-sand">
                Copy link
              </button>
              <button type="button" disabled={busy !== null} onClick={() => revoke(invite.id, invite.email)} className="min-h-10 cursor-pointer rounded-lg px-2 text-[11.5px] font-bold text-neg hover:bg-neg/5 disabled:cursor-default disabled:opacity-50">
                {busy === `invite-${invite.id}` ? 'Revoking…' : 'Revoke'}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Field label="INVITE BY EMAIL" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="friend@example.com" maxLength={320} />
          <Button onClick={() => void sendInvite()} disabled={!email.trim() || busy !== null} className="min-h-11 px-5">
            {busy === 'invite' ? 'Sending…' : 'Send invitation'}
          </Button>
        </div>
      </section>

      {group.formerMembers.length > 0 && (
        <section className="mt-4 rounded-[18px] border border-ink/[.08] bg-cream p-5 sm:p-6">
          <h2 className="font-display text-[17px] font-bold">Former members</h2>
          <div className="mt-3 flex flex-col gap-2">
            {group.formerMembers.map((memberId) => {
              const member = memberById(memberId)
              return (
                <div key={memberId} className="rounded-xl bg-sand px-3.5 py-2.5">
                  <div className="text-[13px] font-bold">{member?.full}</div>
                  <div className="text-[11.5px] text-mute">{member?.email}</div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="mt-4 rounded-[18px] border border-neg/20 bg-cream p-5 sm:p-6">
        <h2 className="font-display text-[17px] font-bold text-neg">Delete group</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-mute">
          Permanently deletes the group, its expenses, settlements, invitations, and membership history.
        </p>
        {!showDeleteConfirmation ? (
          <Button variant="secondary" onClick={() => setShowDeleteConfirmation(true)} className="mt-4 min-h-11 border-neg/30 px-5 text-neg hover:bg-neg/5">
            Delete group
          </Button>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <Field
              label={`TYPE “${group.name}” TO CONFIRM`}
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              autoComplete="off"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void destroyGroup()} disabled={deleteConfirmation !== group.name || busy !== null} className="min-h-11 bg-neg px-5 hover:bg-neg/90">
                {busy === 'delete' ? 'Deleting…' : 'Permanently delete group'}
              </Button>
              <Button variant="secondary" onClick={() => { setShowDeleteConfirmation(false); setDeleteConfirmation('') }} disabled={busy !== null} className="min-h-11 px-5">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
