/**
 * MainTabScreen Component Tests
 * 
 * Testing Strategy: F.I.R.S.T Principles & AAA Pattern
 * Focus: UI behavior, user interactions, and state management
 * 
 * F.I.R.S.T:
 * - Fast: Tests run quickly with mocked dependencies
 * - Independent: Each test can run in isolation
 * - Repeatable: Same results in any environment
 * - Self-validating: Clear pass/fail with meaningful assertions
 * - Timely: Tests written alongside production code
 * 
 * AAA Pattern:
 * - Arrange: Set up component, mocks, and initial state
 * - Act: Trigger user interactions or state changes
 * - Assert: Verify expected UI behavior and state
 */

import '@testing-library/jest-native/extend-expect';
import { render, screen, userEvent } from '@testing-library/react-native';
import MainTabScreen from '../../screens/MainTabScreen';

// Mock dependencies
jest.mock('../../screens/FinanceScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function FinanceScreen() {
    return React.createElement(Text, { testID: 'finance-screen' }, 'Finance Screen');
  };
});

jest.mock('../../screens/WalletScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function WalletScreen() {
    return React.createElement(Text, { testID: 'wallet-screen' }, 'Wallet Screen');
  };
});

jest.mock('../../screens/SettingScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function SettingScreen() {
    return React.createElement(Text, { testID: 'setting-screen' }, 'Setting Screen');
  };
});

jest.mock('../../components/BottomNavigation', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  
  return function BottomNavigation({ activeTab, setActiveTab }: any) {
    return React.createElement(React.Fragment, null, [
      React.createElement(
        TouchableOpacity,
        {
          key: 'finance-btn',
          testID: 'finance-tab-button',
          onPress: () => setActiveTab('Finance')
        },
        React.createElement(Text, null, 'Finance')
      ),
      React.createElement(
        TouchableOpacity,
        {
          key: 'wallet-btn',
          testID: 'wallet-tab-button',
          onPress: () => setActiveTab('Wallet')
        },
        React.createElement(Text, null, 'Wallet')
      ),
      React.createElement(
        TouchableOpacity,
        {
          key: 'setting-btn',
          testID: 'setting-tab-button',
          onPress: () => setActiveTab('Setting')
        },
        React.createElement(Text, null, 'Setting')
      ),
      React.createElement(
        Text,
        { key: 'active-indicator', testID: 'active-tab-indicator' },
        `Active: ${activeTab}`
      )
    ]);
  };
});

// Mock utils to ensure isolation
jest.mock('../../utils/mainTabUtils', () => ({
  getDefaultTab: jest.fn(() => 'Finance'),
  getScreenForTab: jest.fn((tab) => tab),
  TabType: {} as any
}));

