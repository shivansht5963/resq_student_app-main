import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
    Shield,
    Calendar,
    CreditCard,
    Bell,
    CheckCircle2,
    GraduationCap
} from "lucide-react-native";
import { useTheme } from "@/utils/useTheme";
import GridBackground from "@/components/GridBackground";
import Svg, { Circle } from "react-native-svg";
import { useApp } from "@/context/AppContext";
import SOSButton from "@/components/SOSButton"; // Import SOS Button
import ErrorModal from "@/components/ErrorModal"; // Import Error Modal
import api from "@/utils/api";
import { useAuth } from "@/utils/auth/useAuth";

// Simple Circular Progress Component
const CircularProgress = ({ value, radius = 30, strokeWidth = 6, color }) => {
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
        <View style={{ width: radius * 2 + strokeWidth, height: radius * 2 + strokeWidth, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth}>
                <Circle
                    cx={radius + strokeWidth / 2}
                    cy={radius + strokeWidth / 2}
                    r={radius}
                    stroke="#E5E7EB"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                <Circle
                    cx={radius + strokeWidth / 2}
                    cy={radius + strokeWidth / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${radius + strokeWidth / 2}, ${radius + strokeWidth / 2}`}
                />
            </Svg>
            <Text style={{ position: 'absolute', fontSize: 12, fontWeight: 'bold', color: color }}>
                {Math.round(value)}%
            </Text>
        </View>
    );
};

export default function StudentHomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const { sendSOSAlert } = useApp(); // Used for SOS
    const { user, isErpAuthenticated } = useAuth();

    // State for SOS Error Modal
    const [sosError, setSOSError] = useState(null);
    const [showErrorModal, setShowErrorModal] = useState(false);

    // Dashboard Data State
    const [loading, setLoading] = useState(true);
    const [overallAttendance, setOverallAttendance] = useState(0);
    const [recentResult, setRecentResult] = useState(null);
    const [feesDue, setFeesDue] = useState(0);
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
        if (isErpAuthenticated) {
            fetchDashboardData();
        } else {
            setLoading(false);
        }
    }, [isErpAuthenticated]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Get Student ID
            const students = await api.getStudents();
            const myStudent = students.find(s => s.user.id === user?.id);

            // Fetch Notifications
            try {
                const notices = await api.getNotifications();
                setNotificationCount(notices.filter(n => !n.is_read).length);
            } catch (e) {
                console.log("Failed to fetch notifications", e);
            }

            if (!myStudent) {
                setLoading(false);
                return;
            }

            // 2. Fetch Detailed Data
            const [attendanceRes, marksRes, feesRes] = await Promise.all([
                api.getStudentAttendance(myStudent.id),
                api.getStudentMarks(myStudent.id),
                api.getStudentFees(myStudent.id)
            ]);

            // --- Process Attendance ---
            const subjectsMap = {};
            attendanceRes.forEach(record => {
                const subject = record.subject_name;
                if (!subjectsMap[subject]) {
                    subjectsMap[subject] = { held: 0, attended: 0 };
                }

                const held = record.classes_held || 1;
                const isPresent = record.status === true || record.status === 'PRESENT' || record.status === 'Present';
                const attended = record.classes_attended || (isPresent ? held : 0);

                subjectsMap[subject].held += held;
                subjectsMap[subject].attended += attended;
            });

            let totalClasses = 0;
            let totalAttended = 0;
            Object.values(subjectsMap).forEach(sub => {
                totalClasses += sub.held;
                totalAttended += sub.attended;
            });

            setOverallAttendance(totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100));

            // --- Process Marks (Most Recent) ---
            if (marksRes && marksRes.length > 0) {
                const sortedMarks = [...marksRes].sort((a, b) => b.id - a.id);
                const latest = sortedMarks[0];
                const obtained = latest.total_marks || ((latest.internal_marks || 0) + (latest.semester_marks || 0));

                setRecentResult({
                    subject: latest.subject_name,
                    score: obtained
                });
            }

            // --- Process Fees ---
            if (feesRes) {
                setFeesDue(feesRes.total_due || 0);
            }

        } catch (error) {
            console.error("Home dashboard fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    // SOS Trigger Handler
    const handleSOSTrigger = () => {
        try {
            sendSOSAlert();
            router.push("/sos-alert");
        } catch (error) {
            console.error('SOS trigger error:', error);
            setSOSError({
                status: error.status || 500,
                message: 'Failed to trigger SOS alert',
                type: error.type || 'ERROR',
                detail: error.detail,
            });
            setShowErrorModal(true);
        }
    };

    return (
        <GridBackground>
            <StatusBar style={isDark ? "light" : "dark"} />
            <ScrollView
                contentContainerStyle={{
                    paddingTop: insets.top + 20,
                    paddingBottom: insets.bottom + 100, // Space for bottom tabs
                    paddingHorizontal: 20,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header - Welcome */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <View>
                        <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.text }}>
                            Hi, {user?.name || "Student"}
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                            {user?.course || "Computer Science"} • Sem {user?.semester || 5}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: colors.surface,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: colors.border
                        }}
                        onPress={() => router.push("/(tabs)/academics/notices")}
                    >
                        <Bell size={20} color={colors.text} />
                        {notificationCount > 0 && (
                            <View style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: '#EF4444'
                            }} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* 1. Safety Status Strip */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDark ? '#1F2937' : '#F0FDF4',
                    padding: 12,
                    borderRadius: 12,
                    marginBottom: 24,
                    borderLeftWidth: 4,
                    borderLeftColor: '#22C55E'
                }}>
                    <Shield size={20} color="#22C55E" fill="#22C55E" style={{ opacity: 0.2 }} />
                    <View style={{ marginLeft: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#E5E7EB' : '#166534' }}>
                            Campus Safety Active
                        </Text>
                        <Text style={{ fontSize: 12, color: isDark ? '#9CA3AF' : '#15803D' }}>
                            You are connected to the security network.
                        </Text>
                    </View>
                </View>

                {/* 2. SOS Button (Prominent) */}
                <View
                    style={{
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 40, // Spacing before academic section
                    }}
                >
                    <SOSButton onSOSTrigger={handleSOSTrigger} />
                </View>

                {/* 3. Academic Overview Section (Moved to Bottom) */}
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
                    Academic Overview
                </Text>

                {loading ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 20 }} />
                ) : (
                    <>
                        {/* Cards Row 1: Attendance & Exams */}
                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                            {/* Attendance Card */}
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: colors.surface,
                                    padding: 16,
                                    borderRadius: 16,
                                    shadowColor: '#000',
                                    shadowOpacity: 0.05,
                                    shadowRadius: 10,
                                    elevation: 2
                                }}
                                onPress={() => router.push("/(tabs)/academics/attendance")}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>Attendance</Text>
                                    <CheckCircle2 size={16} color={colors.success} />
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <CircularProgress value={overallAttendance} color={overallAttendance > 75 ? "#22C55E" : "#EAB308"} />
                                    <View>
                                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>Total</Text>
                                        <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text }}>Present</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* Exams/Results Card */}
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: colors.surface,
                                    padding: 16,
                                    borderRadius: 16,
                                    shadowColor: '#000',
                                    shadowOpacity: 0.05,
                                    shadowRadius: 10,
                                    elevation: 2
                                }}
                                onPress={() => router.push("/(tabs)/academics/exams")}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>Recent Result</Text>
                                    <GraduationCap size={16} color={colors.primary} />
                                </View>
                                {recentResult ? (
                                    <>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }} numberOfLines={1}>
                                            {recentResult.subject}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                                            Score: {recentResult.score} / 100
                                        </Text>
                                    </>
                                ) : (
                                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>No recent results</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Cards Row 2: Fees & Notices */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {/* Fees Card */}
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: colors.surface,
                                    padding: 16,
                                    borderRadius: 16,
                                    shadowColor: '#000',
                                    shadowOpacity: 0.05,
                                    shadowRadius: 10,
                                    elevation: 2
                                }}
                                onPress={() => router.push("/(tabs)/academics/fees")}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>Fees Due</Text>
                                    <CreditCard size={16} color={feesDue > 0 ? colors.error : colors.success} />
                                </View>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: feesDue > 0 ? colors.error : colors.success }}>
                                    {feesDue > 0 ? `₹${feesDue.toLocaleString()}` : "Paid"}
                                </Text>
                                {feesDue > 0 && (
                                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                                        Outstanding
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Notices / Quick Link */}
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    backgroundColor: colors.primaryLight,
                                    padding: 16,
                                    borderRadius: 16,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                                onPress={() => router.push("/(tabs)/academics/notices")}
                            >
                                <Bell size={24} color={colors.primary} style={{ marginBottom: 8 }} />
                                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
                                    View Notices
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                <ErrorModal
                    visible={showErrorModal}
                    error={sosError}
                    onDismiss={() => setShowErrorModal(false)}
                />
            </ScrollView>
        </GridBackground>
    );
}
