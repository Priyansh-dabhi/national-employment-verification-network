/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0a0f18',
                surface: '#121a28',
                surfaceHighlight: '#1a2639',
                borderGlow: '#1f3a5f',
                accentCyan: '#00f0ff',
                accentPurple: '#b000ff',
                statusGreen: '#00ff88',
                statusRed: '#ff3366',
                statusAmber: '#ffb800'
            },
            boxShadow: {
                'glow-cyan': '0 0 15px rgba(0, 240, 255, 0.3)',
                'glow-red': '0 0 15px rgba(255, 51, 102, 0.3)',
                'glow-green': '0 0 15px rgba(0, 255, 136, 0.3)',
            },
            fontFamily: {
                mono: ['JetBrains Mono', 'Menlo', 'monospace'],
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            }
        },
    },
    plugins: [],
}
