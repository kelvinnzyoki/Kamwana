import type { Config } from 'tailwindcss';
const config: Config = { darkMode:'class', content:['./src/**/*.{ts,tsx}'], theme:{ extend:{ colors:{ background:'hsl(var(--background))', foreground:'hsl(var(--foreground))', card:'hsl(var(--card))', muted:'hsl(var(--muted))', border:'hsl(var(--border))', primary:'hsl(var(--primary))', primaryForeground:'hsl(var(--primary-foreground))' }, boxShadow:{ soft:'0 18px 60px rgb(0 0 0 / 0.12)' } } }, plugins:[] };
export default config;
