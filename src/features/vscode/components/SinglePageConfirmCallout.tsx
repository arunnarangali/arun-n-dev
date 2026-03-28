import { Icon } from './Icon'

type SinglePageConfirmCalloutProps = {
  pendingValue: boolean
  isApplying: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const SinglePageConfirmCallout = ({
  pendingValue,
  isApplying,
  onCancel,
  onConfirm,
}: SinglePageConfirmCalloutProps) => {
  return (
    <div className="mt-2 rounded-lg border border-outline-variant bg-surface-container-highest p-3 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] text-on-surface">
            {pendingValue
              ? 'Enable single page? Tabs follow scroll, split is disabled, and terminal closes.'
              : 'Disable single page? Return to the classic tab-based editor.'}
          </p>
          {isApplying && (
            <div className="mt-2 flex items-center gap-2 text-[10px] text-secondary/70">
              <Icon name="autorenew" className="text-[14px] animate-spin" />
              <span className="animate-pulse">Applying change…</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isApplying}
            className="rounded px-2 py-1 text-[10px] text-secondary/70 transition hover:bg-surface-container-low disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isApplying}
            className="rounded bg-primary-container px-2 py-1 text-[10px] text-on-primary transition hover:bg-primary disabled:opacity-60"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
