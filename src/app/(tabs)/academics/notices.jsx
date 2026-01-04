import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/utils/useTheme";
import GridBackground from "@/components/GridBackground";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import api from "@/utils/api";
import { useAuth } from "@/utils/auth/useAuth";

export default function NoticesScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors } = useTheme();
    const { isErpAuthenticated } = useAuth();

    const [loading, setLoading] = useState(true);
    const [notices, setNotices] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('[Notices] Fetching notifications...');

            if (!isErpAuthenticated) {
                console.log('[Notices] Not connected to College ERP');
                setError("Not connected to College ERP");
                setLoading(false);
                return;
            }

            const data = await api.getNotifications();
            setNotices(data);

        } catch (err) {
            console.error(err);
            setError("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    const handlePress = async (notice) => {
        if (!notice.is_read) {
            try {
                // Optimistic update
                setNotices(prev => prev.map(n => n.id === notice.id ? { ...n, is_read: true } : n));
                await api.markNotificationRead(notice.id);
            } catch (error) {
                console.error("Failed to mark read", error);
            }
        }
        Alert.alert(notice.title, notice.message);
    };

    const handleDelete = async (id) => {
        try {
            // Optimistic update
            setNotices(prev => prev.filter(n => n.id !== id));
            await api.deleteNotification(id);
        } catch (error) {
            console.error("Failed to delete", error);
            fetchNotices(); // Revert on error
        }
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <GridBackground>
            <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Notices</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : error ? (
                    <Text style={{ color: colors.error, textAlign: 'center', marginTop: 20 }}>{error}</Text>
                ) : notices.length === 0 ? (
                    <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>No notifications found.</Text>
                ) : (
                    notices.map(notice => (
                        <TouchableOpacity
                            key={notice.id}
                            onPress={() => handlePress(notice)}
                            style={{
                                backgroundColor: colors.surface,
                                marginBottom: 12,
                                borderRadius: 12,
                                padding: 16,
                                borderLeftWidth: notice.is_read ? 0 : 4,
                                borderLeftColor: colors.primary,
                                flexDirection: 'row',
                                justifyContent: 'space-between'
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: colors.primary + '20' }}>
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>{notice.sender_name || "System"}</Text>
                                    </View>
                                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{formatDate(notice.created_at)}</Text>
                                </View>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>{notice.title}</Text>
                                <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }} numberOfLines={2}>
                                    {notice.message}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => handleDelete(notice.id)}
                                style={{ padding: 8, justifyContent: 'center' }}
                            >
                                <Trash2 size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </GridBackground>
    );
}
