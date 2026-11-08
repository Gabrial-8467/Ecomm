import { cn } from '@/lib/utils'

const inputClass =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60'

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn('grid gap-1.5 text-sm', className)}>
      <span className="font-medium">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  )
}

export function TextField({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  type = 'text',
  hint,
  className,
}: {
  label: string
  name: string
  defaultValue?: string | number | null
  placeholder?: string
  required?: boolean
  type?: string
  hint?: string
  className?: string
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <input
        className={inputClass}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        required={required}
      />
    </Field>
  )
}

export function TextAreaField({
  label,
  name,
  defaultValue,
  placeholder,
  rows = 4,
  hint,
  className,
}: {
  label: string
  name: string
  defaultValue?: string | null
  placeholder?: string
  rows?: number
  hint?: string
  className?: string
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <textarea
        className={cn(inputClass, 'h-auto min-h-24 py-2')}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
      />
    </Field>
  )
}

export function SelectField({
  label,
  name,
  defaultValue,
  options,
  hint,
  className,
}: {
  label: string
  name: string
  defaultValue?: string | null
  options: { value: string; label: string }[]
  hint?: string
  className?: string
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <select className={inputClass} name={name} defaultValue={defaultValue ?? ''}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function CheckboxField({
  label,
  name,
  defaultChecked,
  hint,
}: {
  label: string
  name: string
  defaultChecked?: boolean
  hint?: string
}) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 size-4 rounded border-input accent-primary"
      />
      <span>
        <span className="font-medium">{label}</span>
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </label>
  )
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 font-display text-3xl font-semibold">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'ACTIVE'
      ? 'border-success/30 bg-success/10 text-success'
      : status === 'DRAFT'
        ? 'border-warning/40 bg-warning/10 text-foreground'
        : 'border-border bg-secondary text-muted-foreground'
  return (
    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-medium', tone)}>
      {status}
    </span>
  )
}

export function Card({
  title,
  description,
  children,
  className,
}: {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-xl border border-border bg-card p-5', className)}>
      {title ? <h2 className="font-display text-lg font-semibold">{title}</h2> : null}
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div className={title ? 'mt-4' : ''}>{children}</div>
    </section>
  )
}

export { inputClass }
