import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, Modal, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import COLORS from '../../constants/colors';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  });

  const handleEditProfile = () => {
    setEditForm({
      fullName: (user as any).user_metadata?.full_name || '',
      phone: (user as any).user_metadata?.phone || '',
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: editForm.fullName,
          phone: editForm.phone,
        },
      });

      if (error) throw error;
      Alert.alert('Success', 'Profile updated successfully!');
      setShowEditModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  const handleNotificationToggle = async (type: 'email' | 'push' | 'sms', value: boolean) => {
    setNotifications(prev => ({ ...prev, [type]: value }));
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          notifications: { ...notifications, [type]: value },
        },
      });

      if (error) throw error;
      
      if (value) {
        switch (type) {
          case 'email':
            Alert.alert('Enabled', 'You will receive booking confirmations via email');
            break;
          case 'push':
            Alert.alert('Enabled', 'Push notifications are now enabled');
            break;
          case 'sms':
            Alert.alert('Enabled', 'You will receive SMS notifications');
            break;
        }
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update notification settings');
      setNotifications(prev => ({ ...prev, [type]: !value }));
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-outline" size={64} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Sign In Required</Text>
          <Text style={styles.subtitle}>
            Please sign in to view and manage your profile
          </Text>
          <Button
            title="Sign In"
            onPress={() => navigation.navigate('SignIn' as never)}
            style={styles.signInButton}
          />
          <TouchableOpacity
            onPress={() => navigation.navigate('SignUp' as never)}
            style={styles.signUpLink}
          >
            <Text style={styles.signUpText}>
              Don't have an account? <Text style={styles.signUpTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.name}>{(user as any).user_metadata?.full_name || (user as any).user_metadata?.display_name || user.email?.split('@')[0] || 'User'}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <ScrollView>
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <Ionicons name="person-outline" size={24} color={COLORS.textSecondary} />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowNotifications(true)}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.textSecondary} />
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowHelp(true)}>
            <Ionicons name="help-circle-outline" size={24} color={COLORS.textSecondary} />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.secondary} />
            <Text style={[styles.menuText, styles.signOutText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editForm.fullName}
                onChangeText={(text) => setEditForm({ ...editForm, fullName: text })}
                placeholder="Enter your full name"
              />
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={editForm.phone}
                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
              <Button title="Save Changes" onPress={handleSaveProfile} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={showNotifications} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.notificationItem}>
                <Ionicons name="mail" size={24} color={COLORS.primary} />
                <View style={styles.notificationText}>
                  <Text style={styles.notificationTitle}>Email Notifications</Text>
                  <Text style={styles.notificationDesc}>Receive booking confirmations via email</Text>
                </View>
              </View>
              <View style={styles.notificationItem}>
                <Ionicons name="notifications" size={24} color={COLORS.primary} />
                <View style={styles.notificationText}>
                  <Text style={styles.notificationTitle}>Push Notifications</Text>
                  <Text style={styles.notificationDesc}>Get updates about your trips</Text>
                </View>
              </View>
              <View style={styles.notificationItem}>
                <Ionicons name="chatbubbles" size={24} color={COLORS.primary} />
                <View style={styles.notificationText}>
                  <Text style={styles.notificationTitle}>SMS Notifications</Text>
                  <Text style={styles.notificationDesc}>Receive trip reminders via SMS</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal visible={showHelp} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Help & Support</Text>
              <TouchableOpacity onPress={() => setShowHelp(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <TouchableOpacity style={styles.helpItem}>
                <Ionicons name="call" size={24} color={COLORS.primary} />
                <View style={styles.helpText}>
                  <Text style={styles.helpTitle}>Call Us</Text>
                  <Text style={styles.helpDesc}>+267 123 4567</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.helpItem}>
                <Ionicons name="mail" size={24} color={COLORS.primary} />
                <View style={styles.helpText}>
                  <Text style={styles.helpTitle}>Email Support</Text>
                  <Text style={styles.helpDesc}>support@kjkhandala.com</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.helpItem}>
                <Ionicons name="logo-whatsapp" size={24} color={COLORS.success} />
                <View style={styles.helpText}>
                  <Text style={styles.helpTitle}>WhatsApp</Text>
                  <Text style={styles.helpDesc}>Chat with us on WhatsApp</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.helpItem}>
                <Ionicons name="document-text" size={24} color={COLORS.primary} />
                <View style={styles.helpText}>
                  <Text style={styles.helpTitle}>FAQs</Text>
                  <Text style={styles.helpDesc}>Find answers to common questions</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.gray100,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  signInButton: {
    width: '100%',
    maxWidth: 300,
  },
  signUpLink: {
    marginTop: 16,
  },
  signUpText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  signUpTextBold: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.gray100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  section: {
    marginTop: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  menuText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  signOutText: {
    color: COLORS.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    marginBottom: 12,
  },
  notificationText: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  notificationDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    marginBottom: 12,
  },
  helpText: {
    flex: 1,
    marginLeft: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  helpDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

export default ProfileScreen;
