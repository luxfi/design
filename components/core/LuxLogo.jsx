import React from 'react'

/** The Lux mark (assets/logo.svg), monochrome — never re-hued. */
export function LuxLogo({ size = 22, variant = 'white', title = 'Lux', style, ...rest }) {
  const fill = variant === 'white' ? '#ffffff' : variant === 'black' ? 'var(--lux-black)' : 'currentColor'
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={title} style={{ display: 'block', flexShrink: 0, ...style }} {...rest}>
      <path d="M50 85 L15 25 L85 25 Z" fill={fill}></path>
    </svg>
  )
}

/** Mark + wordmark lockup, as used in the nav and footer. */
export function LuxWordmark({ size = 22, label = 'Lux Network', variant = 'white', style }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...style }}>
      <LuxLogo size={size} variant={variant} />
      <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)' }}>{label}</span>
    </span>
  )
}
