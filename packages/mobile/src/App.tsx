import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {StripeProvider} from '@stripe/stripe-react-native';
import {StatusBar} from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import {store, persistor} from '@/store';
import {AppNavigator} from '@/navigation/AppNavigator';
import {LoadingScreen} from '@/components/LoadingScreen';
import {AnimatedSplashScreen} from '@/components/SplashScreen';
import {ThemeProvider, useTheme} from '@/contexts/ThemeContext';
import {useNotifications} from '@/hooks/useNotifications';
import {config} from '@/config';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const AppContent = () => {
  const { isDark } = useTheme();

  // Setup push notifications
  useNotifications({
    onTokenReceived: (token) => {
      console.log('Push token received:', token.token);
      // TODO: Send to backend
    },
    onNotificationTapped: (response) => {
      console.log('Notification tapped:', response.notification.request.content.data);
      // TODO: Navigate based on notification type
    },
  });

  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={config.stripe.publishableKey}>
        <NavigationContainer>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <AppNavigator />
        </NavigationContainer>
      </StripeProvider>
    </SafeAreaProvider>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = React.useState(true);

  useEffect(() => {
    const init = async () => {
      // Show custom splash for 2.5 seconds
      setTimeout(() => {
        setShowSplash(false);
      }, 2500);
      
      // Hide the native splash screen
      await SplashScreen.hideAsync();
    };

    init();
  }, []);

  if (showSplash) {
    return <AnimatedSplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Provider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;