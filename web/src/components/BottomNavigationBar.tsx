import { Globe, Lightbulb, Folder, Menu, type LucideIcon } from 'lucide-react'
import { useEditor } from '../store/editorStore'
import { AppTab } from '../types'
import { FloatingActionButton } from './FloatingActionButton'

const ITEMS: Array<{ id: AppTab; label: string; Icon: LucideIcon }> = [
  { id: 'discover', label: 'Discover', Icon: Globe },
  { id: 'learn', label: 'Learn', Icon: Lightbulb },
  { id: 'files', label: 'Files', Icon: Folder },
  { id: 'more', label: 'More', Icon: Menu },
]

export function BottomNavigationBar() {
  const activeAppTab = useEditor((s) => s.activeAppTab)
  const setActiveAppTab = useEditor((s) => s.setActiveAppTab)

  const [left, right] = [ITEMS.slice(0, 2), ITEMS.slice(2)]

  return (
    <div className="safe-bottom bg-bg border-t border-divider">
      <div className="flex items-end justify-between px-6 pt-2 pb-3">
        <div className="flex flex-1 justify-around">
          {left.map((i) => (
            <NavItem key={i.id} item={i} active={activeAppTab === i.id} onClick={() => setActiveAppTab(i.id)} />
          ))}
        </div>
        <FloatingActionButton />
        <div className="flex flex-1 justify-around">
          {right.map((i) => (
            <NavItem key={i.id} item={i} active={activeAppTab === i.id} onClick={() => setActiveAppTab(i.id)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function NavItem({
  item,
  active,
  onClick,
}: {
  item: { id: AppTab; label: string; Icon: LucideIcon }
  active: boolean
  onClick: () => void
}) {
  const { Icon, label } = item
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 ${active ? 'text-white' : 'text-white/60'}`}
    >
      <Icon size={18} />
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  )
}
