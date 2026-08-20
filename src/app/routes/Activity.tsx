import { useData } from '../providers/DataProvider'
import { activityFeed } from '../selectors'
import { Avatar } from '../components/Avatar'

export function Activity() {
  const { members, groups, expenses } = useData()
  const feed = activityFeed(groups, members, expenses)

  return (
    <div className="rise mx-auto max-w-[720px]">
      <div className="rounded-[18px] border border-ink/[.08] bg-cream px-4 py-1.5 sm:px-6">
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
