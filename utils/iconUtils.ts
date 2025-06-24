// Icon color mapping utility
// Centralized icon color management for consistent UI across the app

export const ICON_COLOR_MAP: { [iconName: string]: string } = {
  // Food & Dining icons
  'silverware-fork-knife': '#ff9500',
  'coffee': '#8b4513',
  'hamburger': '#ff6b35',
  'food-apple': '#32d74b',
  'cake': '#ffd700',
  
  // Daily & Shopping icons
  'bottle-soda': '#32d74b',
  'shopping': '#32d74b',
  'cart': '#228b22',
  'store': '#32d74b',
  'minus-circle': '#ff375f',
  
  // Clothing & Fashion icons
  'tshirt-crew': '#007aff',
  'shoe-heel': '#1e90ff',
  'hanger': '#4169e1',
  'tshirt-v': '#007aff',
  
  // Beauty & Cosmetic icons
  'lipstick': '#ff2d92',
  'face-woman': '#dda0dd',
  'spray': '#ff69b4',
  
  // Entertainment & Social icons
  'glass-cocktail': '#ffcc02',
  'gamepad-variant': '#ff8c00',
  'movie': '#ffd700',
  'music': '#ffa500',
  'party-popper': '#ffcc02',
  'glass-wine': '#800080',
  'account-group': '#696969',
  
  // Health & Medical icons
  'pill': '#30d158',
  'hospital-box': '#30d158',
  'dumbbell': '#00ff7f',
  'doctor': '#30d158',
  'stethoscope': '#30d158',
  'medical-bag': '#228b22',
  
  // Education & Learning icons
  'book-open-variant': '#ff375f',
  'school': '#ff375f',
  'book-open-page-variant': '#30d158',
  'graduation-cap': '#dc143c',
  'pencil': '#b22222',
  'book-open': '#ff375f',
  'book': '#30d158',
  
  // Work & Office icons
  'briefcase': '#708090',
  'office-building': '#708090',
  'laptop': '#ff375f',
  
  // Utilities icons
  'flash': '#00c7be',
  'water': '#00bfff',
  'wifi': '#20b2aa',
  'fire': '#ff4500',
  'home-lightning-bolt': '#00c7be',
  'lightning-bolt': '#00c7be',
  'power-plug': '#00c7be',
  
  // Transportation icons
  'train': '#bf5af2',
  'car': '#9370db',
  'bus': '#8a2be2',
  'taxi': '#dda0dd',
  'gas-station': '#ff4500',
  'parking': '#bf5af2',
  'airplane': '#007aff',
  'motorbike': '#9370db',
  
  // Communication icons
  'cellphone': '#6ac4dc',
  'phone': '#6ac4dc',
  
  // Housing icons
  'home-city': '#ff9500',
  'home': '#cd853f',
  'apartment': '#daa520',
  'home-outline': '#ff9500',
  'key': '#32d74b',
  'home-account': '#ffcc02',
  
  // Financial icons
  'cash': '#32d74b',
  'cash-plus': '#32d74b',
  'cash-minus': '#ff375f',
  'bank': '#ff2d92',
  'percent': '#00c7be',
  'chart-line': '#007aff',
  'piggy-bank': '#32d74b',
  'credit-card': '#4682b4',
  'wallet': '#8b4513',
  'bank-transfer': '#4682b4',
  'credit-card-multiple': '#ff7f50',
  'credit-card-off': '#ff6b6b',
  
  // Gifts & Rewards icons
  'gift': '#bf5af2',
  'hand-heart': '#ff2d92',
  'star': '#ffcc02',
  'trophy': '#ffd700',
  
  // Additional common icons
  'dots-horizontal': '#999999',
  'shield-account': '#32cd32',
  'tools': '#ff9500',
  'wrench': '#ff375f',
  'dog': '#8b4513',
  'baby': '#ffb6c1',
  'beach': '#00ced1',
  'calendar-heart': '#ff69b4',
  'soccer': '#32d74b',
  'palette': '#9370db',
  'heart': '#ff1493',
  'file-document': '#696969',
  'alert-circle': '#ff4500',
  'ticket': '#ff375f',
  
  // Additional useful icons to complete the grid
  'earth': '#4caf50',
  'diamond': '#e91e63',
};

/**
 * Get the appropriate color for an icon
 * @param iconName - The name of the icon
 * @param categoryType - The category type ('expense' | 'income')
 * @param dbColor - Optional color from database (takes priority)
 * @returns The color hex string
 */
export const getIconColor = (
  iconName: string, 
  categoryType: 'expense' | 'income', 
  dbColor?: string
): string => {
  // Priority 1: Use database color if available
  if (dbColor && dbColor.trim()) {
    return dbColor;
  }
  
  // Priority 2: Use predefined icon color mapping
  const mappedColor = ICON_COLOR_MAP[iconName];
  if (mappedColor) {
    return mappedColor;
  }
  
  // Priority 3: Fallback to category type default colors
  return categoryType === 'expense' ? '#ff375f' : '#32d74b';
};

/**
 * Get all available icons for a specific category type
 * @param categoryType - The category type ('expense' | 'income')
 * @returns Array of icon objects with name and color
 */
export const getIconsForCategoryType = (categoryType: 'expense' | 'income') => {
  const allIcons = Object.entries(ICON_COLOR_MAP).map(([name, color]) => ({
    name,
    color
  }));
  
  // You can filter icons by category type if needed
  // For now, return all icons for both types
  return allIcons;
};

/**
 * Check if an icon has a predefined color
 * @param iconName - The name of the icon
 * @returns boolean indicating if the icon has a predefined color
 */
export const hasIconColor = (iconName: string): boolean => {
  return iconName in ICON_COLOR_MAP;
}; 