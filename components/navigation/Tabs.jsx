import React from 'react'

const Ctx = React.createContext({ value: null, setValue: () => {} })

export function Tabs({ defaultValue, value, onValueChange, style, children, ...rest }) {
  const [inner, setInner] = React.useState(defaultValue)
  const v = value === undefined ? inner : value
  const setValue = (n) => { if (value === undefined) setInner(n); onValueChange && onValueChange(n) }
  return (
    <Ctx.Provider value={{ value: v, setValue }}>
      <div style={{display:'flex',flexDirection:'column',gap:16,...style}} {...rest}>{children}</div>
    </Ctx.Provider>
  )
}

export function TabsList({ style, children, ...rest }) {
  return (
    <div role="tablist" style={{display:'inline-flex',alignItems:'center',gap:4,padding:4,borderRadius:'var(--radius-sm)',background:'var(--muted)',border:'1px solid var(--border)',...style}} {...rest}>{children}</div>
  )
}

export function TabsTrigger({ value, style, children, ...rest }) {
  const { value: active, setValue } = React.useContext(Ctx)
  const on = active === value
  return (
    <button
      role="tab" aria-selected={on} onClick={() => setValue(value)}
      style={{
        display:'inline-flex',alignItems:'center',gap:8,height:30,padding:'0 12px',
        fontFamily:'var(--font-sans)',fontSize:'var(--text-sm)',fontWeight:'var(--weight-medium)',
        color: on ? 'var(--text-primary)' : 'var(--text-helper)',
        background: on ? 'var(--secondary)' : 'transparent',
        border:'1px solid ' + (on ? 'var(--border)' : 'transparent'),
        borderRadius:'calc(var(--radius-sm) - 2px)',cursor:'pointer',whiteSpace:'nowrap',
        transition:'color var(--duration-fast) var(--ease-out), background-color var(--duration-fast) var(--ease-out)',
        ...style,
      }}
      {...rest}
    >{children}</button>
  )
}

export function TabsContent({ value, style, children, ...rest }) {
  const { value: active } = React.useContext(Ctx)
  if (active !== value) return null
  return <div role="tabpanel" style={style} {...rest}>{children}</div>
}
