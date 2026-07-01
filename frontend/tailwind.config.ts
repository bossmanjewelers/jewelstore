import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
    0     foreground: 'hsl(var(--card-foreground))',
        },
        gold: {
          50:  '#fdf8ec',
          100: '#f9edcc',
          200: '#f2d98a',
          300: '#e8c050',
          400: '#D4AF37',
          500: '#C9A84C',
          600: '#b8962e',
          700: '#9e7b26',
          800: '#7a5c1e',
     0    900: '#5a4116',
          DEFAULT: '#C9A84C',
        },
        luxury: {
          black:  '#080808',
          dark:   '#111111',
          card:   '#181818',
          border: '#252525',
          muted:  '#2a2a2a',
        },
      },
      borderRadius: {
   0    lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(201,168,76,0.3), 0 4px 24px rgba(201,168,76,0.08)',
        'gold-lg': '0 0 0 1px rgba(201,168,76,0.4), 0 8px 40px rgba(201,168,76,0.15)',
        luxury: '0 1px 3px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
        'luxury-lg': '0 4px 24px rgba(0,0,0,0.12), 0 16px 48px rgba(0,0,0,0.08)',
      },
      keyframes: {
     0  'accordion-down': { from: { height: '0' }, to: { height: 'var(--ra