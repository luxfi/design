import React from 'react'

export function Textarea({ rows = 4, style, ...rest }) {
  const [focus, setFocus] = React.useState(false)
  return (
    <textarea
      rows={rows}
      onFocus={(e)=>{setFocus(true);rest.onFocus&&rest.onFocus(e)}}
      onBlur={(e)=>{setFocus(false);rest.onBlur&&rest.onBlur(e)}}
      style={{
        width:'100%',padding:'8px 12px',resize:'vertical',
        fontFamily:'var(--font-sans)',fontSize:'var(--text-sm)',lineHeight:'var(--leading-relaxed)',color:'var(--foreground)',
        background:'var(--black)',border:'1px solid ' + (focus ? 'var(--ring)' : 'var(--border)'),
        borderRadius:'var(--radius-sm)',outline:'none',
        transition:'border-color var(--duration-fast) var(--ease-out)',
        ...style,
      }}
      {...rest}
    />
  )
}
