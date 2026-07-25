import React from 'react'

const V = {
  primary:{background:'var(--primary)',color:'var(--primary-foreground)',border:'1px solid transparent'},
  secondary:{background:'var(--secondary)',color:'var(--secondary-foreground)',border:'1px solid transparent'},
  outline:{background:'transparent',color:'var(--text-primary)',border:'1px solid var(--border)'},
  ghost:{background:'transparent',color:'var(--text-secondary)',border:'1px solid transparent'},
  link:{background:'transparent',color:'var(--text-primary)',border:'1px solid transparent',textDecoration:'underline',textUnderlineOffset:4,padding:0,height:'auto'},
  destructive:{background:'var(--destructive)',color:'var(--destructive-foreground)',border:'1px solid transparent'},
}
const SZ = {
  sm:{height:32,padding:'0 12px',fontSize:'var(--text-xs)'},
  default:{height:36,padding:'0 16px',fontSize:'var(--text-sm)'},
  lg:{height:44,padding:'0 24px',fontSize:'var(--text-sm)'},
  icon:{height:36,width:36,padding:0},
}
const HOVER = { primary:'primary', secondary:'secondary', outline:'accent', ghost:'accent', destructive:'destructive', link:'link' }

export function Button({ variant = 'primary', size = 'default', pill = false, disabled, style, children, ...rest }) {
  const [hover, setHover] = React.useState(false)
  const v = V[variant] || V.primary
  const s = SZ[size] || SZ.default
  const h = HOVER[variant]
  const hoverStyle = !hover || disabled ? null
    : h === 'primary' || h === 'destructive' ? { opacity: 0.9 }
    : h === 'secondary' ? { background: 'var(--neutral-800)' }
    : h === 'accent' ? { background: 'var(--accent)', color: 'var(--text-primary)' }
    : { textDecoration: 'underline' }
  return (
    <button
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,whiteSpace:'nowrap',
        fontFamily:'var(--font-sans)',fontWeight:'var(--weight-medium)',lineHeight:1,
        borderRadius: pill ? 'var(--radius-full)' : 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition:'background-color var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out), opacity var(--duration-fast) var(--ease-out)',
        ...v, ...s, ...hoverStyle, ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
