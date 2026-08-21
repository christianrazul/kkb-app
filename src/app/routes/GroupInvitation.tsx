import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { request } from '@/data/http/apiClient'
import { useAuth } from '../providers/AuthProvider'
import { Button } from '../components/Button'

interface GroupInvitationResponse {
  groupId: string
  groupName: string
  inviterName: string
  invitedEmail: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REVOKED'
}

interface GroupInvitationDecisionResponse {
  groupId: string
  status: 'ACCEPTED' | 'DECLINED'
}

export function GroupInvitation() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, loginWithGoogle } = useAuth()
  const [invitation, setInvitation] = useState<GroupInvitationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [deciding, setDeciding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let active = true
    request<GroupInvitationResponse>(`/api/invitations/groups/${token}`)
      .then((result) => {
        if (active) setInvitation(result)
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load this invitation')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [token])

  const decide = async (decision: 'accept' | 'decline') => {
    if (!token || deciding) return
    setDeciding(true)
    setError(null)
    try {
      const result = await request<GroupInvitationDecisionResponse>(`/api/invitations/groups/${token}/${decision}`, {
        method: 'POST',
      })
      if (decision === 'accept') {
        navigate(`/groups/${result.groupId}`, { replace: true })
      } else {
        setInvitation((current) => current ? { ...current, status: 'DECLINED' } : current)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this invitation')
    } finally {
      setDeciding(false)
    }
  }

  if (loading || authLoading) {
    return <div className="grid min-h-dvh place-items-center text-sm font-bold text-mute">Loading invitation…</div>
  }

  return (
    <InvitationShell>
      {invitation ? (
        <>
          <div className="text-[11px] font-bold tracking-[1px] text-terra">GROUP INVITATION</div>
          <h1 className="mt-2 font-display text-[25px] font-bold leading-tight">Join {invitation.groupName}</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-mute-2">
            {invitation.inviterName} invited <strong className="text-ink">{invitation.invitedEmail}</strong> to this group.
          </p>

          {invitation.status === 'PENDING' && !user && (
            <div className="mt-6">
              <Button onClick={() => loginWithGoogle(`/invitations/groups/${token}`)} className="min-h-12 w-full px-5">
                Continue with Google
              </Button>
              <p className="mt-3 text-center text-[11.5px] leading-relaxed text-mute-3">
                Sign in using the Google account shown above. You will review the invitation again before joining.
              </p>
            </div>
          )}

          {invitation.status === 'PENDING' && user && (
            <div className="mt-6">
              <div className="rounded-xl bg-sand px-3.5 py-3 text-[12.5px] text-mute-2">
                Signed in as <strong className="text-ink">{user.email}</strong>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button variant="secondary" disabled={deciding} onClick={() => void decide('decline')} className="min-h-11">
                  Decline
                </Button>
                <Button disabled={deciding} onClick={() => void decide('accept')} className="min-h-11">
                  {deciding ? 'Saving…' : 'Accept and join'}
                </Button>
              </div>
            </div>
          )}

          {invitation.status !== 'PENDING' && (
            <div className="mt-6 rounded-xl bg-sand px-4 py-3 text-[13px] font-semibold text-mute-2">
              {invitation.status === 'ACCEPTED' && 'This invitation has already been accepted.'}
              {invitation.status === 'DECLINED' && 'This invitation was declined.'}
              {invitation.status === 'REVOKED' && 'This invitation was revoked by the group owner.'}
            </div>
          )}
        </>
      ) : (
        <>
          <h1 className="font-display text-[24px] font-bold">Invitation unavailable</h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-mute-2">{error ?? 'This invitation could not be found.'}</p>
        </>
      )}
      {error && invitation && <div className="mt-4 text-[12.5px] font-semibold text-neg">{error}</div>}
      <Link to={user ? '/dashboard' : '/login'} className="mt-6 block text-center text-[12px] font-bold text-mute-2 underline underline-offset-2">
        Back to KKB
      </Link>
    </InvitationShell>
  )
}

function InvitationShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-sand px-4 py-8">
      <main className="rise w-full max-w-[440px] rounded-[22px] border border-ink/10 bg-cream p-6 shadow-[0_20px_60px_rgba(58,49,40,.12)] sm:p-8">
        <div className="mb-7 font-display text-[27px] font-extrabold">KKB<span className="text-terra">.</span></div>
        {children}
      </main>
    </div>
  )
}
