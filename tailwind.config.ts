import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Palatino Linotype"', '"Book Antiqua"', 'Palatino', 'Georgia', 'serif'],
      },
      colors: {
        cream: '#FAF6EF', sand: '#EFE6D8',
        sage: { DEFAULT: '#8FA08A', dark: '#7E9379' },
        terra: { DEFAULT: '#C08460', dark: '#A86E4A' },
        bark: { DEFAULT: '#3E3830', light: '#7A6C60' },
      },
    },
  },
  plugins: [],
}
export default config
