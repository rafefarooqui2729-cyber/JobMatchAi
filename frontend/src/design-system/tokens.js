export const designTokens = Object.freeze({
  color: {
    navy: {
      950: '#071426',
      900: '#0b1f3a',
      800: '#102a4c',
      700: '#234a73',
      100: '#dfeafc',
      50: '#edf4ff',
    },
    text: {
      primary: '#edf5ff',
      secondary: '#c7d7ef',
      muted: '#9bb0cf',
      inverse: '#071426',
    },
    border: 'rgba(255,255,255,0.10)',
    surface: 'rgba(255,255,255,0.05)',
    canvas: '#071426',
    accent: '#5aa0ff',
    success: '#74d7a6',
    warning: '#ffcc7a',
    danger: '#ff8a80',
  },
  spacing: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
  },
  radius: {
    control: '0.75rem',
    card: '1rem',
    panel: '1.5rem',
    pill: '999px',
  },
  shadow: {
    card: '0 8px 28px -18px rgb(8 26 51 / 24%)',
    raised: '0 24px 64px -28px rgb(8 26 51 / 30%)',
    focus: '0 0 0 4px rgb(61 130 211 / 18%)',
  },
  motion: {
    fast: 0.16,
    normal: 0.24,
    slow: 0.4,
    ease: [0.22, 1, 0.36, 1],
  },
});

export default designTokens;
