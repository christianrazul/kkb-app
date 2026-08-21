import { useState } from 'react'
import { useData } from '../providers/DataProvider'
import { copyText } from '../copyText'
import { Button } from './Button'
import { Field } from './Field'
import { Modal } from './Modal'

export function KkbInviteModal({ onClose }: { onClose: () => void }) {
  const { inviteToKkb } = useData()
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inviteUrl = `${window.location.origin}/invite/kkb`

  const submit = async () => {
    if (!email.trim() || saving) return
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      await inviteToKkb(email.trim())
      setEmail('')
      setNotice('Invitation queued for delivery.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send this invitation')
    } finally {
      setSaving(false)
    }
  }

  const copy = async () => {
    setError(null)
    try {
      await copyText(inviteUrl)
      setNotice('KKB invitation link copied.')
    } catch {
      setError('Could not copy the link. Please copy it from the field below.')
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="font-display text-[18px] font-bold">Invite to KKB</div>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-mute">
        This creates a KKB account invitation only. It never adds someone to a group.
      </p>
      <div className="mt-5 flex flex-col gap-3">
        <Field label="SEND BY EMAIL" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="friend@example.com" />
        <Button onClick={submit} disabled={!email.trim() || saving} className="min-h-11">
          {saving ? 'Sending…' : 'Send KKB invitation'}
        </Button>
        <div className="flex items-center gap-3 py-1 text-[10.5px] font-bold tracking-[.7px] text-mute-3 before:h-px before:flex-1 before:bg-ink/10 after:h-px after:flex-1 after:bg-ink/10">
          OR
        </div>
        <div className="rounded-xl bg-sand px-3.5 py-3">
          <div className="truncate text-[12px] text-mute-2">{inviteUrl}</div>
          <Button variant="secondary" onClick={copy} className="mt-2 min-h-10 w-full text-[12.5px]">
            Copy KKB invite link
          </Button>
        </div>
        {notice && <div className="text-[12.5px] font-semibold text-pos">{notice}</div>}
        {error && <div className="text-[12.5px] font-semibold text-neg">{error}</div>}
      </div>
    </Modal>
  )
}
