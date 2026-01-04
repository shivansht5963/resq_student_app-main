import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/utils/useTheme";
import GridBackground from "@/components/GridBackground";
import Svg, { Circle } from "react-native-svg";
import {
    Calendar,
    CreditCard,
    Bell,
    CheckCircle2,
    GraduationCap
} from "lucide-react-native";
import AttendanceGraph from "@/components/AttendanceGraph";
import api from "@/utils/api";
import { useAuth } from "@/utils/auth/useAuth";

// Compact Circular Progress Component
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

export default function AcademicsHomeScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const router = useRouter();
    const { user, isErpAuthenticated } = useAuth();

    const [loading, setLoading] = useState(true);
    const [attendanceData, setAttendanceData] = useState([]);
    const [overallAttendance, setOverallAttendance] = useState(0);
    const [recentResult, setRecentResult] = useState(null);
    const [feesDue, setFeesDue] = useState(0);

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

            if (!myStudent) {
                setLoading(false);
                return;
            }

            // 2. Fetch Data in Parallel
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
                // Robust check for present status (matching AttendanceScreen logic)
                const isPresent = record.status === true || record.status === 'PRESENT' || record.status === 'Present';
                const attended = record.classes_attended || (isPresent ? held : 0);

                subjectsMap[subject].held += held;
                subjectsMap[subject].attended += attended;
            });

            // Calculate overall stats from the map
            let totalClasses = 0;
            let totalAttended = 0;

            Object.values(subjectsMap).forEach(sub => {
                totalClasses += sub.held;
                totalAttended += sub.attended;
            });

            const processedAttendance = Object.keys(subjectsMap).map(key => ({
                subject: key,
                value: subjectsMap[key].held === 0 ? 0 : Math.round((subjectsMap[key].attended / subjectsMap[key].held) * 100)
            }));

            setAttendanceData(processedAttendance.slice(0, 5));
            setOverallAttendance(totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100));

            // --- Process Marks (Most Recent) ---
            if (marksRes && marksRes.length > 0) {
                // Sort by ID descending to get the latest entry
                const sortedMarks = [...marksRes].sort((a, b) => b.id - a.id);
                const latest = sortedMarks[0];

                // Use obtained marks logic (API returns sum in total_marks usually)
                // Assuming Max Marks is 100 as per exams.jsx fix
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
            console.error("Dashboard data fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <GridBackground>
            <ScrollView
                contentContainerStyle={{
                    paddingTop: insets.top + 20,
                    paddingBottom: insets.bottom + 100,
                    paddingHorizontal: 20,
                }}
                showsVerticalScrollIndicator={false}
            >
                <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text, marginBottom: 8 }}>
                    Academics
                </Text>
                <Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 24 }}>
                    Manage your academic journey
                </Text>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : (
                    <>
                        {/* Graph Section */}
                        <AttendanceGraph data={attendanceData.length > 0 ? attendanceData : null} />

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
                                    backgroundColor: colors.primaryLight || '#EEF2FF', // Fallback if primaryLight undefined
                                    padding: 16,
                                    borderRadius: 16,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    shadowColor: '#000',
                                    shadowOpacity: 0.05,
                                    shadowRadius: 10,
                                    elevation: 2
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

            </ScrollView>
        </GridBackground>
    );
}
