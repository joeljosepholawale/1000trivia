import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const QuizGameplayScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Quiz Gameplay Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
