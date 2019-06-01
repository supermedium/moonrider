const COLORS = {
  OFF: '#111',
  WHITE: '#f0f0f0',

  DARKRED: '#5A354B',
  RED: '#f971c3',
  BRIGHTRED: '#ffd3ee',

  DARKBLUE: '#2B4D4C',
  BLUE: '#6ff9ea',
  BRIGHTBLUE: '#d7fdf9',

  YELLOW: '#fff568',

  UI_ACCENT: '#08bfa2',
  UI_ACCENT2: '#f01978'
};

COLORS.schemes = {
  default: {
    off: '#111',
    primary: COLORS.RED,
    primarybright: COLORS.BRIGHTRED,
    secondary: COLORS.BLUE,
    secondarybright: COLORS.BRIGHTBLUE,
    tertiary: COLORS.YELLOW
  },

  blue: {
    off: '#111',
    primary: '#0B4BB3',
    primarybright: '#4A90FF',
    secondary: '#FFD840',
    secondarybright: '#FF882B',
    tertiary: '#ADCC54',
  },

  purple: {
    off: '#111',
    primary: '#6A39B3',
    primarybright: '#B685FF',
    secondary: '#FAF239',
    secondarybright: '#FFFC9E',
    tertiary: '#50FFF2'
  },

  red: {
    off: '#111',
    primary: '#E03A3E',
    primarybright: '#FA7578',
    secondary: '#CCC',
    secondarybright: '#EFEFEF',
    tertiary: '#666',
  },

  black: {
    off: '#111',
    primary: '#666',
    primarybright: '#808080',
    secondary: '#EFEFEF',
    secondarybright: '#FAFAFA',
    tertiary: '#B8B8B8',
  }
}

COLORS.options = Object.keys(COLORS.schemes);

module.exports = COLORS;
