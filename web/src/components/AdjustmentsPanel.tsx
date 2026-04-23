import {
  Sun,
  Contrast,
  Sparkles,
  Triangle,
  Aperture,
  Grid3x3,
  type LucideIcon,
} from 'lucide-react'
import { useEditor, ADJUSTMENT_RANGES } from '../store/editorStore'
import { AdjustmentTab, AdjustmentType } from '../types'

const TABS: Array<{ id: AdjustmentTab; label: string; Icon: LucideIcon }> = [
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'color', label: 'Color', Icon: Contrast },
  { id: 'effects', label: 'Effects', Icon: Sparkles },
  { id: 'detail', label: 'Detail', Icon: Triangle },
  { id: 'optics', label: 'Optics', Icon: Aperture },
  { id: 'geometry', label: 'Geometry', Icon: Grid3x3 },
]

const GROUPS: Record<AdjustmentTab, AdjustmentType[]> = {
  light: ['exposure', 'contrast', 'highlights', 'shadows'],
  color: ['saturation', 'temperature', 'tint', 'vibrance'],
  effects: ['vignette', 'grain'],
  detail: ['sharpness'],
  optics: ['vignette', 'grain'],
  geometry: ['rotation', 'straighten'],
}

export function AdjustmentsPanel() {
  const activeTab = useEditor((s) => s.activeTab)
  const setActiveTab = useEditor((s) => s.setActiveTab)
  const applyAuto = useEditor((s) => s.applyAuto)

  return (
    <div className="bg-panel rounded-t-2xl border-t border-divider pt-2 pb-3 shadow-[0_-8px_24px_rgba(0,0,0,0.4)]">
      <div className="w-9 h-1 bg-white/25 rounded-full mx-auto" />

      <div className="flex items-center justify-between px-5 pt-3">
        <h3 className="text-white font-semibold text-[17px]">Adjustments</h3>
      </div>

      <div className="flex items-stretch px-3 pt-3">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center gap-1.5 py-1"
            >
              <Icon size={18} />
              <span className="text-[11px] font-medium">{label}</span>
              <div
                className={`h-0.5 w-9 rounded-full ${isActive ? 'bg-accent' : 'bg-transparent'}`}
              />
              <style>{''}</style>
            </button>
          )
        })}
      </div>
      <div className="h-px bg-divider mt-1" />

      <div className="flex items-center justify-between px-5 pt-3">
        <span className="text-sm text-white font-medium">
          {TABS.find((t) => t.id === activeTab)?.label}
        </span>
        <button onClick={applyAuto} className="text-accent text-sm font-semibold">
          Auto
        </button>
      </div>

      <div className="px-5 pt-2 pb-2 flex flex-col gap-4">
        {GROUPS[activeTab].map((type) => (
          <AdjustmentSlider key={type} type={type} />
        ))}
      </div>
    </div>
  )
}

function AdjustmentSlider({ type }: { type: AdjustmentType }) {
  const value = useEditor((s) => s.adjustments[type])
  const setAdjustment = useEditor((s) => s.setAdjustment)
  const commit = useEditor((s) => s.commitAdjustment)
  const [min, max] = ADJUSTMENT_RANGES[type]
  const step = type === 'exposure' ? 0.01 : 1

  const label = type.charAt(0).toUpperCase() + type.slice(1)
  const formatted =
    type === 'exposure' ? (value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2)) : (value >= 0 ? `+${Math.round(value)}` : Math.round(value).toString())

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-white font-medium">{label}</span>
        <span className="text-sm text-white/70 font-medium">{formatted}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setAdjustment(type, parseFloat(e.target.value))}
        onPointerUp={() => commit()}
      />
    </div>
  )
}
