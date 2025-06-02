// Simulated API response
export const login = async (): Promise<{ success: boolean; message: string; status: number }> => {
  // Simulate API call with a 400 response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: false,
        message: 'User not found. Please register first.',
        status: 400
      });
    }, 1000);
  });
}; 