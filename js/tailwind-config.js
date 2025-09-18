// Tailwind configuration
export function configureTailwind() {
  if (typeof tailwind !== 'undefined') {
    tailwind.config = {
      theme: {
        fontFamily: {
          sans: ["Rubik", "sans-serif"],
        },
        extend: {
          colors: {
            "eu-blue": "#003087",
            "eu-orange": "#FF6900",
            "eu-white": "#F9F9F9",
            "text-primary": "#003087",
            "text-secondary": "#333333",
            "border-eu": "#003087",
          },
          animation: {
            "bounce-slow": "bounce 2s infinite",
            "fade-in": "fadeIn 0.5s ease-out",
          },
          keyframes: {
            fadeIn: {
              "0%": { opacity: "0" },
              "100%": { opacity: "1" },
            },
          },
        },
      },
    };
    console.log('%c[Tailwind] Configuration applied', 'color: #4CAF50;');
  } else {
    console.error('Tailwind CSS not found. Make sure to load Tailwind before this configuration.');
  }
}
