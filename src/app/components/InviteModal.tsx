import { useState } from 'react'
import type { Group } from '@/domain/types'
import { useData } from '../providers/DataProvider'
import { Button } from './Button'
import { Field } from './Field'
import { Modal } from './Modal'

export function InviteModal({ group, onClose }: { group: Group; onClose: () => void }) {
  const { inviteMember, memberById } = useData()
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!email.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await inviteMember(group.id, email.trim())
      setEmail('')
      setSaving(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not invite this person')
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="font-display text-[18px] font-bold">Members · {group.name}</div>
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
          <div key={invite.id} className="rounded-xl border border-dashed border-ink/15 px-3.5 py-2.5">
            <div className="text-[13px] font-bold">{invite.email}</div>
            <div className="text-[11.5px] text-mute">Pending Google sign-in</div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-3">
        <Field label="INVITE BY EMAIL" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="friend@example.com" />
        {error && <div className="text-[12.5px] font-semibold text-neg">{error}</div>}
        <Button onClick={submit} disabled={!email.trim() || saving} className="min-h-11">
          {saving ? 'Inviting…' : 'Invite member'}
        </Button>
      </div>
    </Modal>
  )
}
