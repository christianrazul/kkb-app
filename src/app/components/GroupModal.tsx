import { useState } from 'react'
import { useData } from '../providers/DataProvider'
import { Button } from './Button'
import { Field } from './Field'
import { Modal } from './Modal'

const COLORS = ['#5b7ec9', '#c98a2e', '#5a9260', '#b0568f', '#c25e3a']

export function GroupModal({ onClose }: { onClose: () => void }) {
  const { createGroup } = useData()
  const [name, setName] = useState('')
  const [tileColor, setTileColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await createGroup(name.trim(), tileColor)
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the group')
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="mb-4 font-display text-[18px] font-bold">Create a group</div>
      <div className="flex flex-col gap-4">
        <Field label="GROUP NAME" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Baguio Trip" maxLength={120} />
        <div>
          <div className="mb-2 text-[11.5px] font-bold tracking-[.5px] text-mute-2">COLOR</div>
          <div className="flex gap-2.5">
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
        {error && <div className="text-[12.5px] font-semibold text-neg">{error}</div>}
        <Button onClick={submit} disabled={!name.trim() || saving} className="min-h-11">
          {saving ? 'Creating…' : 'Create group'}
        </Button>
      </div>
    </Modal>
  )
}
