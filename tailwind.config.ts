import { type Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'var(--border)',
				input: 'var(--input)',
				ring: 'var(--ring)',
				background: 'var(--background)',
				foreground: 'var(--foreground)',
				primary: {
					DEFAULT: 'var(--primary)',
					foreground: 'var(--primary-foreground)'
				},
				secondary: {
					DEFAULT: 'var(--secondary)',
					foreground: 'var(--secondary-foreground)'
				},
				destructive: {
					DEFAULT: 'var(--destructive)',
					foreground: 'var(--destructive-foreground)'
				},
				muted: {
					DEFAULT: 'var(--muted)',
					foreground: 'var(--muted-foreground)'
				},
				accent: {
					DEFAULT: 'var(--accent)',
					foreground: 'var(--accent-foreground)'
				},
				hover: {
					DEFAULT: 'var(--color-hover)'
				},
				popover: {
					DEFAULT: 'var(--popover)',
					foreground: 'var(--popover-foreground)'
				},
				card: {
					DEFAULT: 'var(--card)',
					foreground: 'var(--card-foreground)'
				},
				success: {
					DEFAULT: 'var(--color-success)',
					foreground: 'var(--color-success-foreground)'
				},
				'notion-gray': 'rgb(var(--notion-gray))',
				'notion-gray-hover': 'rgb(var(--notion-gray-hover))',
				'notion-blue': 'rgb(var(--notion-blue))',
				'notion-blue-hover': 'rgb(var(--notion-blue-hover))',
				'notion-green': 'rgb(var(--notion-green))',
				'notion-orange': 'rgb(var(--notion-orange))',
				'notion-red': 'rgb(var(--notion-red))',
				'notion-purple': 'rgb(var(--notion-purple))',
				'notion-pink': 'rgb(var(--notion-pink))',
				'notion-yellow': 'rgb(var(--notion-yellow))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				DEFAULT: 'var(--radius-button)'
			},
			ringOffsetWidth: {
				'3': '3px'
			},
			fontFamily: {
				sans: [
					'var(--font-primary)',
					'system-ui',
					'sans-serif'
				],
				mono: [
					'var(--font-mono)',
					'monospace'
				]
			},
			transitionDuration: {
				DEFAULT: '200ms'
			},
			transitionTimingFunction: {
				DEFAULT: 'ease-in-out'
			},
			screens: {
				xs: '375px',
				sm: '640px',
				md: '768px',
				lg: '1024px',
				xl: '1280px',
				'2xl': '1400px'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
