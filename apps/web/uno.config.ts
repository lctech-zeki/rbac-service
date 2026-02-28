import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";

export default defineConfig({
  shortcuts: [
    [
      "btn",
      "inline-flex items-center justify-center px-5 py-2.5 font-semibold text-sm transition-all duration-200 border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed rounded-md",
    ],
    [
      "btn-primary",
      "btn bg-accent text-btn-text hover:bg-accent-dim hover:shadow-[0_4px_20px_var(--accent-glow)] hover:-translate-y-0.5 active:translate-y-0",
    ],
    [
      "btn-ghost",
      "btn bg-transparent text-text-secondary border border-border-subtle hover:bg-bg-hover hover:text-text-primary hover:border-border-default",
    ],
    [
      "btn-danger",
      "btn bg-danger text-white hover:bg-red-600 hover:shadow-[0_4px_20px_rgba(239,68,68,0.3)] hover:-translate-y-0.5 active:translate-y-0",
    ],
    [
      "btn-accent",
      "btn bg-accent-subtle text-accent border border-accent/30 hover:bg-accent hover:text-btn-text hover:border-accent",
    ],
    [
      "input-base",
      "w-full px-4 py-3 bg-bg-surface border border-border-subtle text-text-primary placeholder-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 rounded-md",
    ],
    [
      "card",
      "bg-bg-surface border border-border-subtle rounded-xl shadow-[var(--shadow-card,0_0_0_1px_rgba(0,0,0,0.05))]",
    ],
  ],
  theme: {
    colors: {
      'bg-primary': 'var(--bg-primary)',
      'bg-surface': 'var(--bg-surface)',
      'bg-elevated': 'var(--bg-elevated)',
      'bg-hover': 'var(--bg-hover)',
      'border-subtle': 'var(--border-subtle)',
      'border-default': 'var(--border-default)',
      'text-primary': 'var(--text-primary)',
      'text-secondary': 'var(--text-secondary)',
      'text-muted': 'var(--text-muted)',
      'accent': 'var(--accent)',
      'accent-dim': 'var(--accent-dim)',
      'accent-subtle': 'var(--accent-subtle)',
      'accent-glow': 'var(--accent-glow)',
      'danger': 'var(--danger)',
      'success': 'var(--success)',
      'btn-text': 'var(--btn-text)',
    },
  },
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
});
