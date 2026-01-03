import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { useTheme } from "@/utils/useTheme";
import { CheckCircle, Star, Home } from "lucide-react-native";

export default function IncidentResolvedCard({
    guard = null,
    incidentId = null,
    onSubmitRating,
    onSkip,
}) {
    const { colors, isDark } = useTheme();
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const cardColors = {
        background: isDark ? "#1E1E1E" : "#F0FDF4",
        cardBg: isDark ? "#065F46" : "#ECFDF5",
        headerBg: isDark ? "#047857" : "#D1FAE5",
        text: isDark ? "#E5E7EB" : "#1F2937",
        textSecondary: isDark ? "#9CA3AF" : "#6B7280",
        accent: isDark ? "#10B981" : "#059669",
        starActive: "#FBBF24",
        starInactive: isDark ? "#374151" : "#D1D5DB",
        button: isDark ? "#10B981" : "#059669",
        buttonSecondary: isDark ? "#374151" : "#E5E7EB",
        buttonText: "#FFFFFF",
        inputBg: isDark ? "#1F2937" : "#FFFFFF",
        inputBorder: isDark ? "#374151" : "#D1D5DB",
    };

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);
        try {
            await onSubmitRating?.(rating, feedback);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View
            style={{
                width: "100%",
                backgroundColor: cardColors.cardBg,
                borderRadius: 24,
                padding: 24,
                marginBottom: 20,
            }}
        >
            {/* Success Icon */}
            <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View
                    style={{
                        width: 100,
                        height: 100,
                        borderRadius: 50,
                        backgroundColor: cardColors.headerBg,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 16,
                        shadowColor: cardColors.accent,
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.3,
                        shadowRadius: 16,
                        elevation: 10,
                    }}
                >
                    <CheckCircle size={56} color={cardColors.accent} strokeWidth={2.5} />
                </View>

                <Text
                    style={{
                        fontSize: 26,
                        fontWeight: "800",
                        color: cardColors.text,
                        marginBottom: 8,
                        textAlign: "center",
                    }}
                >
                    Incident Resolved
                </Text>

                <Text
                    style={{
                        fontSize: 15,
                        color: cardColors.textSecondary,
                        textAlign: "center",
                        lineHeight: 22,
                    }}
                >
                    Your emergency has been successfully handled.
                    {guard?.full_name && `\nThank you for trusting ${guard.full_name}.`}
                </Text>
            </View>

            {/* Rating Section */}
            <View
                style={{
                    backgroundColor: cardColors.inputBg,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 16,
                }}
            >
                <Text
                    style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: cardColors.text,
                        marginBottom: 16,
                        textAlign: "center",
                    }}
                >
                    How was your experience?
                </Text>

                {/* Star Rating */}
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 12,
                        marginBottom: 20,
                    }}
                >
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                            key={star}
                            onPress={() => setRating(star)}
                            activeOpacity={0.7}
                            style={{
                                padding: 4,
                            }}
                        >
                            <Star
                                size={36}
                                color={star <= rating ? cardColors.starActive : cardColors.starInactive}
                                fill={star <= rating ? cardColors.starActive : "transparent"}
                                strokeWidth={2}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Rating Label */}
                {rating > 0 && (
                    <Text
                        style={{
                            fontSize: 14,
                            color: cardColors.accent,
                            textAlign: "center",
                            marginBottom: 16,
                            fontWeight: "600",
                        }}
                    >
                        {rating === 5 ? "Excellent!" :
                            rating === 4 ? "Great!" :
                                rating === 3 ? "Good" :
                                    rating === 2 ? "Fair" : "Poor"}
                    </Text>
                )}

                {/* Feedback Input */}
                <TextInput
                    style={{
                        backgroundColor: isDark ? "#111827" : "#F9FAFB",
                        borderWidth: 1,
                        borderColor: cardColors.inputBorder,
                        borderRadius: 12,
                        padding: 14,
                        fontSize: 14,
                        color: cardColors.text,
                        minHeight: 80,
                        textAlignVertical: "top",
                    }}
                    placeholder="Share your feedback (optional)"
                    placeholderTextColor={cardColors.textSecondary}
                    multiline
                    numberOfLines={3}
                    value={feedback}
                    onChangeText={setFeedback}
                />
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 12 }}>
                {/* Submit Rating Button */}
                <TouchableOpacity
                    style={{
                        width: "100%",
                        backgroundColor: rating > 0 ? cardColors.button : cardColors.buttonSecondary,
                        borderRadius: 14,
                        paddingVertical: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        opacity: isSubmitting ? 0.7 : 1,
                    }}
                    onPress={handleSubmit}
                    disabled={rating === 0 || isSubmitting}
                    activeOpacity={0.8}
                >
                    <Star size={20} color={rating > 0 ? cardColors.buttonText : cardColors.textSecondary} />
                    <Text
                        style={{
                            fontSize: 16,
                            fontWeight: "700",
                            color: rating > 0 ? cardColors.buttonText : cardColors.textSecondary,
                        }}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Rating"}
                    </Text>
                </TouchableOpacity>

                {/* Skip Button */}
                <TouchableOpacity
                    style={{
                        width: "100%",
                        backgroundColor: cardColors.buttonSecondary,
                        borderRadius: 14,
                        paddingVertical: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                    }}
                    onPress={onSkip}
                    activeOpacity={0.8}
                >
                    <Home size={20} color={cardColors.text} />
                    <Text
                        style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: cardColors.text,
                        }}
                    >
                        Return to Home
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Thank You Message */}
            <View
                style={{
                    marginTop: 20,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                }}
            >
                <Text
                    style={{
                        fontSize: 12,
                        color: cardColors.textSecondary,
                        textAlign: "center",
                        lineHeight: 18,
                    }}
                >
                    Thank you for using RESQ. Your safety is our priority. 💚
                </Text>
            </View>
        </View>
    );
}
