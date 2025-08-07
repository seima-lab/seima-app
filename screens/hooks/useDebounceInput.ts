import { useCallback, useEffect, useRef, useState } from 'react';

interface UseDebounceInputProps {
  initialValue: string;
  delay?: number;
  formatValue?: (value: string) => string;
}

export const useDebounceInput = ({
  initialValue,
  delay = 300,
  formatValue,
}: UseDebounceInputProps) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback((newValue: string) => {
    // Apply formatting if provided
    const formattedValue = formatValue ? formatValue(newValue) : newValue;
    setValue(formattedValue);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced value
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(formattedValue);
    }, delay);
  }, [formatValue, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Update initial value when it changes
  useEffect(() => {
    setValue(initialValue);
    setDebouncedValue(initialValue);
  }, [initialValue]);

  return {
    value,
    debouncedValue,
    handleChange,
    setValue,
  };
};
