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
  'pharmacy': '#30d158',
  
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
  'file-document': '#ff375f',
  'alert-circle': '#ff4500',
  'ticket': '#ff375f',
  'exit-to-app': '#666666',
  'arrow-left': '#007aff',
  'close': '#ff375f',
  'help-circle': '#666666',
  
  // Additional useful icons to complete the grid
  'earth': '#4caf50',
  'diamond': '#e91e63',
};

/**
 * Complete list of valid MaterialCommunityIcons available in the app
 * This includes all icons from AddEditCategoryScreen and categoryService
 */
export const VALID_MATERIAL_ICONS: string[] = [
  // Core financial icons
  'cash', 'cash-plus', 'cash-minus', 'credit-card', 'bank', 'wallet',
  'piggy-bank', 'bank-transfer', 'percent', 'chart-line', 'credit-card-multiple', 
  'credit-card-off',
  
  // Food & Dining
  'silverware-fork-knife', 'coffee', 'hamburger', 'food-apple', 'cake',
  
  // Daily & Shopping
  'bottle-soda', 'shopping', 'cart', 'store', 'minus-circle',
  
  // Clothing & Fashion
  'tshirt-crew', 'shoe-heel', 'hanger', 'tshirt-v',
  
  // Beauty & Cosmetic
  'lipstick', 'face-woman', 'spray',
  
  // Entertainment & Social
  'glass-cocktail', 'gamepad-variant', 'movie', 'music', 'party-popper',
  'glass-wine', 'account-group',
  
  // Health & Medical
  'pill', 'hospital-box', 'dumbbell', 'doctor', 'stethoscope', 'medical-bag',
  'pharmacy',
  
  // Education & Learning
  'book-open-variant', 'school', 'book-open-page-variant', 'graduation-cap',
  'pencil', 'book-open', 'book',
  
  // Work & Office
  'briefcase', 'office-building', 'laptop',
  
  // Utilities
  'flash', 'water', 'wifi', 'fire', 'home-lightning-bolt', 'lightning-bolt',
  'power-plug',
  
  // Transportation
  'train', 'car', 'bus', 'taxi', 'gas-station', 'parking', 'airplane', 'motorbike',
  
  // Communication
  'cellphone', 'phone',
  
  // Housing
  'home-city', 'home', 'apartment', 'home-outline', 'key', 'home-account',
  
  // Gifts & Rewards
  'gift', 'hand-heart', 'star', 'trophy',
  
  // Common utility icons
  'dots-horizontal', 'shield-account', 'tools', 'wrench', 'dog', 'baby',
  'beach', 'calendar-heart', 'soccer', 'palette', 'heart', 'file-document',
  'alert-circle', 'ticket', 'exit-to-app', 'arrow-left', 'close', 'help-circle',
  
  // Additional icons
  'earth', 'diamond',
];

/**
 * Icon mapping from backend category keys to MaterialCommunityIcons
 * Used when category_icon_url contains a category key instead of icon name
 */
