// Colors matching the website design
export const COLORS = {
  primary: '#E63946',      // Red
  secondary: '#1D3557',    // Navy
  success: '#06D6A0',      // Green
  warning: '#FFD166',      // Yellow
  danger: '#EF476F',       // Red
  info: '#118AB2',         // Blue
  white: '#FFFFFF',
  black: '#000000',
  background: '#F5F5F5',
  card: '#FFFFFF',
  text: {
    primary: '#222222',
    secondary: '#666666',
    light: '#999999',
    white: '#FFFFFF',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  status: {
    notStarted: '#9CA3AF',
    enRoute: '#118AB2',
    arrived: '#06D6A0',
    completed: '#06D6A0',
    cancelled: '#EF476F',
    delayed: '#FFD166',
  },
};

// Typography
export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Trip Status
export const TRIP_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  EN_ROUTE: 'EN_ROUTE',
  ARRIVED: 'ARRIVED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DELAYED: 'DELAYED',
} as const;

// Incident Types
export const INCIDENT_TYPES = {
  BREAKDOWN: 'Breakdown',
  ACCIDENT: 'Accident',
  DELAY: 'Delay',
  MEDICAL_EMERGENCY: 'Medical Emergency',
  PASSENGER_MISCONDUCT: 'Passenger Misconduct',
  ROADBLOCK: 'Roadblock',
  POLICE_STOP: 'Police Stop',
  WEATHER: 'Weather Issues',
  OTHER: 'Other',
} as const;

// Severity Levels
export const SEVERITY_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  COMPANY_CARD: 'Company Card',
  CASH: 'Cash',
  ACCOUNT: 'Account',
} as const;
