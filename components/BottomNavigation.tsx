import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Props {
  activeTab: 'Finance' | 'Setting';
  setActiveTab: (tab: 'Finance' | 'Setting') => void;
}

const BottomNavigation: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || (Platform.OS === 'ios' ? 20 : 8) }]}>
      <TouchableOpacity onPress={() => setActiveTab('Finance')} style={styles.tab}>
        <Icon name="home" size={30} style={styles.icon} color={activeTab === 'Finance' ? '#1e90ff' : '#b0b0b0'} />
        <Text style={[styles.text, activeTab === 'Finance' && styles.active]}>Overview</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => {}} style={styles.tab}>
        <Icon2 name="robot" size={28} style={styles.icon} color="#b0b0b0" />
        <Text style={styles.text}>Ai Assistant</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => {}} style={styles.tabCenter}>
        <View style={styles.plusBtn}>
          <Icon name="add" size={32} color="#fff" />
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => {}} style={styles.tab}>
        <Icon name="bar-chart" size={28} style={styles.icon} color="#b0b0b0" />
        <Text style={styles.text}>Report</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setActiveTab('Setting')} style={styles.tab}>
        <Icon name="settings" size={30} style={styles.icon} color={activeTab === 'Setting' ? '#1e90ff' : '#b0b0b0'} />
        <Text style={[styles.text, activeTab === 'Setting' && styles.active]}>Setting</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 100,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabCenter: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  plusBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e90ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: {
    marginBottom: 2,
  },
  text: {
    fontSize: 15,
    color: '#b0b0b0',
    marginTop: 2,
    fontWeight: '400',
  },
  active: {
    color: '#1e90ff',
    fontWeight: 'bold',
  },
});

export default BottomNavigation; 