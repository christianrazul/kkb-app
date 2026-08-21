import { useState } from 'react'
import type { Group } from '@/domain/types'
import { useData } from '../providers/DataProvider'
import { copyText } from '../copyText'
import { Button } from './Button'
import { Field } from './Field'
import { Modal } from './Modal'

export function InviteModal({ group, onClose }: { group: Group; onClose: () => void }) {
  const { inviteMember, memberById } = useData()
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const submit = async () => {
    if (!email.trim() || saving) return
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      await inviteMember(group.id, email.trim())
      setEmail('')
      setNotice('Group invitation queued. They must accept it before joining.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not invite this person')
    } finally {
      setSaving(false)
    }
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

  const deliveryLabel = {
    QUEUED: 'Email queued',
    SENT: 'Email sent',
    FAILED: 'Email delivery failed',
  } as const

  return (
    <Modal onClose={onClose}>
      <div className="font-display text-[18px] font-bold">Members · {group.name}</div>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-mute">
        Group invitations are tied to an email address. The recipient joins only after signing in with that Google account and accepting.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {group.members.map((memberId) => {
          const member = memberById(memberId)
          return (
            <div key={memberId} className="rounded-xl bg-sand px-3.5 py-2.5">
              <div className="text-[13px] font-bold">{member?.full}</div>
              <div className="text-[11.5px] text-mute">{member?.email}</div>
            </div>
          )
        })}
        {group.pendingInvites.map((invite) => (
          <div key={invite.id} className="flex items-center gap-3 rounded-xl border border-dashed border-ink/15 px-3.5 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold">{invite.email}</div>
              <div className={`text-[11.5px] ${invite.deliveryStatus === 'FAILED' ? 'text-neg' : 'text-mute'}`}>
                Pending acceptance · {deliveryLabel[invite.deliveryStatus]}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void copyInvite(invite.inviteUrl)}
              className="min-h-10 flex-none cursor-pointer rounded-lg px-2 text-[11.5px] font-bold text-terra hover:bg-sand"
            >
              Copy link
            </button>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-3">
        <Field label="INVITE BY EMAIL" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="friend@example.com" />
        {error && <div className="text-[12.5px] font-semibold text-neg">{error}</div>}
        <Button onClick={submit} disabled={!email.trim() || saving} className="min-h-11">
          {saving ? 'Sending…' : 'Send group invitation'}
        </Button>
        {notice && <div className="text-[12.5px] font-semibold text-pos">{notice}</div>}
      </div>
    </Modal>
  )
}
