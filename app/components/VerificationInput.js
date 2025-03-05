import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';

const VerificationInput = ({ onCodeComplete, disabled = false }) => {
  const [code, setCode] = useState(['', '', '', '']);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Initialize refs array
    inputRefs.current = inputRefs.current.slice(0, 4);
  }, []);

  const handleCodeChange = (text, index) => {
    // Only allow numbers
    if (!/^\d*$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // If a number is entered, move to next input
    if (text.length === 1 && index < 3) {
      inputRefs.current[index + 1].focus();
    }

    // If all fields are filled, call onCodeComplete
    if (newCode.every(digit => digit.length === 1)) {
      onCodeComplete(newCode.join(''));
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && index > 0 && !code[index]) {
      inputRefs.current[index - 1].focus();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3].map((index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          style={[
            styles.input,
            code[index] ? styles.inputFilled : null,
            disabled ? styles.inputDisabled : null,
          ]}
          maxLength={1}
          keyboardType="number-pad"
          onChangeText={(text) => handleCodeChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          value={code[index]}
          editable={!disabled}
          selectTextOnFocus
          {...Platform.select({
            ios: {
              selectionColor: '#FF6B6B',
            },
            android: {
              underlineColorAndroid: 'transparent',
            },
          })}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  input: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#f2f2f7',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#2A363B',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputFilled: {
    backgroundColor: '#FFE8E8',
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  inputDisabled: {
    opacity: 0.7,
  },
});

export default VerificationInput; 