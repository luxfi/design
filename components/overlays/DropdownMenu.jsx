import React from 'react'

/** Hover-and-click dropdown, matching the nav's Log in / Try Lux menus. */
export function DropdownMenu({ align = 'right', hover = false, trigger, style, children }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)
  React.useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])
  return (
    <span
      ref={ref}
      onMouseEnter={hover ? () => setOpen(true) : undefined}
      onMouseLeave={hover ? () => setOpen(false) : undefined}
      style={{position:'relative',display:'inline-flex',...style}}
    >
      <span onClick={() => setOpen((v) => !v)} style={{display:'inline-flex'}}>{trigger}</span>
      {open && (
        <div style={{position:'absolute',top:'100%',[align]:0,paddingTop:12,zIndex:70,minWidth:208}}>
          <div style={{display:'flex',flexDirection:'column',padding:8,background:'var(--surface-overlay)',border:'1px solid var(--border-hairline)',borderRadius:'var(--radius-xl)',boxShadow:'var(--shadow-floating)',backdropFilter:'blur(16px)',animation:'lux-fade-down var(--duration-fast) var(--ease-out)'}}>
            {children}
          </div>
        </div>
      )}
    </span>
  )
}

export function DropdownMenuItem({ desc, style, children, ...rest }) {
  const [hover, setHover] = React.useState(false)
  return (
    <a
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{display:'block',padding: desc ? '10px 12px' : '8px 12px',borderRadius:'var(--radius-sm)',background: hover ? 'var(--neutral-900)' : 'transparent',cursor:'pointer',textDecoration:'none',transition:'background-color var(--duration-fast) var(--ease-out)',...style}}
      {...rest}
    >
      <span style={{display:'block',fontSize:'var(--text-sm)',fontWeight:'var(--weight-medium)',color:'var(--neutral-100)'}}>{children}</span>
      {desc && <span style={{display:'block',marginTop:2,fontSize:'var(--text-xs)',color:'var(--neutral-500)'}}>{desc}</span>}
    </a>
  )
}
export function DropdownMenuLabel({ style, children, ...rest }) {
  return <span style={{padding:'6px 12px',fontSize:'var(--text-xs)',fontWeight:'var(--weight-medium)',textTransform:'uppercase',letterSpacing:'var(--tracking-wide)',color:'var(--neutral-500)',...style}} {...rest}>{children}</span>
}
export function DropdownMenuSeparator({ style }) {
  return <span style={{height:1,margin:'6px 4px',background:'var(--border-hairline)',...style}} />
}
