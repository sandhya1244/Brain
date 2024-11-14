import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, Text, View, Alert, StyleSheet, Image } from 'react-native';
import HistoryScreen from './screens/history';
import DetailsScreen from './screens/DetailsScreen';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/Settings';
import PostDetails from './screens/PostDetails';
import SplashScreen from './screens/logoScreen';
import ProfileCreationScreen from './screens/ProfileCreationScreen';
import ActivityCard from './screens/kuchvi';


const Stack = createStackNavigator();

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <SplashScreen onAnimationEnd={() => setIsLoading(false)} />;
  }

  // Custom header component with back button, download, and share icons
  const renderHeader = (navigation: any, onExportPDF: () => void, onSharePDF: () => void) => (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backButton}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>History</Text>
      <View style={styles.iconContainer}>
        {/* Download Icon */}
        <TouchableOpacity
          onPress={onExportPDF}
          style={styles.iconButton}
        >
          <Image 
            source={require('./assets/icons/downloading.png')} 
            style={styles.icon} 
          />
        </TouchableOpacity>
        {/* Share Icon */}
        <TouchableOpacity
          onPress={onSharePDF}
          style={styles.iconButton}
        >
          <Image 
            source={require('./assets/icons/share.png')} 
            style={styles.icon} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="HomeScreen" screenOptions={{ headerShown: true }}>
      <Stack.Screen
          name="History"
          options={({ navigation }) => ({
            header: () =>
              renderHeader(navigation, () => {
                Alert.alert('Export Options', 'Do you want to export to PDF?', [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Download',
                    onPress: () => {
                      navigation.navigate('History', { callExport: true }); // Pass to HistoryScreen
                    },
                  },
                ]);
              }, () => {
                // Pass onSharePDF from HistoryScreen
                navigation.navigate('History', { callShare: true });
              }),
          })}
        >
          {(props) => <HistoryScreen {...props} />}

        </Stack.Screen>
        <Stack.Screen 
          name="Details" 
          component={DetailsScreen} 
          options={{ headerTitle: "Details" }} 
        />
        <Stack.Screen 
          name="HomeScreen" 
          component={HomeScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PostDetails" 
          component={PostDetails} 
          options={{ headerTitle: "Post Details" }}
        />
        <Stack.Screen 
          name="ProfileCreationScreen" 
          component={ProfileCreationScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ActivityCard" 
          component={ActivityCard} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ headerTitle: "Settings" }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
    elevation: 5, // Android shadow
    shadowOpacity: 0.1, // iOS shadow effect
  },
  backButton: {
    fontSize: 33,
    fontWeight: 'bold',
    color: '#000',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  iconContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 20,
    padding: 5,
    borderRadius: 25, // To make it round
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Subtle background for touch feedback
  },
  icon: {
    width: 17,
    height: 17,
  },
});

export default App;
