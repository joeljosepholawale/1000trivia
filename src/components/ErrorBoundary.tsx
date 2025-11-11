import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/styles/theme';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Note: Sentry integration can be enabled here when setting up error tracking
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    // Reload the app
    // In production, you might want to navigate to home or restart the app
    this.handleReset();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="error-outline" size={80} color={theme.colors.error[500]} />
            </View>

            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              The app encountered an unexpected error. We're working to fix this.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error details (dev mode only):</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorStack}>{this.state.errorInfo.componentStack}</Text>
                )}
              </ScrollView>
            )}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.primaryButton} onPress={this.handleReload}>
                <MaterialIcons name="refresh" size={24} color={theme.colors.white} />
                <Text style={styles.primaryButtonText}>Reload App</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={this.handleReset}>
                <Text style={styles.secondaryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.footer}>
              If the problem persists, please contact support.
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
    padding: theme.spacing[6],
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: theme.spacing[6],
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  message: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[8],
    paddingHorizontal: theme.spacing[4],
  },
  errorDetails: {
    maxHeight: 200,
    width: '100%',
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[6],
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.error[700],
    marginBottom: theme.spacing[2],
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error[600],
    marginBottom: theme.spacing[2],
    fontFamily: 'monospace',
  },
  errorStack: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.gray[600],
    fontFamily: 'monospace',
  },
  actions: {
    width: '100%',
    gap: theme.spacing[3],
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  primaryButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.gray[300],
  },
  secondaryButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  footer: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing[8],
  },
});
