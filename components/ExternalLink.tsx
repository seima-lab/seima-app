import { openBrowserAsync } from 'expo-web-browser';
import { type ComponentProps } from 'react';
import { Platform, Text, TouchableOpacity } from 'react-native';

type Props = ComponentProps<typeof TouchableOpacity> & { 
  href: string;
  children: React.ReactNode;
};

export function ExternalLink({ href, children, ...rest }: Props) {
  const handlePress = async () => {
    if (Platform.OS !== 'web') {
      // Open the link in an in-app browser on native
      await openBrowserAsync(href);
    } else {
      // Open in new tab on web
      window.open(href, '_blank');
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} {...rest}>
      {typeof children === 'string' ? <Text>{children}</Text> : children}
    </TouchableOpacity>
  );
}
