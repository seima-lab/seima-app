// Icon color mapping utility
// Centralized icon color management for consistent UI across the app

export const ICON_COLOR_MAP: { [iconName: string]: string } = {
  // Food & Dining icons - Orange/Red tones
  'silverware-fork-knife': '#ff9500',
  'coffee': '#8b4513',
  'hamburger': '#ff6b35',
  'food-apple': '#32d74b',
  'cake': '#ffd700',
  
  // Daily & Shopping icons - Green tones
  'bottle-soda': '#2ecc71',
  'shopping': '#27ae60',
  'cart': '#16a085',
  'store': '#1abc9c',
  'minus-circle': '#e74c3c',
  
  // Clothing & Fashion icons - Blue tones
  'tshirt-crew': '#3498db',
  'shoe-heel': '#2980b9',
  'hanger': '#5dade2',
  'tshirt-v': '#85c1e9',
  
  // Beauty & Cosmetic icons - Pink/Purple tones
  'lipstick': '#e91e63',
  'face-woman': '#9b59b6',
  'spray': '#f39c12',
  
  // Entertainment & Social icons - Yellow/Orange tones
  'glass-cocktail': '#f1c40f',
  'gamepad-variant': '#e67e22',
  'movie': '#f39c12',
  'music': '#e67e22',
  'party-popper': '#f39c12',
  'glass-wine': '#8e44ad',
  'account-group': '#7f8c8d',
  
  // Health & Medical icons - Green/Blue tones
  'pill': '#00b894',
  'hospital-box': '#00cec9',
  'dumbbell': '#6c5ce7',
  'doctor': '#a29bfe',
  'stethoscope': '#3498db',
  'medical-bag': '#2980b9',
  'pharmacy': '#5dade2',
  
  // Education & Learning icons - Red/Orange tones
  'book-open-variant': '#e74c3c',
  'school': '#c0392b',
  'book-open-page-variant': '#e67e22',
  'graduation-cap': '#d35400',
  'pencil': '#c0392b',
  'book-open': '#e74c3c',
  'book': '#d35400',
  
  // Work & Office icons - Gray/Blue tones
  'briefcase': '#34495e',
  'office-building': '#2c3e50',
  'laptop': '#5dade2',
  
  // Utilities icons - Blue/Cyan tones
  'flash': '#00bcd4',
  'water': '#00acc1',
  'wifi': '#0097a7',
  'fire': '#ff5722',
  'home-lightning-bolt': '#00bcd4',
  'lightning-bolt': '#00bcd4',
  'power-plug': '#0097a7',
  
  // Transportation icons - Purple/Blue tones
  'train': '#9c27b0',
  'car': '#673ab7',
  'bus': '#3f51b5',
  'taxi': '#2196f3',
  'gas-station': '#ff9800',
  'parking': '#795548',
  'airplane': '#607d8b',
  'motorbike': '#795548',
  
  // Communication icons - Blue tones
  'cellphone': '#2196f3',
  'phone': '#1976d2',
  
  // Housing icons - Brown/Orange tones
  'home-city': '#ff9800',
  'home': '#8d6e63',
  'apartment': '#a1887f',
  'home-outline': '#ff9800',
  'key': '#4caf50',
  'home-account': '#ff9800',
  
  // Financial icons - Green/Blue tones
  'cash': '#4caf50',
  'cash-plus': '#66bb6a',
  'cash-minus': '#f44336',
  'bank': '#2196f3',
  'percent': '#00bcd4',
  'chart-line': '#3f51b5',
  'piggy-bank': '#7cb342',
  'credit-card': '#607d8b',
  'wallet': '#795548',
  'bank-transfer': '#9e9e9e',
  'credit-card-multiple': '#ff9800',
  'credit-card-off': '#f44336',
  
  // Gifts & Rewards icons - Purple/Pink tones
  'gift': '#e91e63',
  'hand-heart': '#ad1457',
  'star': '#ffc107',
  'trophy': '#ff9800',
  
  // Additional common icons - Various unique colors
  'dots-horizontal': '#9e9e9e',
  'shield-account': '#388e3c',
  'tools': '#ff9800',
  'wrench': '#ff5722',
  'dog': '#8d6e63',
  'baby': '#f8bbd9',
  'beach': '#00bcd4',
  'calendar-heart': '#e91e63',
  'soccer': '#689f38',
  'palette': '#9c27b0',
  'heart': '#e91e63',
  'file-document': '#ff5722',
  'alert-circle': '#ff9800',
  'ticket': '#ff5722',
  'exit-to-app': '#9e9e9e',
  'arrow-left': '#2196f3',
  'close': '#f44336',
  'help-circle': '#9e9e9e',
  
  // Additional useful icons with unique colors
  'earth': '#2e7d32',
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

/**
 * Deduplicate categories by category_id to prevent duplicates
 * @param categories Array of categories that might contain duplicates
 * @returns Array of unique categories
 */
export const deduplicateCategories = (categories: any[]): any[] => {
  if (!Array.isArray(categories)) {
    console.warn('⚠️ deduplicateCategories: Input is not an array:', categories);
    return [];
  }
  
  const categoriesMap = new Map();
  const duplicates: any[] = [];
  
  categories.forEach((cat: any) => {
    const categoryId = cat.category_id || cat.id;
    if (categoryId) {
      if (categoriesMap.has(categoryId)) {
        duplicates.push(cat);
        console.warn('⚠️ Found duplicate category:', {
          id: categoryId,
          name: cat.category_name || cat.name,
          existing: categoriesMap.get(categoryId)
        });
      } else {
        categoriesMap.set(categoryId, cat);
      }
    } else {
      console.warn('⚠️ Category without ID:', cat);
    }
  });
  
  if (duplicates.length > 0) {
    console.warn('⚠️ Removed duplicate categories:', duplicates.length, 'duplicates found');
  }
  
  const uniqueCategories = Array.from(categoriesMap.values());
  console.log('✅ Deduplicated categories:', {
    original: categories.length,
    unique: uniqueCategories.length,
    removed: duplicates.length
  });
  
  return uniqueCategories;
}; 