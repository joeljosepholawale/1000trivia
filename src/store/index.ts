import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {combineReducers} from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import gameReducer from './slices/gameSlice';
import walletReducer from './slices/walletSlice';
import leaderboardReducer from './slices/leaderboardSlice';
import configReducer from './slices/configSlice';
import adsReducer from './slices/adsSlice';
import userReducer from './slices/userSlice';

const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'config', 'ads'], // Persist auth, config, and ads preferences
};

const rootReducer = combineReducers({
  auth: authReducer,
  game: gameReducer,
  wallet: walletReducer,
  leaderboard: leaderboardReducer,
  config: configReducer,
  ads: adsReducer,
  user: userReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;