export const CATEGORY_KEY_TO_ICON_MAP: { [key: string]: string } = {
  // Food & Dining - Expense Categories
  'food': 'silverware-fork-knife',
  'restaurant': 'silverware-fork-knife',
  'coffee': 'coffee',
  'fast-food': 'hamburger',
  'dining': 'silverware-fork-knife',
  
  // Daily & Shopping - Expense Categories  
  'daily': 'bottle-soda',
  'shopping': 'shopping',
  'grocery': 'cart',
  'market': 'store',
  
  // Clothing & Fashion - Expense Categories
  'clothes': 'tshirt-crew',
  'clothing': 'tshirt-crew',
  'fashion': 'tshirt-crew',
  'shoes': 'shoe-heel',
  
  // Beauty & Cosmetic - Expense Categories
  'cosmetic': 'lipstick',
  'beauty': 'lipstick',
  'makeup': 'lipstick',
  'skincare': 'face-woman',
  
  // Entertainment & Social - Expense Categories
  'social': 'glass-cocktail',
  'entertainment': 'gamepad-variant',
  'movie': 'movie',
  'music': 'music',
  'party': 'party-popper',
  'gaming': 'gamepad-variant',
  
  // Health & Medical - Expense Categories
  'health': 'pill',
  'medical': 'hospital-box',
  'hospital': 'hospital-box',
  'pharmacy': 'pharmacy',
  'fitness': 'dumbbell',
  'doctor': 'doctor',
  
  // Education & Learning - Expense Categories
  'education': 'book-open-variant',
  'school': 'school',
  'study': 'book-open-variant',
  'course': 'book-open-variant',
  'training': 'book-open-variant',
  
  // Work & Office - Mixed Categories
  'work': 'briefcase',
  'office': 'office-building',
  'meeting': 'account-group',
  
  // Utilities - Expense Categories
  'electric': 'flash',
  'electricity': 'flash',
  'water': 'water',
  'internet': 'wifi',
  'gas': 'fire',
  'utility': 'home-lightning-bolt',
  
  // Transportation - Expense Categories
  'transport': 'train',
  'transportation': 'train',
  'car': 'car',
  'bus': 'bus',
  'taxi': 'taxi',
  'fuel': 'gas-station',
  'petrol': 'gas-station',
  'parking': 'parking',
  
  // Communication - Expense Categories
  'phone': 'cellphone',
  'mobile': 'cellphone',
  'internet_bill': 'wifi',
  'communication': 'cellphone',
  
  // Housing - Expense Categories
  'rent': 'home-city',
  'house': 'home',
  'apartment': 'apartment',
  'home': 'home',
  'housing': 'home-city',
  
  // Income Categories
  'salary': 'cash',
  'wage': 'cash',
  'income': 'cash-plus',
  'bonus': 'gift',
  'reward': 'gift',
  'investment': 'chart-line',
  'stock': 'chart-line',
  'freelance': 'laptop',
  'freelancing': 'laptop',
  'business': 'store',
  'company': 'office-building',
  'rental': 'home-account',
  'rent_income': 'home-account',
  'dividend': 'bank',
  'interest': 'percent',
  'bank_interest': 'percent',
  'gift_money': 'hand-heart',
  'gift': 'hand-heart',
  'selling': 'cart',
  'sales': 'cart',
  'commission': 'percent',
  
  // Additional common categories
  'other': 'dots-horizontal',
  'miscellaneous': 'dots-horizontal',
  'transfer': 'bank-transfer',
  'loan': 'bank',
  'debt': 'credit-card-off',
  'saving': 'piggy-bank',
  'insurance': 'shield-account',
  'subscription': 'credit-card-multiple',
  'maintenance': 'tools',
  'repair': 'wrench',
  'pet': 'dog',
  'child': 'baby',
  'baby': 'baby',
  'book': 'book-open-page-variant',
  'travel': 'airplane',
  'vacation': 'beach',
  'holiday': 'calendar-heart',
  'gym': 'dumbbell',
  'sport': 'soccer',
  'hobby': 'palette',
  'charity': 'heart',
  'donation': 'hand-heart',
  'tax': 'file-document',
  'fine': 'alert-circle',
  'withdrawal': 'cash-minus',
  'deposit': 'cash-plus',
  
  // Default fallback
  'default_expense': 'cash-minus',
  'default_income': 'cash-plus',

  // Direct icon name mappings (when icon is saved directly as icon name)
  'briefcase': 'briefcase',
  
  // Handle invalid/legacy icon names
  'go_out': 'exit-to-app', // Map invalid go_out to valid exit-to-app
  'bug-report': 'help-circle', // Map invalid bug-report to valid help-circle
};

/**
 * Check if an icon name is valid MaterialCommunityIcon
 * @param iconName - The name of the icon to validate
 * @returns boolean indicating if the icon is valid
 */
export const isValidIcon = (iconName: string): boolean => {
  return VALID_MATERIAL_ICONS.includes(iconName);
};

/**
 * Get the appropriate icon for a category based on category_icon_url
 * This function handles both direct icon names and category keys
 * @param categoryIconUrl - The icon URL/name from the database
 * @param categoryType - The category type ('expense' | 'income')
 * @returns The valid MaterialCommunityIcon name
 */
export const getIconForCategory = (
  categoryIconUrl: string | null | undefined,
  categoryType: 'expense' | 'income'
): string => {
  // Handle null, undefined, or empty string
  if (!categoryIconUrl || !categoryIconUrl.trim()) {
    return categoryType === 'expense' ? 'cash-minus' : 'cash-plus';
  }
  
  const iconName = categoryIconUrl.trim();
  
  // Check if it's already a valid icon name
  if (isValidIcon(iconName)) {
    return iconName;
  }
  
  // Check if it's a category key that needs mapping
  const mappedIcon = CATEGORY_KEY_TO_ICON_MAP[iconName];
  if (mappedIcon && isValidIcon(mappedIcon)) {
    return mappedIcon;
  }
  
  // Log warning for debugging
  console.warn('⚠️ Unknown icon name/key:', iconName, 'for category type:', categoryType);
  
  // Fallback to default based on category type
  return categoryType === 'expense' ? 'cash-minus' : 'cash-plus';
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