# FinanceScreen Component

A comprehensive financial dashboard screen for React Native applications using Expo.

## Features

- **User Profile Header**: Displays user information with avatar and greeting
- **Balance Display**: Shows total balance with toggle visibility
- **Income/Expense Tracking**: Visual bar chart representation of financial data
- **Expense Categories**: Interactive pie chart with legend showing expense breakdown
- **Action Buttons**: Quick access buttons for various app features
- **Bottom Navigation**: Tab-based navigation with add button

## Dependencies

This component requires the following dependencies:
- `react-native-svg` (for pie chart visualization)
- Standard React Native components

## Usage

The component is already set up in the app structure:

1. The main screen is accessible via `app/index.tsx`
2. The component is located in `screens/FinanceScreen.tsx`
3. All necessary styling is included inline

## Data Structure

The component uses sample data that can be easily replaced with real data:

```javascript
const userData = {
  name: 'Nguyen Manh Cuong',
  balance: '2,100,000',
  income: '80,000',
  expenses: '1,980,000',
  difference: '-1,900,000'
};

const expenseData = [
  { category: 'Leisure', percentage: 54.55, color: '#FFA726' },
  { category: 'Self-development', percentage: 25.25, color: '#EF5350' },
  // ...more categories
];
```

## Customization

- Colors can be modified in the `styles` object
- Data can be replaced with real API calls
- Components are modular and can be extracted for reuse

## Running the App

```bash
npm start
# or
expo start
``` 