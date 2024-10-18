// SplashScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';

const logoScreen: React.FC<{ onAnimationEnd: () => void }> = ({ onAnimationEnd }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Opacity
  const scaleAnim = useRef(new Animated.Value(0.5)).current; // Scale

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.ease,
        useNativeDriver: true,
      })
    ]).start(() => onAnimationEnd());
  }, [fadeAnim, scaleAnim, onAnimationEnd]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/if.png')} // Path to your logo
        style={[
          styles.logo,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] } // Apply animated opacity and scale
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 350, // Set the final width
    height: 350, // Set the final height
    resizeMode: 'contain',
  },
});

export default logoScreen;

