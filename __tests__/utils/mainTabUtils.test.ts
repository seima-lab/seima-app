/**
 * Main Tab Utils Unit Tests
 * 
 * Testing Strategy: F.I.R.S.T Principles & AAA Pattern
 * Focus: Pure functions for tab navigation logic
 * 
 * F.I.R.S.T:
 * - Fast: Tests run quickly without external dependencies
 * - Independent: Each test can run in isolation
 * - Repeatable: Same results in any environment
 * - Self-validating: Clear pass/fail with meaningful assertions
 * - Timely: Tests written alongside production code
 * 
 * AAA Pattern:
 * - Arrange: Set up test data and conditions
 * - Act: Execute the function being tested
 * - Assert: Verify expected outcome
 */

import {
    getAllTabs,
    getDefaultTab,
    getNextTab,
    getPreviousTab,
    getScreenForTab,
    getTabConfig,
    isValidTab,
    isValidTabTransition,
    TabType
} from '../../utils/mainTabUtils';

describe('MainTabUtils', () => {

  // ====================================
  // TEST DATA FACTORIES
  // ====================================
  const TestData = {
    validTabs: ['Finance', 'Wallet', 'Setting'] as TabType[],
    invalidTabs: ['', 'finance', 'WALLET', 'Home', 'Profile', 'Dashboard', null, undefined],
    
    tabSequenceTests: [
      { current: 'Finance' as TabType, next: 'Wallet' as TabType, previous: 'Setting' as TabType },
      { current: 'Wallet' as TabType, next: 'Setting' as TabType, previous: 'Finance' as TabType },
      { current: 'Setting' as TabType, next: 'Finance' as TabType, previous: 'Wallet' as TabType }
    ],

    tabConfigExpected: {
      Finance: {
        key: 'Finance',
        title: 'Overview',
        icon: 'home',
        iconType: 'MaterialIcons',
        testId: 'finance-tab'
      },
      Wallet: {
        key: 'Wallet',
        title: 'Wallet',
        icon: 'wallet',
        iconType: 'FontAwesome5',
        testId: 'wallet-tab'
      },
      Setting: {
        key: 'Setting',
        title: 'Setting',
        icon: 'settings',
        iconType: 'MaterialIcons',
        testId: 'setting-tab'
      }
    },

    validTransitions: [
      { from: 'Finance' as TabType, to: 'Wallet' as TabType },
      { from: 'Wallet' as TabType, to: 'Setting' as TabType },
      { from: 'Setting' as TabType, to: 'Finance' as TabType },
      { from: 'Finance' as TabType, to: 'Finance' as TabType } // Same tab
    ]
  };

  // ====================================
  // TAB VALIDATION TESTS
  // ====================================
  describe('isValidTab', () => {
    describe('WHEN checking valid tab types', () => {
      TestData.validTabs.forEach((tab) => {
        it(`should return true for valid tab "${tab}"`, () => {
          // Arrange
          const inputTab = tab;

          // Act
          const result = isValidTab(inputTab);

          // Assert
          expect(result).toBe(true);
        });
      });
    });

    describe('WHEN checking invalid tab types', () => {
      TestData.invalidTabs.forEach((tab) => {
        it(`should return false for invalid tab "${tab}"`, () => {
          // Arrange
          const inputTab = tab as string;

          // Act
          const result = isValidTab(inputTab);

          // Assert
          expect(result).toBe(false);
        });
      });
    });

    describe('WHEN checking edge cases', () => {
      it('should return false for empty string', () => {
        // Arrange
        const inputTab = '';

        // Act
        const result = isValidTab(inputTab);

        // Assert
        expect(result).toBe(false);
      });

      it('should return false for case-sensitive variations', () => {
        // Arrange
        const inputTab = 'finance'; // lowercase

        // Act
        const result = isValidTab(inputTab);

        // Assert
        expect(result).toBe(false);
      });
    });
  });

  // ====================================
  // DEFAULT TAB TESTS
  // ====================================
  describe('getDefaultTab', () => {
    describe('WHEN getting default tab', () => {
      it('should return Finance as default tab', () => {
        // Arrange & Act
        const result = getDefaultTab();

        // Assert
        expect(result).toBe('Finance');
      });

      it('should always return the same default tab', () => {
        // Arrange & Act
        const result1 = getDefaultTab();
        const result2 = getDefaultTab();

        // Assert
        expect(result1).toBe(result2);
        expect(result1).toBe('Finance');
      });
    });
  });

  // ====================================
  // SCREEN MAPPING TESTS
  // ====================================
  describe('getScreenForTab', () => {
    describe('WHEN mapping valid tabs to screens', () => {
      TestData.validTabs.forEach((tab) => {
        it(`should return "${tab}" screen for "${tab}" tab`, () => {
          // Arrange
          const inputTab = tab;

          // Act
          const result = getScreenForTab(inputTab);

          // Assert
          expect(result).toBe(tab);
        });
      });
    });

    describe('WHEN handling edge cases', () => {
      it('should return default tab for unknown tab via default case', () => {
        // Arrange
        const unknownTab = 'Unknown' as TabType;

        // Act
        const result = getScreenForTab(unknownTab);

        // Assert
        expect(result).toBe('Finance');
      });
    });
  });

  // ====================================
  // TAB NAVIGATION SEQUENCE TESTS
  // ====================================
  describe('getNextTab', () => {
    describe('WHEN getting next tab in sequence', () => {
      TestData.tabSequenceTests.forEach(({ current, next }) => {
        it(`should return "${next}" as next tab after "${current}"`, () => {
          // Arrange
          const currentTab = current;

          // Act
          const result = getNextTab(currentTab);

          // Assert
          expect(result).toBe(next);
        });
      });

      it('should cycle back to first tab after last tab', () => {
        // Arrange
        const lastTab: TabType = 'Setting';

        // Act
        const result = getNextTab(lastTab);

        // Assert
        expect(result).toBe('Finance');
      });
    });
  });

  describe('getPreviousTab', () => {
    describe('WHEN getting previous tab in sequence', () => {
      TestData.tabSequenceTests.forEach(({ current, previous }) => {
        it(`should return "${previous}" as previous tab before "${current}"`, () => {
          // Arrange
          const currentTab = current;

          // Act
          const result = getPreviousTab(currentTab);

          // Assert
          expect(result).toBe(previous);
        });
      });

      it('should cycle back to last tab before first tab', () => {
        // Arrange
        const firstTab: TabType = 'Finance';

        // Act
        const result = getPreviousTab(firstTab);

        // Assert
        expect(result).toBe('Setting');
      });
    });
  });

  // ====================================
  // TAB TRANSITION VALIDATION TESTS
  // ====================================
  describe('isValidTabTransition', () => {
    describe('WHEN checking valid tab transitions', () => {
      TestData.validTransitions.forEach(({ from, to }) => {
        it(`should allow transition from "${from}" to "${to}"`, () => {
          // Arrange
          const fromTab = from;
          const toTab = to;

          // Act
          const result = isValidTabTransition(fromTab, toTab);

          // Assert
          expect(result).toBe(true);
        });
      });
    });

    describe('WHEN checking invalid tab transitions', () => {
      it('should reject transition with invalid source tab', () => {
        // Arrange
        const fromTab = 'Invalid' as TabType;
        const toTab: TabType = 'Finance';

        // Act
        const result = isValidTabTransition(fromTab, toTab);

        // Assert
        expect(result).toBe(false);
      });

      it('should reject transition with invalid target tab', () => {
        // Arrange
        const fromTab: TabType = 'Finance';
        const toTab = 'Invalid' as TabType;

        // Act
        const result = isValidTabTransition(fromTab, toTab);

        // Assert
        expect(result).toBe(false);
      });

      it('should reject transition with both invalid tabs', () => {
        // Arrange
        const fromTab = 'Invalid1' as TabType;
        const toTab = 'Invalid2' as TabType;

        // Act
        const result = isValidTabTransition(fromTab, toTab);

        // Assert
        expect(result).toBe(false);
      });
    });
  });

  // ====================================
  // TAB CONFIGURATION TESTS
  // ====================================
  describe('getTabConfig', () => {
    describe('WHEN getting configuration for each tab', () => {
      TestData.validTabs.forEach((tab) => {
        it(`should return correct config for "${tab}" tab`, () => {
          // Arrange
          const inputTab = tab;
          const expectedConfig = TestData.tabConfigExpected[tab];

          // Act
          const result = getTabConfig(inputTab);

          // Assert
          expect(result).toEqual(expectedConfig);
        });
      });
    });

    describe('WHEN validating config structure', () => {
      TestData.validTabs.forEach((tab) => {
        it(`should return config with all required properties for "${tab}"`, () => {
          // Arrange
          const inputTab = tab;

          // Act
          const result = getTabConfig(inputTab);

          // Assert
          expect(result).toHaveProperty('key');
          expect(result).toHaveProperty('title');
          expect(result).toHaveProperty('icon');
          expect(result).toHaveProperty('iconType');
          expect(result).toHaveProperty('testId');
          expect(typeof result.key).toBe('string');
          expect(typeof result.title).toBe('string');
          expect(typeof result.icon).toBe('string');
          expect(typeof result.iconType).toBe('string');
          expect(typeof result.testId).toBe('string');
        });
      });
    });

    describe('WHEN checking unique properties', () => {
      it('should have unique testId for each tab', () => {
        // Arrange
        const allTabs = TestData.validTabs;

        // Act
        const testIds = allTabs.map(tab => getTabConfig(tab).testId);

        // Assert
        const uniqueTestIds = [...new Set(testIds)];
        expect(uniqueTestIds).toHaveLength(testIds.length);
      });

      it('should have unique keys for each tab', () => {
        // Arrange
        const allTabs = TestData.validTabs;

        // Act
        const keys = allTabs.map(tab => getTabConfig(tab).key);

        // Assert
        const uniqueKeys = [...new Set(keys)];
        expect(uniqueKeys).toHaveLength(keys.length);
      });
    });
  });

  // ====================================
  // GET ALL TABS TESTS
  // ====================================
  describe('getAllTabs', () => {
    describe('WHEN getting all available tabs', () => {
      it('should return all tab types in correct order', () => {
        // Arrange
        const expectedTabs: TabType[] = ['Finance', 'Wallet', 'Setting'];

        // Act
        const result = getAllTabs();

        // Assert
        expect(result).toEqual(expectedTabs);
      });

      it('should return array with correct length', () => {
        // Arrange & Act
        const result = getAllTabs();

        // Assert
        expect(result).toHaveLength(3);
      });

      it('should return array with all unique values', () => {
        // Arrange & Act
        const result = getAllTabs();

        // Assert
        const uniqueTabs = [...new Set(result)];
        expect(uniqueTabs).toHaveLength(result.length);
      });

      it('should return immutable array (different reference each call)', () => {
        // Arrange & Act
        const result1 = getAllTabs();
        const result2 = getAllTabs();

        // Assert
        expect(result1).toEqual(result2);
        expect(result1).not.toBe(result2); // Different references
      });
    });
  });

  // ====================================
  // INTEGRATION TESTS
  // ====================================
  describe('Integration Tests', () => {
    describe('WHEN testing complete tab flow', () => {
      it('should navigate through all tabs in sequence', () => {
        // Arrange
        let currentTab: TabType = getDefaultTab();
        const visitedTabs: TabType[] = [currentTab];

        // Act - Navigate through all tabs
        for (let i = 0; i < getAllTabs().length - 1; i++) {
          currentTab = getNextTab(currentTab);
          visitedTabs.push(currentTab);
        }

        // Assert
        expect(visitedTabs).toEqual(['Finance', 'Wallet', 'Setting']);
        expect(getNextTab(currentTab)).toBe('Finance'); // Cycles back
      });

      it('should navigate backwards through all tabs', () => {
        // Arrange
        let currentTab: TabType = getDefaultTab();
        const visitedTabs: TabType[] = [currentTab];

        // Act - Navigate backwards through all tabs
        for (let i = 0; i < getAllTabs().length - 1; i++) {
          currentTab = getPreviousTab(currentTab);
          visitedTabs.push(currentTab);
        }

        // Assert
        expect(visitedTabs).toEqual(['Finance', 'Setting', 'Wallet']);
        expect(getPreviousTab(currentTab)).toBe('Finance'); // Cycles back
      });

      it('should maintain consistency between tab validation and config', () => {
        // Arrange
        const allTabs = getAllTabs();

        // Act & Assert
        allTabs.forEach(tab => {
          expect(isValidTab(tab)).toBe(true);
          expect(getTabConfig(tab)).toBeTruthy();
          expect(getScreenForTab(tab)).toBe(tab);
        });
      });
    });
  });
}); 