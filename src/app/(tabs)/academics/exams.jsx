import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/utils/useTheme";
import GridBackground from "@/components/GridBackground";
import { ArrowLeft, Calendar, FileText, Clock } from "lucide-react-native";
import api from "@/utils/api";
import { useAuth } from "@/utils/auth/useAuth";

export default function ExamsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors } = useTheme();
    const { user, isErpAuthenticated } = useAuth();

    const [activeTab, setActiveTab] = useState('upcoming'); // upcoming | results
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);

    // Mock Data for Upcoming (API endpoint usually not available/documented yet)
    const upcomingExams = [];

    useEffect(() => {
        if (activeTab === 'results') {
            fetchResults();
        }
    }, [activeTab]);

    const fetchResults = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('[Exams] Fetching results...');

            if (!isErpAuthenticated) {
                console.log('[Exams] Not connected to College ERP');
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

            // 2. Fetch Marks
            const marksData = await api.getStudentMarks(myStudent.id);
            // API Response: [{ id, subject, subject_name, subject_code, internal_marks, semester_marks, total_marks }]
            // Note: total_marks in API appears to be the Obtained Marks (sum), not Max Marks.
            // We assume Max Marks to be 100.

            const processedResults = marksData.map(m => {
                const totalScored = m.total_marks || ((m.internal_marks || 0) + (m.semester_marks || 0));
                const maxMarks = 100; // Hardcoded as API returns obtained marks in total_marks
                const percentage = (totalScored / maxMarks) * 100;

                let grade = 'F';
                if (percentage >= 90) grade = 'A+';
                else if (percentage >= 80) grade = 'A';
                else if (percentage >= 70) grade = 'B+';
                else if (percentage >= 60) grade = 'B';
                else if (percentage >= 50) grade = 'C';
                else if (percentage >= 40) grade = 'D';

                return {
                    id: m.id,
                    subject: m.subject_name,
                    code: m.subject_code,
                    grade,
                    marks: totalScored,
                    max: maxMarks,
                    internal: m.internal_marks,
                    external: m.semester_marks
                };
            });

            setResults(processedResults);

        } catch (err) {
            console.error(err);
            setError("Failed to load results");
        } finally {
            setLoading(false);
        }
    };

    return (
        <GridBackground>
            {/* Header */}
            <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Exams & Results</Text>
            </View>

            {/* Tabs */}
            <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: colors.surface, borderRadius: 12, padding: 4 }}>
                <TouchableOpacity
                    style={{
                        flex: 1,
                        paddingVertical: 10,
                        alignItems: 'center',
                        backgroundColor: activeTab === 'upcoming' ? colors.primary : 'transparent',
                        borderRadius: 8
                    }}
                    onPress={() => setActiveTab('upcoming')}
                >
                    <Text style={{ fontWeight: '600', color: activeTab === 'upcoming' ? '#fff' : colors.textSecondary }}>Upcoming</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        flex: 1,
                        paddingVertical: 10,
                        alignItems: 'center',
                        backgroundColor: activeTab === 'results' ? colors.primary : 'transparent',
                        borderRadius: 8
                    }}
                    onPress={() => setActiveTab('results')}
                >
                    <Text style={{ fontWeight: '600', color: activeTab === 'results' ? '#fff' : colors.textSecondary }}>Results</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                {activeTab === 'upcoming' ? (
                    <View>
                        {upcomingExams.length > 0 ? upcomingExams.map((exam) => (
                            <View key={exam.id} style={{
                                backgroundColor: colors.surface,
                                marginBottom: 12,
                                borderRadius: 12,
                                padding: 16,
                                borderLeftWidth: 4,
                                borderLeftColor: colors.primary
                            }}>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 4 }}>{exam.subject}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                    <Calendar size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                                    <Text style={{ fontSize: 14, color: colors.textSecondary, marginRight: 16 }}>{exam.date}</Text>
                                    <Clock size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>{exam.time}</Text>
                                </View>
                                <View style={{ marginTop: 8, alignSelf: 'flex-start', backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                                    <Text style={{ fontSize: 12, color: colors.text }}>Room: {exam.room}</Text>
                                </View>
                            </View>
                        )) : (
                            <View style={{ alignItems: 'center', marginTop: 50 }}>
                                <Text style={{ color: colors.textSecondary }}>No upcoming exams scheduled.</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <View>
                        {loading ? (
                            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                        ) : error ? (
                            <Text style={{ color: colors.error, textAlign: 'center', marginTop: 20 }}>{error}</Text>
                        ) : results.length === 0 ? (
                            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>No results declared yet.</Text>
                        ) : (
                            results.map((res) => (
                                <View key={res.id} style={{
                                    backgroundColor: colors.surface,
                                    marginBottom: 16,
                                    borderRadius: 12,
                                    padding: 16,
                                    borderWidth: 1,
                                    borderColor: 'rgba(0,0,0,0.05)'
                                }}>
                                    {/* Subject Header */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 }}>
                                            {res.subject} ({res.code})
                                        </Text>
                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4F46E5' }}>
                                            {typeof res.marks === 'number' ? res.marks.toFixed(1) : res.marks}
                                            <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: 'normal' }}> / 100</Text>
                                        </Text>
                                    </View>

                                    {/* Marks Breakdown Box */}
                                    <View style={{
                                        backgroundColor: '#F9FAFB',
                                        borderRadius: 8,
                                        padding: 12,
                                        flexDirection: 'row',
                                        justifyContent: 'space-between'
                                    }}>
                                        <View>
                                            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Internal</Text>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937' }}>
                                                {typeof res.internal === 'number' ? res.internal.toFixed(1) : (res.internal || '-')}
                                            </Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Semester</Text>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937' }}>
                                                {typeof res.external === 'number' ? res.external.toFixed(1) : (res.external || '-')}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}
            </ScrollView>
        </GridBackground>
    );
}
