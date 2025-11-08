import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {StripeProvider} from '@stripe/stripe-react-native';
import {StatusBar} from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold} from '@expo-google-fonts/manrope';

import {store, persistor} from '@/store';
import {AppNavigator} from '@/navigation/AppNavigator';
import {LoadingScreen} from '@/components/LoadingScreen';
import {AnimatedSplashScreen} from '@/components/SplashScreen';
import {ErrorBoundary} from '@/components/ErrorBoundary';
import {ThemeProvider, useTheme} from '@/contexts/ThemeContext';
import {useNotifications} from '@/hooks/useNotifications';
import {config} from '@/config';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@/store';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const AppContent = () => {
  const { isDark } = useTheme();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Setup push notifications with auto-navigation
  useNotifications({
    enableAutoNavigation: true,
    onTokenReceived: (token) => {
      console.log('Push token received:', token.token);
      // TODO: Send token to backend when user is authenticated
      if (isAuthenticated) {
        // await api.updatePushToken(token.token);
      }
    },
    onNotificationReceived: (notification) => {
      console.log('Notification received while app open:', notification);
    },
    onNotificationTapped: (response) => {
      console.log('User tapped notification:', response.notification.request.content.data);
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
  
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    const init = async () => {
      if (!fontsLoaded) return;
      
      // Show custom splash for 2.5 seconds
      setTimeout(() => {
        setShowSplash(false);
      }, 2500);
      
      // Hide the native splash screen
      await SplashScreen.hideAsync();
    };

    init();
  }, [fontsLoaded]);

  if (!fontsLoaded || showSplash) {
    return <AnimatedSplashScreen />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{flex: 1}}>
        <Provider store={store}>
          <PersistGate loading={<LoadingScreen />} persistor={persistor}>
            <ThemeProvider>
              <AppContent />
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default App;