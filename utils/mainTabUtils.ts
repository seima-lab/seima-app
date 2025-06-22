/**
 * Main Tab Screen Utilities
 * Pure functions for tab navigation logic
 */

export type TabType = 'Finance' | 'Wallet' | 'Setting';

/**
 * Validates if a tab type is valid
 * @param tab - Tab string to validate
 * @returns boolean indicating if tab is valid
 */
export const isValidTab = (tab: string): tab is TabType => {
  return ['Finance', 'Wallet', 'Setting'].includes(tab);
};

/**
 * Gets the default tab when no tab is specified or invalid tab is provided
 * @returns Default tab type
 */
export const getDefaultTab = (): TabType => {
  return 'Finance';
};

/**
 * Determines which screen component should be rendered based on active tab
 * @param activeTab - Currently active tab
 * @returns Screen identifier for rendering
 */
export const getScreenForTab = (activeTab: TabType): TabType => {
  switch (activeTab) {
    case 'Finance':
      return 'Finance';
    case 'Wallet':
      return 'Wallet';
    case 'Setting':
      return 'Setting';
    default:
      return getDefaultTab();
  }
};

/**
 * Gets the next tab in sequence (for testing navigation flow)
 * @param currentTab - Current active tab
 * @returns Next tab in sequence
 */
export const getNextTab = (currentTab: TabType): TabType => {
  const tabSequence: TabType[] = ['Finance', 'Wallet', 'Setting'];
  const currentIndex = tabSequence.indexOf(currentTab);
  const nextIndex = (currentIndex + 1) % tabSequence.length;
  return tabSequence[nextIndex];
};

/**
 * Gets the previous tab in sequence (for testing navigation flow)
 * @param currentTab - Current active tab
 * @returns Previous tab in sequence
 */
export const getPreviousTab = (currentTab: TabType): TabType => {
  const tabSequence: TabType[] = ['Finance', 'Wallet', 'Setting'];
  const currentIndex = tabSequence.indexOf(currentTab);
  const previousIndex = currentIndex === 0 ? tabSequence.length - 1 : currentIndex - 1;
  return tabSequence[previousIndex];
};

/**
 * Checks if a tab change is valid
 * @param fromTab - Source tab
 * @param toTab - Target tab
 * @returns boolean indicating if tab change is allowed
 */
export const isValidTabTransition = (fromTab: TabType, toTab: TabType): boolean => {
  // All tab transitions are valid in this app
  return isValidTab(fromTab) && isValidTab(toTab);
};

/**
 * Gets tab configuration with display properties
 * @param tab - Tab type
 * @returns Tab configuration object
 */
export const getTabConfig = (tab: TabType) => {
  const configs = {
    Finance: {
      key: 'Finance' as const,
      title: 'Overview',
      icon: 'home',
      iconType: 'MaterialIcons' as const,
      testId: 'finance-tab'
    },
    Wallet: {
      key: 'Wallet' as const,
      title: 'Wallet',
      icon: 'wallet',
      iconType: 'FontAwesome5' as const,
      testId: 'wallet-tab'
    },
    Setting: {
      key: 'Setting' as const,
      title: 'Setting',
      icon: 'settings',
      iconType: 'MaterialIcons' as const,
      testId: 'setting-tab'
    }
  };

  return configs[tab];
};

/**
 * Gets all available tabs
 * @returns Array of all tab types
 */
export const getAllTabs = (): TabType[] => {
  return ['Finance', 'Wallet', 'Setting'];
}; 