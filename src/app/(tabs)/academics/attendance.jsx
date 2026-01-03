import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/utils/useTheme";
import GridBackground from "@/components/GridBackground";
import { ArrowLeft } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
import api from "@/utils/api";
import { useAuth } from "@/utils/auth/useAuth";

const CircularProgress = ({ value, radius = 50, strokeWidth = 10, color }) => {
    const circumference = 2 * Math.PI * radius;
    // Ensure value is between 0 and 100 to prevent drawing errors
    const safeValue = Math.min(Math.max(value, 0), 100);
    const strokeDashoffset = circumference - (safeValue / 100) * circumference;

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
            <View style={{ position: 'absolute', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: color }}>{Math.round(safeValue)}%</Text>
            </View>
        </View>
    );
};

export default function AttendanceScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors } = useTheme();
    const { user, isErpAuthenticated } = useAuth();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ overall: 0, subjects: [] });
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('[Attendance] Fetching attendance data...');

            if (!isErpAuthenticated) {
                console.log('[Attendance] Not connected to College ERP');
                setError("Not connected to College ERP");
                setLoading(false);
                return;
            }

            // 1. Find Student ID
            const students = await api.getStudents();
            // Match student record with logged in user
            // Assuming the authenticated user corresponds to one of the students
            // Ideally backend adds /students/me/ endpoint, but for now we search
            const myStudent = students.find(s => s.user.id === user?.id);

            if (!myStudent) {
                setError("Student profile not found.");
                setLoading(false);
                return;
            }

            // 2. Fetch Attendance
            const attendanceRecords = await api.getStudentAttendance(myStudent.id);

            // 3. Process Data
            // The API returns distinct class sessions. We need to aggregate by subject.
            // Example Record: { subject: 1, subject_name: "DS", status: true, classes_attended: X, classes_held: Y }
            // Wait, the documentation example shows:
            // [ 
            //   { id: 1, subject: 1, subject_name: "Data Structures", date: "...", status: true, classes_attended: 2, classes_held: 2 } 
            // ]
            // It seems each record might be a daily summary or session? 
            // Actually, checking the doc: "View attendance records for a specific student". 
            // The response list items have `classes_attended` and `classes_held`.
            // If it returns *cumulative* stats per subject per day, or just log entries?
            // "classes_attended: 2, classes_held: 2" implies it might be cumulative or batch.
            // Let's assume we group by Subject ID and sum up, or take the latest if it's cumulative.
            // Looking at the example: 
            // Item 1: DS, Date 1, Status True, Attended 2, Held 2.
            // Item 3: DS, Date 2, Status False, Attended 0, Held 2.
            // This looks like 'sessions'. 
            // Total Attended = Sum(status ? 1 : 0) or Sum(classes_attended)?
            // The field `classes_attended` in the response is a bit ambiguous if it's a single session record.
            // Let's assume each item is a "class slot". 
            // If `classes_attended` and `classes_held` are present, maybe they represent the weight of that slot?
            // Let's aggregate based on subject_name.

            const subjectMap = {};

            attendanceRecords.forEach(record => {
                const name = record.subject_name;
                if (!subjectMap[name]) {
                    subjectMap[name] = {
                        id: record.subject,
                        name,
                        attended: 0,
                        total: 0
                    };
                }

                // If the record has explicit counts, use them using logic that it might be a summary
                // But the example has a 'date' field, implying it's a daily record.
                // Let's assume `classes_held` is how many hours/slots that record represents (usually 1 or 2).
                // And `classes_attended` is how many of those were attended.
                // This handles both single classes and double-blocks.

                const held = record.classes_held || 1;
                const attended = record.classes_attended || (record.status ? held : 0);

                subjectMap[name].total += held;
                subjectMap[name].attended += attended;
            });

            const processedSubjects = Object.values(subjectMap).map(sub => ({
                ...sub,
                percent: sub.total === 0 ? 0 : Math.round((sub.attended / sub.total) * 100)
            }));

            // Calc Overall
            const totalClasses = processedSubjects.reduce((acc, curr) => acc + curr.total, 0);
            const totalAttended = processedSubjects.reduce((acc, curr) => acc + curr.attended, 0);
            const overallPercent = totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);

            setStats({
                overall: overallPercent,
                subjects: processedSubjects
            });

        } catch (err) {
            console.error(err);
            setError("Failed to load attendance data");
        } finally {
            setLoading(false);
        }
    };

    const getColor = (p) => {
        if (p >= 75) return "#10B981"; // Green
        if (p >= 60) return "#EAB308"; // Yellow
        return "#EF4444"; // Red
    };

    return (
        <GridBackground>
            {/* Header */}
            <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Attendance</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                {loading ? (
                    <View style={{ marginTop: 100 }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : error ? (
                    <View style={{ alignItems: 'center', marginTop: 50 }}>
                        <Text style={{ color: colors.error, fontSize: 16 }}>{error}</Text>
                        <TouchableOpacity onPress={fetchAttendance} style={{ marginTop: 20 }}>
                            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Overall Summary */}
                        <View style={{ alignItems: 'center', marginVertical: 24 }}>
                            <CircularProgress value={stats.overall} radius={70} strokeWidth={12} color={getColor(stats.overall)} />
                            <Text style={{ marginTop: 12, fontSize: 16, color: colors.text }}>Overall Attendance</Text>
                            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                                {stats.overall >= 75 ? "You are doing good!" : "Attention needed!"}
                            </Text>
                        </View>

                        {/* Subject List */}
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>Subject Breakdown</Text>

                        {stats.subjects.length === 0 ? (
                            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No attendance records found.</Text>
                        ) : (
                            stats.subjects.map((sub) => (
                                <View key={sub.id} style={{
                                    backgroundColor: colors.surface,
                                    marginBottom: 12,
                                    borderRadius: 12,
                                    padding: 16,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{sub.name}</Text>
                                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>{sub.attended}/{sub.total} Classes</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: getColor(sub.percent) }}>{sub.percent}%</Text>
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
