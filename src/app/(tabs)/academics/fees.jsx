import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/utils/useTheme";
import GridBackground from "@/components/GridBackground";
import { ArrowLeft, AlertTriangle } from "lucide-react-native";
import api from "@/utils/api";
import { useAuth } from "@/utils/auth/useAuth";

export default function FeesOverviewScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors } = useTheme();
    const { user, isErpAuthenticated } = useAuth();

    const [loading, setLoading] = useState(true);
    const [feeStatus, setFeeStatus] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchFees();
    }, []);

    const fetchFees = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('[Fees] Fetching fee status...');

            if (!isErpAuthenticated) {
                console.log('[Fees] Not connected to College ERP');
                setError("Not connected to College ERP");
                setLoading(false);
                return;
            }

            // 1. Find Student ID
            const students = await api.getStudents();
            const myStudent = students.find(s => s.user.id === user?.id);

            if (!myStudent) {
                setError("Student profile not found.");
                setLoading(false);
                return;
            }

            // 2. Fetch Fees Status and History
            const [statusData, historyData] = await Promise.all([
                api.getStudentFees(myStudent.id),
                api.getStudentFeeHistory(myStudent.id)
            ]);

            setFeeStatus(statusData);
            setHistory(historyData);

        } catch (err) {
            console.error(err);
            setError("Failed to load fees data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <GridBackground>
            <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Fees</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : error ? (
                    <Text style={{ color: colors.error, textAlign: 'center', marginTop: 20 }}>{error}</Text>
                ) : (
                    <>
                        {/* Summary Card */}
                        <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 24, elevation: 4 }}>
                            <Text style={{ fontSize: 14, color: colors.textSecondary }}>Total Pending</Text>
                            <Text style={{ fontSize: 32, fontWeight: 'bold', color: (feeStatus?.total_due > 0) ? colors.error : colors.success, marginVertical: 8 }}>
                                ₹{feeStatus?.total_due || 0}
                            </Text>
                            {feeStatus?.total_due > 0 ? (
                                <View style={{ backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                                    <AlertTriangle size={16} color="#DC2626" style={{ marginRight: 8 }} />
                                    <Text style={{ fontSize: 12, color: "#DC2626" }}>You have outstanding dues.</Text>
                                </View>
                            ) : (
                                <View style={{ backgroundColor: '#ECFDF5', padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 12, color: "#059669" }}>All fees paid!</Text>
                                </View>
                            )}
                        </View>

                        {/* Pending Dues (Derived from total) */}
                        {feeStatus?.total_due > 0 && (
                            <>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>Pending Dues</Text>
                                <View style={{ backgroundColor: colors.surface, marginBottom: 12, borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#DC2626' }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Outstanding Balance</Text>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>₹{feeStatus.total_due}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={{ fontSize: 13, color: colors.textSecondary }}>Status: {feeStatus.status}</Text>
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#DC2626' }}>OVERDUE</Text>
                                    </View>
                                </View>
                            </>
                        )}

                        {/* History */}
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16, marginTop: 12 }}>History</Text>

                        {history.length === 0 ? (
                            <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>No payment history found.</Text>
                        ) : (
                            history.map(item => (
                                <View key={item.id} style={{ backgroundColor: colors.surface, marginBottom: 12, borderRadius: 12, padding: 16, opacity: 0.8 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text }}>Transaction #{item.transaction_id || item.id}</Text>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>₹{item.amount}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={{ fontSize: 13, color: colors.textSecondary }}>Paid: {item.payment_date} via {item.payment_method}</Text>
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#10B981' }}>{item.status.toUpperCase()}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </>
                )}
            </ScrollView>
        </GridBackground>
    );
}
