import { useData } from '../providers/DataProvider'
import { activityFeed } from '../selectors'
import { Avatar } from '../components/Avatar'
import { EmptyState } from '../components/EmptyState'

export function Activity() {
  const { members, groups, expenses, loaded } = useData()
  const feed = activityFeed(groups, members, expenses)

  return (
    <div className="rise mx-auto max-w-[720px]">
      <div className="rounded-[18px] border border-ink/[.08] bg-cream px-4 py-1.5 sm:px-6">
        {loaded && feed.length === 0 && (
          <EmptyState
            title="No activity yet"
            message="Add an expense to start tracking shared spending."
            className="min-h-[190px] py-10 sm:min-h-[220px]"
          />
        )}
        {feed.map((a) => (
          <div key={a.id} className="flex items-center gap-3.5 border-t border-ink/[.06] py-[13px]">
            <Avatar label={a.initial} color={a.tile} size={34} radius={11} fontSize={12} />
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] [overflow-wrap:anywhere]">{a.line}</span>
              <span className="mt-px block text-[11.5px] text-mute">{a.meta}</span>
            </span>
            <span className="flex-none whitespace-nowrap text-[14px] font-bold text-mute-4">{a.amt}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
