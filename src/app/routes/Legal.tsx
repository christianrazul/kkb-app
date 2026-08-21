import { Link } from 'react-router-dom'

type LegalPageProps = {
  title: string
  children: React.ReactNode
}

function LegalPage({ title, children }: LegalPageProps) {
  return (
    <main className="min-h-dvh bg-sand px-5 py-10 sm:px-8 sm:py-16">
      <article className="mx-auto max-w-[720px] rounded-2xl border border-ink/10 bg-cream p-6 shadow-sm sm:p-10">
        <Link to="/login" className="text-sm font-bold text-terra hover:text-terra-dark">
          KKB.
        </Link>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-mute">Effective August 21, 2026</p>
        <div className="mt-8 space-y-7 text-[15px] leading-7 text-mute-4">{children}</div>
        <Link to="/login" className="mt-10 inline-block text-sm font-bold text-terra hover:text-terra-dark">
          Back to sign in
        </Link>
      </article>
    </main>
  )
}

function Section({ title, children }: LegalPageProps) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  )
}

export function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        KKB is a private expense-sharing application. This policy explains what information KKB collects, why it is used, and the choices available to you.
      </p>

      <Section title="Information KKB collects">
        <p>
          When you sign in with Google, KKB receives your Google account identifier, name, email address, and profile picture. KKB does not receive your Google password or access your Gmail, contacts, Drive files, or calendar.
        </p>
        <p>
          KKB also stores information that you and members of your groups provide, including group names, invitations, expenses, currencies, exchange rates, splits, and settlements.
        </p>
      </Section>

      <Section title="How information is used">
        <p>
          Your account information identifies you inside shared groups and matches invitations sent to your email address. Expense information is used only to calculate and display group balances and activity.
        </p>
      </Section>

      <Section title="Sharing and selling">
        <p>
          KKB does not sell personal information or use it for advertising. Information is shared with other people only through groups that you join or are invited to. Service providers may process limited data when needed to operate hosting, authentication, and exchange-rate features.
        </p>
        <p>
          When an invitation email is requested, KKB sends the recipient&apos;s email address, the inviter&apos;s display name, and, for group invitations, the group name to Resend for email delivery. Invitation links do not include expense or balance information.
        </p>
      </Section>

      <Section title="Storage, security, and retention">
        <p>
          Application data is stored on a privately managed server and is protected using encrypted HTTPS connections and access controls. No internet service can guarantee absolute security.
        </p>
        <p>
          Group owners can delete groups they own. Other account and group records are retained while needed to provide KKB and maintain accurate shared expense history. You may request access to or deletion of your personal information using the developer contact shown on KKB&apos;s Google consent screen.
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          You can revoke KKB&apos;s Google access at any time from your Google Account permissions. Revoking access prevents future sign-ins but does not automatically delete records already stored by KKB. You may also stop using KKB at any time.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          This policy may be updated when KKB&apos;s features or legal obligations change. The effective date at the top of this page will identify the current version.
        </p>
      </Section>
    </LegalPage>
  )
}

export function Terms() {
  return (
    <LegalPage title="Terms of Service">
      <p>By signing in to KKB, you agree to these terms.</p>

      <Section title="Using KKB">
        <p>
          KKB helps private groups record shared expenses and settlements. You must provide accurate information, use only accounts you are authorized to use, and avoid interfering with the service or other users.
        </p>
      </Section>

      <Section title="Your content and responsibilities">
        <p>
          You retain responsibility for the expense details, group names, and invitations you enter. Only add people whose email addresses you are authorized to use, and do not enter unlawful, harmful, or sensitive information that is unnecessary for splitting expenses.
        </p>
      </Section>

      <Section title="Financial disclaimer">
        <p>
          KKB is a record-keeping tool, not a bank, payment processor, accountant, or financial adviser. Balances and currency conversions are informational. You are responsible for confirming amounts and arranging payments outside KKB.
        </p>
      </Section>

      <Section title="Availability and liability">
        <p>
          KKB is provided on an as-available basis without a promise that it will always be uninterrupted or error-free. To the extent allowed by law, the operator is not liable for indirect losses arising from use of the service.
        </p>
      </Section>

      <Section title="Suspension and termination">
        <p>
          Access may be limited or ended when necessary to protect KKB, its users, or the server, or when these terms are violated. You may stop using the service at any time.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          These terms may be updated as KKB changes. Continued use after an update means you accept the revised terms. The effective date at the top of this page identifies the current version.
        </p>
      </Section>
    </LegalPage>
  )
}
