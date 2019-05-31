const COLORS = {
  OFF: '#111',
  WHITE: '#f0f0f0',
  RED: '#f971c3',
  BLUE: '#6ff9ea',
  YELLOW: '#fff568',
  BRIGHTRED: '#ffd3ee',
  BRIGHTBLUE: '#d7fdf9',

  DARKRED: '#5A354B',
  DARKBLUE: '#2B4D4C',

  RED2: '#f971c3',
  BLUE2: '#6ff9ea',

  UI_ACCENT: '#08bfa2',
  UI_ACCENT2: '#f01978'
};

COLORS.schemes = {
  default: {
    primary: COLORS.RED,
    primaryBright: COLORS.BRIGHTRED,
    secondary: COLORS.BLUE,
    secondaryBright: COLORS.BRIGHTBLUE,
    tertiary: COLORS.YELLOW
  }
}

module.exports = COLORS;
