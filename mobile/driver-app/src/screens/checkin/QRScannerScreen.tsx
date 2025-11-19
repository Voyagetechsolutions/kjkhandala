import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Vibration } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { checkinService } from '../../services/checkinService';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { COLORS, SPACING, TYPOGRAPHY } from '../../lib/constants';

export default function QRScannerScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { driver } = useAuth();
  const { tripId } = route.params as { tripId: string };
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing || !driver?.id) return;

    setScanned(true);
    setProcessing(true);

    try {
      // QR format: VOYAGE-{booking_id}-{ticket_number}
      const parts = data.split('-');
      if (parts.length !== 3 || parts[0] !== 'VOYAGE') {
        throw new Error('Invalid QR code format');
      }

      const bookingId = parts[1];

      // Check in passenger
      await checkinService.checkInPassengerQR(bookingId, tripId, driver.id);

      // Success feedback
      Vibration.vibrate(200);
      Alert.alert(
        'Success!',
        'Passenger checked in successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              setProcessing(false);
            },
          },
          {
            text: 'Back to Manifest',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Vibration.vibrate([100, 50, 100]);
      Alert.alert(
        'Error',
        error.message || 'Failed to check in passenger',
        [
          {
            text: 'Try Again',
            onPress: () => {
              setScanned(false);
              setProcessing(false);
            },
          },
        ]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Card style={styles.errorCard}>
          <Ionicons name="camera-off" size={64} color={COLORS.danger} />
          <Text style={styles.errorTitle}>Camera Access Denied</Text>
          <Text style={styles.errorText}>
            Please enable camera permissions in your device settings to scan QR codes.
          </Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.button}
          />
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.topOverlay} />
          <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <View style={styles.sideOverlay} />
          </View>
          <View style={styles.bottomOverlay}>
            <Text style={styles.instruction}>
              {processing
                ? 'Processing...'
                : 'Align QR code within the frame'}
            </Text>
            <Button
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  middleRow: {
    flexDirection: 'row',
    height: 300,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanArea: {
    width: 300,
    height: 300,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.white,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  instruction: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderColor: COLORS.white,
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  errorCard: {
    margin: SPACING.xl,
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  button: {
    minWidth: 200,
  },
});
