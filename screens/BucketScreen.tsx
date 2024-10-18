import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const BucketScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <ImageBackground 
      source={require('../assets/background_img.jpg')} // Replace with your background image path
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <Text style={styles.heading}>"Please choose appropriate process"</Text>

        <View style={styles.bucketContainer}>
          <TouchableOpacity style={styles.bucket} onPress={() => navigation.navigate('ConfirmationScreen')}>
            <Image 
              source={require('../assets/sensor.png')} 
              style={styles.bucketImage} 
            />
          </TouchableOpacity>
          <Text style={styles.bucketText}>Automatic Process</Text>
        </View>

        <View style={styles.bucketContainer}>
          <TouchableOpacity style={styles.bucket} onPress={() => navigation.navigate('HomeScreen')}>
            <Image 
              source={require('../assets/sensor1.png')} 
              style={styles.bucketImage} 
            />
          </TouchableOpacity>
          <Text style={styles.bucketText}>Manual Process</Text>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover', // Ensures the image covers the entire screen
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    //backgroundColor: 'rgba(249, 249, 249, 0.4)',
    // Semi-transparent background over the image
  },

  heading: {
    fontSize: 15,
    fontWeight: 'normal',
    color: '#7393B3',
    marginBottom: 20, // Add space between the heading and buckets
    textAlign: 'center',
  },

  bucketContainer: {
    alignItems: 'center',
    marginVertical: 20, // Add vertical spacing between rows
  },
  bucket: {
    width: Dimensions.get('window').width * 0.3, // Adjusted width to fit within the screen
    height: 120,
    backgroundColor: '#7393B3',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden', // Ensure the image stays within bounds
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  bucketImage: {
    flex: 1, // Allow image to fill the bucket
    width: '100%', // Maintain full width
    height: '100%', // Maintain full height
    resizeMode: 'cover', // Cover the entire area while maintaining aspect ratio
  },
  bucketText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#7393B3',
    marginTop: 10, // Add space between the bucket and text
  },
});

export default BucketScreen;
