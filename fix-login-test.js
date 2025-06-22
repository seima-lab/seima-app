const fs = require('fs');

// Read the test file
const filePath = '__tests__/screens/LoginScreen.test.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Define replacement mappings
const replacements = [
  // Placeholder text replacements
  ["screen.getByPlaceholderText('Email')", "screen.getByPlaceholderText('placeholders.enterEmail')"],
  ["screen.getByPlaceholderText('Password')", "screen.getByPlaceholderText('placeholders.enterPassword')"],
  
  // Button and link text replacements  
  ["screen.getByText('Sign In')", "screen.getByText('login.signIn')"],
  ["screen.getByText('Sign Up')", "screen.getByText('login.signUp')"],
  ["screen.getByText('Forgot Password?')", "screen.getByText('login.forgotPassword')"],
  
  // Toast message expectations - need to use translation keys
  ["expect(screen.getByTestId('toast-message')).toHaveTextContent('Email is required')", "expect(screen.getByTestId('toast-message')).toHaveTextContent('validation.emailRequired')"],
  ["expect(screen.getByTestId('toast-message')).toHaveTextContent('Invalid email or password')", "expect(screen.getByTestId('toast-message')).toHaveTextContent('login.invalidCredentials')"]
];

// Apply all replacements
replacements.forEach(([from, to]) => {
  content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
});

// Write the fixed content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed LoginScreen.test.tsx selectors');
console.log('📝 Applied replacements:');
replacements.forEach(([from, to], index) => {
  console.log(`${index + 1}. ${from} -> ${to}`);
}); 