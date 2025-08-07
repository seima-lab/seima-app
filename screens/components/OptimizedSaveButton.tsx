import { memo } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface OptimizedSaveButtonProps {
  onPress: () => void;
  isLoading: boolean;
  disabled?: boolean;
  title: string;
  style?: ViewStyle;
  textStyle?: any;
  loadingColor?: string;
}

const OptimizedSaveButton = memo<OptimizedSaveButtonProps>(({
  onPress,
  isLoading,
  disabled = false,
  title,
  style,
  textStyle,
  loadingColor = '#fff',
}) => {
  const isDisabled = isLoading || disabled;

  return (
    <TouchableOpacity 
      style={[
        style,
        isDisabled && { opacity: 0.6 }
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={loadingColor} />
      ) : (
        <Text style={textStyle}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
});

OptimizedSaveButton.displayName = 'OptimizedSaveButton';

export default OptimizedSaveButton;
