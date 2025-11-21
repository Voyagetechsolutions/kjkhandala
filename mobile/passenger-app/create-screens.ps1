# PowerShell script to create all screen files

$screens = @(
    "HomeScreen",
    "SearchScreen",
    "TripDetailsScreen",
    "SeatSelectionScreen",
    "PassengerInfoScreen",
    "PaymentScreen",
    "BookingConfirmationScreen",
    "MyTripsScreen",
    "BookingDetailsScreen",
    "ProfileScreen"
)

foreach ($screen in $screens) {
    $content = @"
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function $screen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>$screen</Text>
      <Text style={styles.subtitle}>This screen is ready for implementation</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
"@
    
    $filePath = "src\screens\$screen.tsx"
    Set-Content -Path $filePath -Value $content
    Write-Host "✅ Created $filePath"
}

Write-Host "`n🎉 All screens created successfully!"
Write-Host "`nNext steps:"
Write-Host "1. Run: npm install"
Write-Host "2. Run: npm start"
Write-Host "3. Test the navigation"
