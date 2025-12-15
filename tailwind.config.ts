import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
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
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			fontFamily: {
				// ThoseJobs.com Typography: Bold rounded sans for headings, clean sans for body
				'heading': ['Poppins', 'Montserrat', 'system-ui', 'Segoe UI', 'sans-serif'],
				'body': ['Inter', 'Roboto', 'system-ui', 'Segoe UI', 'sans-serif'],
			},
			colors: {
				...require('tailwindcss/colors'),
				'tj-yellow': '#FFDE59',
				'tj-cream': '#F4E4C2',
				'tj-blue': '#0846BC',
				'tj-dark': '#05070A',
			},
			fontSize: {
				'hero': ['clamp(3rem, 8vw, 6rem)', { lineHeight: '0.9' }],
				'display': ['clamp(2rem, 5vw, 3.5rem)', { lineHeight: '1.1' }],
			},
			backgroundImage: {
				'hero-gradient': 'var(--hero-gradient)',
			},
			boxShadow: {
				'soft-glow': 'var(--soft-glow)',
				'elegant': 'var(--elegant-shadow)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-up': {
					'0%': { opacity: '0', transform: 'translateY(30px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					'0%': { opacity: '0', transform: 'scale(0.9)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'glow': {
					'0%, 100%': { boxShadow: '0 0 20px hsl(160 84% 39% / 0.1)' },
					'50%': { boxShadow: '0 0 40px hsl(160 84% 39% / 0.2)' }
				},
				'float1': {
					'0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
					'33%': { transform: 'translateY(-20px) rotate(120deg)' },
					'66%': { transform: 'translateY(10px) rotate(240deg)' },
				},
				'float2': {
					'0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
					'33%': { transform: 'translateY(-15px) rotate(100deg)' },
					'66%': { transform: 'translateY(12px) rotate(200deg)' },
				},
				'float3': {
					'0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
					'33%': { transform: 'translateY(-18px) rotate(140deg)' },
					'66%': { transform: 'translateY(8px) rotate(220deg)' },
				},
				'float4': {
					'0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
					'33%': { transform: 'translateY(-12px) rotate(90deg)' },
					'66%': { transform: 'translateY(14px) rotate(180deg)' },
				},
				'float5': {
					'0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
					'33%': { transform: 'translateY(-22px) rotate(160deg)' },
					'66%': { transform: 'translateY(6px) rotate(260deg)' },
				},
				'float6': {
					'0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
					'33%': { transform: 'translateY(-10px) rotate(80deg)' },
					'66%': { transform: 'translateY(16px) rotate(160deg)' },
				},
				'logoBounce': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' },
				},
				'fadeInUp': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				'checkmarkBounce': {
					'0%': { transform: 'scale(0)' },
					'50%': { transform: 'scale(1.2)' },
					'100%': { transform: 'scale(1)' },
				},
				'slideIn': {
					'0%': { opacity: '0', transform: 'translateY(50px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-up': 'fade-up 0.6s ease-out',
				'scale-in': 'scale-in 0.4s ease-out',
				'glow': 'glow 2s ease-in-out infinite',
				'float1': 'float1 8s ease-in-out infinite',
				'float2': 'float2 8s ease-in-out infinite',
				'float3': 'float3 8s ease-in-out infinite',
				'float4': 'float4 8s ease-in-out infinite',
				'float5': 'float5 8s ease-in-out infinite',
				'float6': 'float6 8s ease-in-out infinite',
				'logoBounce': 'logoBounce 2s ease-in-out infinite',
				'fadeInUp': 'fadeInUp 1s ease-out forwards',
				'checkmarkBounce': 'checkmarkBounce 0.6s cubic-bezier(0.68,-0.55,0.265,1.55)',
				'slideIn': 'slideIn 0.8s cubic-bezier(0.25,0.46,0.45,0.94)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
