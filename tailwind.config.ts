import type { Config } from 'tailwindcss'

// https://taiga-ui.dev/v3/colors/Base_palette
const tuiColors: Record<string, string> = [
  `base-01`,
  `base-02`,
  `base-03`,
  `base-04`,
  `base-05`,
  `base-06`,
  `base-07`,
  `base-08`,
  `base-09`,
  `primary`,
  `primary-hover`,
  `primary-active`,
  `secondary`,
  `secondary-hover`,
  `secondary-active`,
  `accent`,
  `accent-hover`,
  `accent-active`,
  `selection`,
  `focus`,
  `clear`,
  `clear-hover`,
  `clear-active`,
  `elevation-01`,
  `elevation-02`,
  `clear-inverse`,
  `clear-inverse-hover`,
  `clear-inverse-active`,
  `error-fill`,
  `error-bg`,
  `error-bg-hover`,
  `success-fill`,
  `success-bg`,
  `success-bg-hover`,
  `warning-fill`,
  `warning-bg`,
  `warning-bg-hover`,
  `info-fill`,
  `info-bg`,
  `info-bg-hover`,
  `neutral-fill`,
  `neutral-bg`,
  `neutral-bg-hover`,
  `error-fill-night`,
  `error-bg-night`,
  `error-bg-night-hover`,
  `success-fill-night`,
  `success-bg-night`,
  `success-bg-night-hover`,
  `warning-fill-night`,
  `warning-bg-night`,
  `warning-bg-night-hover`,
  `info-fill-night`,
  `info-bg-night`,
  `info-bg-night-hover`,
  `neutral-fill-night`,
  `neutral-bg-night`,
  `neutral-bg-night-hover`,
  `text-01`,
  `text-02`,
  `text-03`,
  `link`,
  `link-hover`,
  `positive`,
  `positive-hover`,
  `negative`,
  `negative-hover`,
  `text-01-night`,
  `text-02-night`,
  `text-03-night`,
  `link-night`,
  `link-night-hover`,
  `positive-night`,
  `positive-night-hover`,
  `negative-night`,
  `negative-night-hover`,
].map((k: string) => ({[`tui-${k}`]: `var(--tui-${k})`})).reduce((acc: Record<string, string>, v) => {
  Object.keys(v).forEach((kv) => acc[kv] = v[kv])
  return acc;
}, {});

export default {
  prefix: ``,
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--first-color)",
        secondary: "var(--second-color)",
        // "tui-primary": "var(--tui-primary)",
        ...tuiColors,
        
        // https://tailwindcss.com/docs/customizing-colors
        success: "#22c55e", // green-500
        "success-dark": "#15803d", // green-700
        warning: "#eab308", // yellow-500
        danger: "#ef4444", // red-500
        info: "#3b82f6", // blue-500
        // secondary: "#6b7280", // gray-500
      },
    },
  },
  plugins: [],
} satisfies Config

