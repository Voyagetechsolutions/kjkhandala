import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  LoyaltyDashboard, 
  LoyaltyTransaction, 
  LoyaltyRule,
  RedeemPointsResponse 
} from '../../types';

const { width } = Dimensions.get('window');

const LoyaltyScreen = () => {
  const { user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyDashboard | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loyaltyRules, setLoyaltyRules] = useState<LoyaltyRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (user) {
      loadLoyaltyData();
    }
  }, [user]);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Fetch loyalty dashboard data
      const { data: dashboard, error: dashboardError } = await supabase
        .from('loyalty_dashboard')
        .select('*')
        .eq('customer_id', user.id)
        .single();

      if (dashboardError && dashboardError.code !== 'PGRST116') {
        console.error('Error fetching loyalty dashboard:', dashboardError);
      }

      if (dashboard) {
        setLoyaltyData(dashboard);

        // Fetch recent transactions only if we have a dashboard ID
        const { data: txns, error: txnsError } = await supabase
          .from('loyalty_transactions')
          .select('*')
          .eq('account_id', dashboard.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (txnsError) {
          console.error('Error fetching transactions:', txnsError);
        } else {
          setTransactions(txns || []);
        }
      }

      // Fetch loyalty rules
      const { data: rules, error: rulesError } = await supabase
        .from('loyalty_rules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (rulesError && rulesError.code !== 'PGRST116') {
        console.error('Error fetching loyalty rules:', rulesError);
      } else if (rules) {
        setLoyaltyRules(rules);
      }

    } catch (error) {
      console.error('Error loading loyalty data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLoyaltyData();
  };

  const handleRedeemPoints = async () => {
    const points = parseInt(pointsToRedeem);
    
    if (!points || points <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid number of points');
      return;
    }

    if (!loyaltyData || points > loyaltyData.total_points) {
      Alert.alert('Insufficient Points', 'You do not have enough points to redeem');
      return;
    }

    try {
      setRedeeming(true);
      
      const { data, error } = await supabase.rpc('redeem_loyalty_points', {
        p_customer_id: user?.id,
        p_points_to_redeem: points,
        p_description: `Redeemed ${points} points for discount`
      });

      if (error) throw error;

      const result = data as RedeemPointsResponse;

      if (result.success) {
        Alert.alert(
          'Success!',
          `You redeemed ${result.points_redeemed} points for P${result.discount_amount?.toFixed(2)} discount!\n\nRemaining points: ${result.remaining_points}`,
          [{ text: 'OK', onPress: () => {
            setRedeemModalVisible(false);
            setPointsToRedeem('');
            loadLoyaltyData();
          }}]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to redeem points');
      }
    } catch (error: any) {
      console.error('Error redeeming points:', error);
      Alert.alert('Error', error.message || 'Failed to redeem points');
    } finally {
      setRedeeming(false);
    }
  };

  const getTierColor = (tier: string): [string, string] => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return ['#e0e7ff', '#c7d2fe'];
      case 'gold':
        return ['#fef3c7', '#fde68a'];
      case 'silver':
        return ['#e5e7eb', '#d1d5db'];
      default:
        return ['#e5e7eb', '#d1d5db'];
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return 'diamond';
      case 'gold':
        return 'trophy';
      case 'silver':
        return 'medal';
      default:
        return 'medal';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading loyalty data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="card-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyText}>
            Please sign in to view your loyalty card and points.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!loyaltyData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="card-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Loyalty Data</Text>
          <Text style={styles.emptyText}>
            Start booking to earn loyalty points and rewards!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Loyalty Rewards</Text>
          <Text style={styles.headerSubtitle}>
            Earn points with every booking
          </Text>
        </View>

        {/* Loyalty Card */}
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={getTierColor(loyaltyData.tier)}
            style={styles.loyaltyCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>KJ Khandala</Text>
                <Text style={styles.cardSubtitle}>Loyalty Member</Text>
              </View>
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={`LOYALTY:${loyaltyData.customer_id}`}
                  size={60}
                  backgroundColor="transparent"
                  color="#111827"
                />
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.pointsContainer}>
                <Text style={styles.pointsLabel}>Total Points</Text>
                <Text style={styles.pointsValue}>{loyaltyData.total_points}</Text>
              </View>

              <View style={styles.tierBadge}>
                <Ionicons
                  name={getTierIcon(loyaltyData.tier) as any}
                  size={16}
                  color="#111827"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.tierText}>{loyaltyData.tier.toUpperCase()} TIER</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.memberName}>{loyaltyData.customer_name || user?.email}</Text>
              <Text style={styles.memberSince}>
                Member since {formatDate(loyaltyData.member_since)}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Progress to Next Tier */}
        {loyaltyData.points_to_next_tier > 0 && loyaltyData.tier !== 'platinum' && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>
                Progress to {loyaltyData.next_tier.toUpperCase()} Tier
              </Text>
              <Text style={styles.progressPoints}>
                {loyaltyData.points_to_next_tier} points to go
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.max(0, Math.min(100, 
                      ((loyaltyData.lifetime_points / 
                        (loyaltyData.tier === 'silver' ? 500 : 2000)) * 100)
                    ))}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Redeem Points Button */}
        <View style={styles.redeemCard}>
          <View style={styles.redeemHeader}>
            <View>
              <Text style={styles.redeemTitle}>Redeem Points</Text>
              <Text style={styles.redeemSubtitle}>
                {loyaltyRules 
                  ? `${loyaltyRules.points_per_pula} points = P1 | 1 point = P${loyaltyRules.redemption_rate}`
                  : '10 points = P1 | 1 point = P0.05'
                }
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.redeemButton}
            onPress={() => setRedeemModalVisible(true)}
          >
            <Ionicons name="gift" size={20} color="#fff" />
            <Text style={styles.redeemButtonText}>Redeem Now</Text>
          </TouchableOpacity>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.sectionTitle}>Your Benefits</Text>
          <View style={styles.benefitsList}>
            {loyaltyRules?.tier_rules[loyaltyData.tier]?.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.historyCard}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyHistoryText}>No transactions yet</Text>
              <Text style={styles.emptyHistorySubtext}>
                Start booking to earn points!
              </Text>
            </View>
          ) : (
            <View style={styles.bookingsList}>
              {transactions.map((txn) => (
                <View key={txn.id} style={styles.bookingItem}>
                  <View style={[
                    styles.bookingIcon,
                    { backgroundColor: txn.type === 'earn' ? '#dbeafe' : '#fee2e2' }
                  ]}>
                    <Ionicons 
                      name={txn.type === 'earn' ? 'add-circle' : 'remove-circle'} 
                      size={20} 
                      color={txn.type === 'earn' ? '#2563eb' : '#dc2626'} 
                    />
                  </View>
                  <View style={styles.bookingDetails}>
                    <Text style={styles.bookingRoute}>
                      {txn.description}
                    </Text>
                    <Text style={styles.bookingDate}>
                      {formatDate(txn.created_at)}
                    </Text>
                  </View>
                  <View style={styles.bookingPoints}>
                    <Text style={[
                      styles.pointsEarned,
                      { color: txn.type === 'earn' ? '#10b981' : '#dc2626' }
                    ]}>
                      {txn.type === 'earn' ? '+' : ''}{txn.points}
                    </Text>
                    <Ionicons name="star" size={16} color="#fbbf24" />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Redeem Modal */}
      <Modal
        visible={redeemModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRedeemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Redeem Points</Text>
              <TouchableOpacity onPress={() => setRedeemModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Available Points</Text>
              <Text style={styles.modalPoints}>{loyaltyData.total_points}</Text>

              <Text style={[styles.modalLabel, { marginTop: 20 }]}>
                Points to Redeem
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter points"
                keyboardType="numeric"
                value={pointsToRedeem}
                onChangeText={setPointsToRedeem}
              />

              {pointsToRedeem && loyaltyRules && (
                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoText}>
                    Discount: P{(parseInt(pointsToRedeem) * loyaltyRules.redemption_rate).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setRedeemModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleRedeemPoints}
                disabled={redeeming}
              >
                {redeeming ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextConfirm}>Redeem</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  cardContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  loyaltyCard: {
    borderRadius: 20,
    padding: 24,
    minHeight: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  pointsContainer: {
    marginBottom: 16,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111827',
  },
  tierBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  qrCodeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 12,
  },
  memberSince: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  cardFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  memberName: {
    fontSize: 12,
    color: '#374151',
  },
  progressCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  progressPoints: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  benefitsCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  historyCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  bookingsList: {
    gap: 12,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingDetails: {
    flex: 1,
    marginLeft: 12,
  },
  bookingRoute: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  bookingDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  bookingPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsEarned: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  redeemCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  redeemHeader: {
    marginBottom: 16,
  },
  redeemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  redeemSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  redeemButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  redeemButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  modalPoints: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  modalInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
  },
  modalInfoText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonConfirm: {
    backgroundColor: '#2563eb',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default LoyaltyScreen;
