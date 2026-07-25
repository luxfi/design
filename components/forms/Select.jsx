import React from 'react'

/** Native-select build of the @lux/ui Select — same chrome, no portal. */
export function Select({ options = [], value, onChange, placeholder, style, children, ...rest }) {
  const [focus, setFocus] = React.useState(false)
  return (
    <span style={{position:'relative',display:'inline-flex',alignItems:'center',width:'100%'}}>
      <select
        value={value}
        onChange={(e)=>onChange && onChange(e.target.value)}
        onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
        style={{
          appearance:'none',width:'100%',height:36,padding:'0 32px 0 12px',
          fontFamily:'var(--font-sans)',fontSize:'var(--text-sm)',color:'var(--foreground)',
          background:'var(--black)',border:'1px solid ' + (focus ? 'var(--ring)' : 'var(--border)'),
          borderRadius:'var(--radius-sm)',outline:'none',cursor:'pointer',
          transition:'border-color var(--duration-fast) var(--ease-out)',
          ...style,
        }}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value
          const l = typeof o === 'string' ? o : o.label
          return <option key={v} value={v}>{l}</option>
        })}
        {children}
      </select>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-helper)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{position:'absolute',right:10,pointerEvents:'none'}}><polyline points="6 9 12 15 18 9" /></svg>
    </span>
  )
}
