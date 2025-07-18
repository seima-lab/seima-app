// Typography system for Roboto font
// Roboto font supports Vietnamese characters including diacritics (á, à, ả, ã, ạ, ă, ắ, ằ, ẳ, ẵ, ặ, â, ấ, ầ, ẩ, ẫ, ậ, etc.)
export const typography = {
  regular: {
    fontFamily: 'Roboto',
    fontWeight: '400' as const,
  },
  medium: {
    fontFamily: 'RobotoMedium', 
    fontWeight: '500' as const,
  },
  semibold: {
    fontFamily: 'RobotoBold',
    fontWeight: '600' as const,
  },

  // Helper for Vietnamese text that needs extra line height
  vietnameseText: {
    lineHeight: 1.5, // Improved line height for Vietnamese diacritics
  },
} as const; 