import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertCircle, X } from 'lucide-react-native';
import { useTheme } from '@/utils/useTheme';

export default function ErrorModal({ visible, error, onDismiss }) {
  const { colors, isDark } = useTheme();

  if (!visible || !error) return null;

  const errorStyles = {
    container: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    card: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      maxWidth: '90%',
      borderLeftWidth: 4,
      borderLeftColor: '#EF4444',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#1F2937',
      flex: 1,
      marginLeft: 12,
    },
    message: {
      fontSize: 14,
      color: isDark ? '#E5E7EB' : '#4B5563',
      marginBottom: 8,
      lineHeight: 20,
    },
    detail: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 16,
      fontFamily: 'monospace',
      backgroundColor: isDark ? '#111827' : '#F3F4F6',
      padding: 8,
      borderRadius: 6,
    },
    button: {
      backgroundColor: '#EF4444',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    closeButton: {
      padding: 5,
    },
  };

  const getErrorTitle = (type) => {
    const titles = {
      NETWORK_ERROR: 'Network Error',
      UNAUTHORIZED: 'Session Expired',
      FORBIDDEN: 'Access Denied',
      BAD_REQUEST: 'Invalid Input',
      NOT_FOUND: 'Not Found',
      SERVER_ERROR: 'Server Error',
      PARSE_ERROR: 'Connection Error',
      ERROR: 'Error',
    };
    return titles[type] || 'Error';
  };

  const errorType = error.type || 'ERROR';
  const errorTitle = getErrorTitle(errorType);
  const errorMessage = error.message || 'An unexpected error occurred';
  const errorDetail = error.detail ? JSON.stringify(error.detail, null, 2) : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={errorStyles.container}>
        <View style={errorStyles.card}>
          <View style={errorStyles.header}>
            <AlertCircle size={24} color="#EF4444" />
            <Text style={errorStyles.title}>{errorTitle}</Text>
            <TouchableOpacity
              style={errorStyles.closeButton}
              onPress={onDismiss}
            >
              <X size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          <Text style={errorStyles.message}>{errorMessage}</Text>

          {errorDetail && (
            <Text style={errorStyles.detail}>{errorDetail}</Text>
          )}

          <TouchableOpacity
            style={errorStyles.button}
            onPress={onDismiss}
          >
            <Text style={errorStyles.buttonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
