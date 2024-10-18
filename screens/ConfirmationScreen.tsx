import React from 'react';
import { View, Text, Image, Button, StyleSheet, ImageBackground } from 'react-native';


const ConfirmationScreen: React.FC = ({ navigation }) => {
  return (

  <ImageBackground
    source={require('../assets/background_img.jpg')} // Add your image path here
    style={styles.backgroundImage} // Apply background image style
  >
    <View style={styles.container}>
      <Text style={styles.heading}>"Ensure your sensor device position"</Text>
      <Image
        source={require('../assets/sensor.png')} // Replace with your .png file path
        style={styles.image}
      />
      <Button
        title="Confirm"
        onPress={() => navigation.navigate('Bluetooth')} // Replace with the action you want
      />
    </View>
  </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  heading: {
    fontSize: 20.5,
    fontWeight: 'bold',
    marginBottom: 60,
    color: '#7393B3',
  },

  backgroundImage: {
    flex: 1,
    resizeMode: 'cover', // Optional: Adjust the image layout (contain, stretch, etc.)
  },
  
  image: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
});

export default ConfirmationScreen;
