import React from 'react'

const FILL = {
  default:'var(--surface-card)',
  emphasis:'var(--surface-card-emphasis)',
  quiet:'var(--surface-card-quiet)',
  plain:'transparent',
}

export function Card({ variant = 'default', sheen = false, interactive = false, style, children, ...rest }) {
  const [hover, setHover] = React.useState(false)
  return (
    <div
      onMouseEnter={interactive ? () => setHover(true) : undefined}
      onMouseLeave={interactive ? () => setHover(false) : undefined}
      style={{
        position:'relative',overflow:'hidden',
        borderRadius:'var(--radius-lg)',
        border:'1px solid ' + (hover ? 'var(--border-strong)' : 'var(--border-hairline)'),
        background:FILL[variant] || FILL.default,
        transition:'border-color var(--duration-fast) var(--ease-out)',
        ...style,
      }}
      {...rest}
    >
      {sheen && <div aria-hidden style={{position:'absolute',inset:0,pointerEvents:'none',background:'var(--sheen-card)',opacity:0.7}} />}
      {children}
    </div>
  )
}

export function CardHeader({ style, children, ...rest }) {
  return <div style={{position:'relative',padding:'24px 24px 0',display:'flex',flexDirection:'column',gap:6,...style}} {...rest}>{children}</div>
}
export function CardTitle({ style, children, ...rest }) {
  return <h3 style={{fontSize:'var(--text-base)',fontWeight:'var(--weight-semibold)',color:'var(--text-primary)',...style}} {...rest}>{children}</h3>
}
export function CardDescription({ style, children, ...rest }) {
  return <p style={{fontSize:'var(--text-sm)',lineHeight:'var(--leading-relaxed)',color:'var(--text-helper)',...style}} {...rest}>{children}</p>
}
export function CardContent({ style, children, ...rest }) {
  return <div style={{position:'relative',padding:24,...style}} {...rest}>{children}</div>
}
export function CardFooter({ style, children, ...rest }) {
  return <div style={{position:'relative',padding:'0 24px 24px',display:'flex',alignItems:'center',gap:12,...style}} {...rest}>{children}</div>
}
