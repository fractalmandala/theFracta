// ═══════════════════════════════════════════════════════
// Autocomplete Data — CSS property values
// ═══════════════════════════════════════════════════════

export const AC_DATA = {
  display: ['block', 'inline', 'inline-block', 'flex', 'grid', 'none', 'contents', 'list-item'],
  'flex-direction': ['row', 'row-reverse', 'column', 'column-reverse'],
  gap: ['0', '4px', '8px', '12px', '16px', '20px', '24px', '32px', '40px', '48px', '64px'],
  'justify-content': ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'],
  'align-items': ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'],
  'grid-template-columns': ['1fr', '1fr 1fr', '1fr 1fr 1fr', 'repeat(3, 1fr)', 'auto 1fr auto', '200px 1fr'],
  'font-size': ['10px', '11px', '12px', '13px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px', '64px'],
  'font-weight': ['300', '400', '500', '600', '700', '800'],
  'text-align': ['left', 'center', 'right', 'justify'],
  'letter-spacing': ['0', '0.01em', '0.02em', '0.04em', '0.06em', '0.1em', '-0.01em', '-0.02em'],
  'line-height': ['1.0', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '2.0'],
  border: ['none', '1px solid currentColor', '1px solid transparent', '2px solid currentColor', '1px dashed currentColor', '1px dotted currentColor'],
  'box-shadow': ['none', '0 1px 3px rgba(0,0,0,0.12)', '0 4px 12px rgba(0,0,0,0.15)', '0 8px 24px rgba(0,0,0,0.2)', '0 12px 48px rgba(0,0,0,0.25)', 'inset 0 1px 2px rgba(0,0,0,0.1)', '0 0 0 3px var(--accent)'],
  opacity: ['0', '0.1', '0.25', '0.5', '0.75', '0.9', '1'],
  transform: ['none', 'scale(0.95)', 'scale(1.05)', 'rotate(5deg)', 'rotate(-5deg)', 'translateY(-4px)', 'translateX(4px)', 'skewX(5deg)'],
  transition: ['none', 'all 0.2s ease', 'all 0.3s ease', 'all 0.3s ease-in-out', 'color 0.2s ease, background 0.2s ease', 'transform 0.2s ease', 'opacity 0.2s ease']
}

export const ANIMATIONS = {
  fadeIn: { from: 'opacity: 0', to: 'opacity: 1' },
  slideUp: { from: 'opacity: 0; transform: translateY(30px)', to: 'opacity: 1; transform: translateY(0)' },
  slideRight: { from: 'opacity: 0; transform: translateX(-30px)', to: 'opacity: 1; transform: translateX(0)' },
  scaleIn: { from: 'opacity: 0; transform: scale(0.8)', to: 'opacity: 1; transform: scale(1)' },
  rotateIn: { from: 'opacity: 0; transform: rotate(-10deg) scale(0.9)', to: 'opacity: 1; transform: rotate(0) scale(1)' },
  bounce: { from: 'transform: translateY(0)', to: 'transform: translateY(-20px); 50% { transform: translateY(0) } 70% { transform: translateY(-8px) } 85% { transform: translateY(0) }' },
  pulse: { from: 'transform: scale(1)', to: 'transform: scale(1.05); 50% { transform: scale(1) }' },
  shake: { from: 'transform: translateX(0)', to: '10%, 30%, 50%, 70%, 90% { transform: translateX(-4px) } 20%, 40%, 60%, 80% { transform: translateX(4px) }' },
  flip: { from: 'transform: perspective(400px) rotateY(0)', to: 'transform: perspective(400px) rotateY(180deg)' },
  custom: { from: '', to: '' }
}

export const THEME_PRESETS = [
  { name: 'Svelte', colors: { '--bg': '#0f0f14', '--surface': '#1a1a24', '--accent': '#ff3e00', '--fg': '#e8e8f0', '--muted': '#8888a0' }},
  { name: 'Tokyo Night', colors: { '--bg': '#1a1b26', '--surface': '#24283b', '--accent': '#7aa2f7', '--fg': '#c0caf5', '--muted': '#565f89' }},
  { name: 'Dracula', colors: { '--bg': '#282a36', '--surface': '#44475a', '--accent': '#bd93f9', '--fg': '#f8f8f2', '--muted': '#6272a4' }},
  { name: 'Nord', colors: { '--bg': '#2e3440', '--surface': '#3b4252', '--accent': '#88c0d0', '--fg': '#eceff4', '--muted': '#7b88a1' }},
  { name: 'Monokai', colors: { '--bg': '#272822', '--surface': '#3e3d32', '--accent': '#a6e22e', '--fg': '#f8f8f2', '--muted': '#75715e' }},
  { name: 'GitHub Dark', colors: { '--bg': '#0d1117', '--surface': '#161b22', '--accent': '#58a6ff', '--fg': '#c9d1d9', '--muted': '#8b949e' }},
  { name: 'Light', colors: { '--bg': '#fafafa', '--surface': '#ffffff', '--accent': '#3b82f6', '--fg': '#18181b', '--muted': '#71717a' }},
  { name: 'Warm Light', colors: { '--bg': '#faf8f5', '--surface': '#ffffff', '--accent': '#e11d48', '--fg': '#1c1917', '--muted': '#a8a29e' }}
]

