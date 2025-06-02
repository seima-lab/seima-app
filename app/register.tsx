import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LogoWithText from '../components/Login/LogoWithText';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date>(new Date(2000, 0, 1));
  const [hasSelectedDate, setHasSelectedDate] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(dateOfBirth);
  const [gender, setGender] = useState<'male' | 'female' | ''>('');

  const openDatePicker = () => {
    setTempDate(dateOfBirth);
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleConfirmDate = () => {
    setDateOfBirth(tempDate);
    setHasSelectedDate(true);
    setShowDatePicker(false);
  };

  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <LogoWithText />
        <Text style={styles.title}>Create an Account</Text>
        <Text style={styles.subtitle}>Join Seima to manage your finances easily.</Text>
        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#9ca3af"
            value={fullName}
            onChangeText={setFullName}
            accessibilityLabel="Full Name"
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            accessibilityLabel="Email"
          />
          <Text style={styles.label}>Date of Birth</Text>
          <Pressable
            style={[styles.input, { justifyContent: 'center' }]}
            onPress={openDatePicker}
            accessibilityLabel="Date of Birth"
          >
            <Text style={{ color: hasSelectedDate ? '#374151' : '#9ca3af', fontSize: 18 }}>
              {hasSelectedDate ? formatDate(dateOfBirth) : 'Select your birth date'}
            </Text>
          </Pressable>

          {/* Date Picker Modal */}
          <Modal
            visible={showDatePicker}
            transparent
            animationType="fade"
            onRequestClose={handleCancelDate}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  themeVariant="light"
                  style={Platform.OS === 'ios' ? styles.iosDatePicker : undefined}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalButton} onPress={handleCancelDate}>
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleConfirmDate}>
                    <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            <Pressable
              style={[styles.genderButton, gender === 'male' && styles.genderButtonSelected]}
              onPress={() => setGender('male')}
              accessibilityLabel="Male"
            >
              <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextSelected]}>Male</Text>
            </Pressable>
            <Pressable
              style={[styles.genderButton, gender === 'female' && styles.genderButtonSelected]}
              onPress={() => setGender('female')}
              accessibilityLabel="Female"
            >
              <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextSelected]}>Female</Text>
            </Pressable>
          </View>
          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    minHeight: 700,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e90ff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 16,
    color: '#1e90ff',
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 4,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 18,
    color: '#374151',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  genderRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingVertical: 14,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  genderButtonSelected: {
    backgroundColor: '#1e90ff',
    borderColor: '#1e90ff',
  },
  genderButtonText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '500',
  },
  genderButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  registerButton: {
    width: '100%',
    backgroundColor: '#1e90ff',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  registerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 6,
  },
  modalButtonConfirm: {
    backgroundColor: '#1e90ff',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  modalButtonTextConfirm: {
    color: '#fff',
    fontWeight: 'bold',
  },
  iosDatePicker: {
    backgroundColor: '#fff',
    marginVertical: 10,
  },
});