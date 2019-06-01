const COLORS = {
  OFF: '#111',
  WHITE: '#f0f0f0',

  DARKRED: '#5A354B',
  RED: '#f971c3',
  RED2: '#f971c3',
  BRIGHTRED: '#ffd3ee',

  DARKBLUE: '#2B4D4C',
  BLUE: '#6ff9ea',
  BLUE2: '#6ff9ea',
  BRIGHTBLUE: '#d7fdf9',

  YELLOW: '#fff568',
  YELLOW_BRIGHT: '#fff788',

  PURPLE: 'purple',
  PURPLE_BRIGHT: '#BB44BB',

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
  },

  blue: {
    primary: '#0B4BB3',
    primaryBright: '#4A90FF',
    secondary: '#FFD840',
    secondaryBright: '#FF882B',
    tertiary: '#ADCC54',
  },

  purple: {
    primary: '#B32DB3',
    primaryBright: '#FF5AFE',
    secondary: '#FFE173',
    secondaryBright: '#FFE93E',
    tertiary: '#33CCB5'
  }
}

COLORS.options = Object.keys(COLORS.schemes);

module.exports = COLORS;