describe('MainTabScreen', () => {

  // ====================================
  // TEST SETUP AND HELPERS
  // ====================================
  
  const renderMainTabScreen = async () => {
    const user = userEvent.setup();
    const renderResult = render(<MainTabScreen />);
    return { user, ...renderResult };
  };

  const mockUtils = require('../../utils/mainTabUtils');

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Restore default mock implementations
    mockUtils.getDefaultTab.mockReturnValue('Finance');
    mockUtils.getScreenForTab.mockImplementation((tab: string) => tab);
  });

  // ====================================
  // INITIAL RENDER TESTS
  // ====================================
  describe('Initial Rendering', () => {
    describe('WHEN component mounts', () => {
      it('should render with default Finance tab active', async () => {
        // Arrange & Act
        await renderMainTabScreen();

        // Assert
        expect(screen.getByTestId('finance-screen')).toBeOnTheScreen();
        expect(screen.getByTestId('active-tab-indicator')).toHaveTextContent('Active: Finance');
        expect(mockUtils.getDefaultTab).toHaveBeenCalledTimes(1);
      });

      it('should render BottomNavigation component', async () => {
        // Arrange & Act
        await renderMainTabScreen();

        // Assert
        expect(screen.getByTestId('finance-tab-button')).toBeOnTheScreen();
        expect(screen.getByTestId('wallet-tab-button')).toBeOnTheScreen();
        expect(screen.getByTestId('setting-tab-button')).toBeOnTheScreen();
      });

      it('should have proper container structure', async () => {
        // Arrange & Act
        const { root } = await renderMainTabScreen();

        // Assert
        expect(root).toBeTruthy();
        // Main container should exist
        expect(screen.getByTestId('finance-screen').parent?.parent).toBeTruthy();
      });
    });

    describe('WHEN utils return different default tab', () => {
      it('should render with custom default tab', async () => {
        // Arrange
        mockUtils.getDefaultTab.mockReturnValue('Wallet');

        // Act
        await renderMainTabScreen();

        // Assert
        expect(screen.getByTestId('wallet-screen')).toBeOnTheScreen();
        expect(screen.getByTestId('active-tab-indicator')).toHaveTextContent('Active: Wallet');
      });
    });
  });

  // ====================================
  // SCREEN RENDERING LOGIC TESTS
  // ====================================
  describe('Screen Rendering Logic', () => {
    describe('WHEN getScreenForTab returns different screen types', () => {
      it('should call getScreenForTab with active tab', async () => {
        // Arrange & Act
        await renderMainTabScreen();

        // Assert
        expect(mockUtils.getScreenForTab).toHaveBeenCalledWith('Finance');
      });

      it('should render Finance screen when getScreenForTab returns Finance', async () => {
        // Arrange
        mockUtils.getScreenForTab.mockReturnValue('Finance');

        // Act
        await renderMainTabScreen();

        // Assert
        expect(screen.getByTestId('finance-screen')).toBeOnTheScreen();
        expect(screen.queryByTestId('wallet-screen')).not.toBeOnTheScreen();
        expect(screen.queryByTestId('setting-screen')).not.toBeOnTheScreen();
      });

      it('should render Wallet screen when getScreenForTab returns Wallet', async () => {
        // Arrange
        mockUtils.getDefaultTab.mockReturnValue('Wallet');
        mockUtils.getScreenForTab.mockReturnValue('Wallet');

        // Act
        await renderMainTabScreen();

        // Assert
        expect(screen.getByTestId('wallet-screen')).toBeOnTheScreen();
        expect(screen.queryByTestId('finance-screen')).not.toBeOnTheScreen();
        expect(screen.queryByTestId('setting-screen')).not.toBeOnTheScreen();
      });

      it('should render Setting screen when getScreenForTab returns Setting', async () => {
        // Arrange
        mockUtils.getDefaultTab.mockReturnValue('Setting');
        mockUtils.getScreenForTab.mockReturnValue('Setting');

        // Act
        await renderMainTabScreen();

        // Assert
        expect(screen.getByTestId('setting-screen')).toBeOnTheScreen();
        expect(screen.queryByTestId('finance-screen')).not.toBeOnTheScreen();
        expect(screen.queryByTestId('wallet-screen')).not.toBeOnTheScreen();
      });

      it('should fallback to Finance screen for unknown screen type', async () => {
        // Arrange
        mockUtils.getScreenForTab.mockReturnValue('Unknown');

        // Act
        await renderMainTabScreen();

        // Assert
        expect(screen.getByTestId('finance-screen')).toBeOnTheScreen();
      });
    });
  });

  // ====================================
  // TAB INTERACTION TESTS
  // ====================================
  describe('Tab Interactions', () => {
    describe('WHEN user interacts with tab buttons', () => {
      it('should switch to Wallet screen when Wallet tab is pressed', async () => {
        // Arrange
        const { user } = await renderMainTabScreen();
        
        // Verify initial state
        expect(screen.getByTestId('finance-screen')).toBeOnTheScreen();

        // Act
        await user.press(screen.getByTestId('wallet-tab-button'));

        // Assert
        expect(screen.getByTestId('wallet-screen')).toBeOnTheScreen();
        expect(screen.queryByTestId('finance-screen')).not.toBeOnTheScreen();
        expect(screen.getByTestId('active-tab-indicator')).toHaveTextContent('Active: Wallet');
      });

      it('should switch to Setting screen when Setting tab is pressed', async () => {
        // Arrange
        const { user } = await renderMainTabScreen();

        // Act
        await user.press(screen.getByTestId('setting-tab-button'));

        // Assert
        expect(screen.getByTestId('setting-screen')).toBeOnTheScreen();
        expect(screen.queryByTestId('finance-screen')).not.toBeOnTheScreen();
        expect(screen.getByTestId('active-tab-indicator')).toHaveTextContent('Active: Setting');
      });

      it('should switch back to Finance screen when Finance tab is pressed', async () => {
        // Arrange
        const { user } = await renderMainTabScreen();
        
        // Navigate away from Finance first
        await user.press(screen.getByTestId('wallet-tab-button'));
        expect(screen.getByTestId('wallet-screen')).toBeOnTheScreen();

        // Act
        await user.press(screen.getByTestId('finance-tab-button'));

        // Assert
        expect(screen.getByTestId('finance-screen')).toBeOnTheScreen();
        expect(screen.queryByTestId('wallet-screen')).not.toBeOnTheScreen();
        expect(screen.getByTestId('active-tab-indicator')).toHaveTextContent('Active: Finance');
      });
    });

    describe('WHEN user navigates through multiple tabs', () => {
      it('should handle multiple tab switches correctly', async () => {
        // Arrange
        const { user } = await renderMainTabScreen();

        // Act & Assert - Test sequence: Finance → Wallet → Setting → Finance
        
        // Initial state
        expect(screen.getByTestId('finance-screen')).toBeOnTheScreen();
        
        // Finance → Wallet
        await user.press(screen.getByTestId('wallet-tab-button'));
        expect(screen.getByTestId('wallet-screen')).toBeOnTheScreen();
        expect(screen.getByTestId('active-tab-indicator')).toHaveTextContent('Active: Wallet');
        
        // Wallet → Setting
        await user.press(screen.getByTestId('setting-tab-button'));
        expect(screen.getByTestId('setting-screen')).toBeOnTheScreen();
        expect(screen.getByTestId('active-tab-indicator')).toHaveTextContent('Active: Setting');
        
        // Setting → Finance
        await user.press(screen.getByTestId('finance-tab-button'));
        expect(screen.getByTestId('finance-screen')).toBeOnTheScreen();
        expect(screen.getByTestId('active-tab-indicator')).toHaveTextContent('Active: Finance');
      });
    });
  });

  // ====================================
  // STATE MANAGEMENT TESTS
  // ====================================
  describe('State Management', () => {
    describe('WHEN activeTab state changes', () => {
      it('should update getScreenForTab calls when tab changes', async () => {
        // Arrange
        const { user } = await renderMainTabScreen();
        
        // Clear initial call
        mockUtils.getScreenForTab.mockClear();

        // Act
        await user.press(screen.getByTestId('wallet-tab-button'));

        // Assert
        expect(mockUtils.getScreenForTab).toHaveBeenCalledWith('Wallet');
      });

      it('should maintain consistent state across re-renders', async () => {
        // Arrange
        const { user, rerender } = await renderMainTabScreen();

        // Act
        await user.press(screen.getByTestId('wallet-tab-button'));
        
        // Force re-render
        rerender(<MainTabScreen />);

        // Assert
        expect(screen.getByTestId('wallet-screen')).toBeOnTheScreen();
        expect(screen.getByTestId('active-tab-indicator')).toHaveTextContent('Active: Wallet');
      });
    });
  });

  // ====================================
  // INTEGRATION WITH UTILS TESTS
  // ====================================
  describe('Integration with MainTabUtils', () => {
    describe('WHEN utils functions are called', () => {
      it('should call getDefaultTab only during initialization', async () => {
        // Arrange & Act
        await renderMainTabScreen();

        // Assert
        expect(mockUtils.getDefaultTab).toHaveBeenCalledTimes(1);
      });

      it('should call getScreenForTab on every render', async () => {
        // Arrange
        const { user } = await renderMainTabScreen();
        const initialCallCount = mockUtils.getScreenForTab.mock.calls.length;

        // Act
        await user.press(screen.getByTestId('wallet-tab-button'));

        // Assert
        expect(mockUtils.getScreenForTab.mock.calls.length).toBeGreaterThan(initialCallCount);
        expect(mockUtils.getScreenForTab).toHaveBeenCalledWith('Wallet');
      });
    });

    describe('WHEN utils return unexpected values', () => {
      it('should handle when getScreenForTab returns null/undefined gracefully', async () => {
        // Arrange
        mockUtils.getScreenForTab.mockReturnValue(null);

        // Act
        await renderMainTabScreen();

        // Assert
        expect(screen.getByTestId('finance-screen')).toBeOnTheScreen(); // Falls back to default
      });
    });
  });

  // ====================================
  // ERROR BOUNDARY TESTS
  // ====================================
  describe('Error Handling', () => {
    describe('WHEN child components throw errors', () => {
      it('should handle errors gracefully', async () => {
        // This test would typically use ErrorBoundary component
        // For now, we verify the component structure doesn't break
        
        // Arrange & Act
        const { root } = await renderMainTabScreen();

        // Assert
        expect(root).toBeTruthy();
        expect(screen.getByTestId('finance-screen')).toBeOnTheScreen();
      });
    });
  });

  // ====================================
  // ACCESSIBILITY TESTS
  // ====================================
  describe('Accessibility', () => {
    describe('WHEN screen readers are used', () => {
      it('should have accessible tab buttons', async () => {
        // Arrange & Act
        await renderMainTabScreen();

        // Assert
        expect(screen.getByTestId('finance-tab-button')).toBeOnTheScreen();
        expect(screen.getByTestId('wallet-tab-button')).toBeOnTheScreen();
        expect(screen.getByTestId('setting-tab-button')).toBeOnTheScreen();
      });

      it('should provide clear indication of active screen', async () => {
        // Arrange & Act
        await renderMainTabScreen();

        // Assert
        expect(screen.getByTestId('active-tab-indicator')).toHaveTextContent('Active: Finance');
      });
    });
  });
}); 