export const COMPONENT_PRESETS = [
  { name: 'Button', classes: ['flex', 'items-center', 'justify-center', 'px-4', 'py-2', 'rounded-lg', 'font-medium', 'transition-all'], props: { 'padding': '10px 16px', 'border-radius': '8px', 'background': '#3b82f6', 'color': '#ffffff' }},
  { name: 'Card', classes: ['rounded-lg', 'shadow-md', 'p-6'], props: { 'background': '#1a1a24', 'border': '1px solid #2a2a3a', 'border-radius': '12px', 'padding': '24px' }},
  { name: 'Input', classes: ['w-full', 'px-3', 'py-2', 'rounded-md', 'border'], props: { 'width': '100%', 'padding': '8px 12px', 'border': '1px solid #3a3a4a', 'border-radius': '6px' }},
  { name: 'Badge', classes: ['inline-flex', 'items-center', 'rounded-full', 'px-3', 'py-1', 'text-xs', 'font-medium'], props: { 'padding': '4px 12px', 'border-radius': '999px', 'background': '#22c55e', 'color': '#ffffff', 'font-size': '12px' }},
  { name: 'Avatar', classes: ['rounded-full', 'overflow-hidden'], props: { 'width': '48px', 'height': '48px', 'border-radius': '50%', 'background': '#3b82f6' }}
]

export const SVELTEKIT_CLASSES = [
  'sr-only', 'flex', 'flex-col', 'flex-row', 'items-center', 'justify-center',
  'justify-between', 'gap-2', 'gap-4', 'gap-6', 'gap-8',
  'p-2', 'p-4', 'p-6', 'p-8', 'px-4', 'py-2',
  'm-auto', 'mx-auto', 'my-auto',
  'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl',
  'font-medium', 'font-semibold', 'font-bold',
  'rounded', 'rounded-md', 'rounded-lg', 'rounded-full',
  'bg-transparent', 'text-current',
  'w-full', 'h-full', 'min-h-screen',
  'overflow-hidden', 'overflow-auto',
  'relative', 'absolute', 'fixed', 'sticky',
  'transition-all', 'duration-200', 'duration-300',
  'hover:opacity-80', 'hover:scale-105', 'active:scale-95',
  'dark:bg-gray-900', 'dark:text-white'
]

export const TAILWIND_CLASSES = [
  'container', 'mx-auto', 'px-4', 'py-8',
  'grid', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4',
  'col-span-2', 'col-span-3',
  'bg-white', 'bg-black', 'bg-gray-100', 'bg-gray-900',
  'text-gray-900', 'text-gray-100', 'text-white',
  'border', 'border-gray-200', 'border-gray-700',
  'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl',
  'ring-2', 'ring-blue-500',
  'flex', 'flex-1', 'flex-shrink-0', 'flex-wrap',
  'items-start', 'items-center', 'items-end',
  'justify-start', 'justify-center', 'justify-end', 'justify-between',
  'space-x-2', 'space-x-4', 'space-y-2', 'space-y-4',
  'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl',
  'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold',
  'tracking-tight', 'tracking-normal', 'tracking-wide',
  'leading-none', 'leading-tight', 'leading-normal', 'leading-relaxed',
  'rounded', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-full',
  'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'p-10', 'p-12',
  'px-2', 'px-3', 'px-4', 'px-5', 'px-6', 'px-8',
  'py-1', 'py-2', 'py-3', 'py-4', 'py-5', 'py-6',
  'm-0', 'm-1', 'm-2', 'm-4', 'm-auto',
  'mx-auto', 'my-auto', 'mt-4', 'mb-4', 'ml-auto', 'mr-auto',
  'w-auto', 'w-full', 'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-3/4',
  'h-auto', 'h-full', 'h-screen', 'min-h-screen', 'min-h-0',
  'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-4xl',
  'overflow-hidden', 'overflow-auto', 'overflow-scroll',
  'relative', 'absolute', 'fixed', 'sticky', 'inset-0',
  'z-0', 'z-10', 'z-20', 'z-50',
  'transition', 'transition-all', 'transition-colors', 'transition-transform',
  'duration-150', 'duration-200', 'duration-300', 'duration-500',
  'ease-linear', 'ease-in', 'ease-out', 'ease-in-out',
  'hover:bg-gray-100', 'hover:bg-gray-800', 'hover:text-blue-600',
  'hover:scale-105', 'hover:scale-110', 'hover:-translate-y-0.5',
  'active:scale-95', 'active:bg-gray-200',
  'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500',
  'disabled:opacity-50', 'disabled:cursor-not-allowed',
  'sr-only', 'not-sr-only',
  'blur-sm', 'blur-md', 'blur-lg',
  'grayscale', 'grayscale-0', 'sepia',
  'opacity-0', 'opacity-25', 'opacity-50', 'opacity-75', 'opacity-100',
  'scale-90', 'scale-95', 'scale-100', 'scale-105', 'scale-110',
  'rotate-0', 'rotate-1', 'rotate-2', 'rotate-3', 'rotate-6',
  'translate-y-0', 'translate-y-1', 'translate-y-2', 'translate-y-4',
  'backdrop-blur', 'backdrop-blur-sm', 'backdrop-blur-md',
  'border-t', 'border-b', 'border-l', 'border-r',
  'divide-y', 'divide-x',
  'gap-0', 'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-5', 'gap-6', 'gap-8'
]
