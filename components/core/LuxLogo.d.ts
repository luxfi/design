/** The Lux mark from the press kit.
export interface LuxLogoProps {
  /** Rendered square size in px. Nav/footer use 22; hero lockups 80. */
  size?: number;
  /** white on dark surfaces (default), black on light, inherit to take currentColor. */
  variant?: 'white' | 'black' | 'inherit';
  title?: string;
}
export function LuxLogo(props: LuxLogoProps): JSX.Element;
export interface LuxWordmarkProps extends LuxLogoProps { label?: string }
export function LuxWordmark(props: LuxWordmarkProps): JSX.Element;
