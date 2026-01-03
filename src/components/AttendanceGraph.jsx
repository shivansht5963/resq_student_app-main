import React from "react";
import { View, Text, Dimensions } from "react-native";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import { useTheme } from "@/utils/useTheme";

const SCREEN_WIDTH = Dimensions.get("window").width;
const GRAPH_HEIGHT = 180;
const GRAPH_WIDTH = SCREEN_WIDTH - 60; // Padding

export default function AttendanceGraph({ data }) {
    const { colors, isDark } = useTheme();

    // Default Mock Data if none provided
    const chartData = data || [
        { subject: "Math", value: 85 },
        { subject: "Phy", value: 72 },
        { subject: "Chem", value: 90 },
        { subject: "CS", value: 95 },
        { subject: "Eng", value: 88 },
    ];

    const barWidth = 30;
    const spacing = (GRAPH_WIDTH - (chartData.length * barWidth)) / (chartData.length - 1);
    const maxValue = 100;

    return (
        <View
            style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
            }}
        >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
                    Weekly Performance
                </Text>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.success }}>
                    +4.5% 📈
                </Text>
            </View>

            <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
                {/* Background Lines */}
                {[0, 25, 50, 75, 100].map((val, index) => {
                    const y = GRAPH_HEIGHT - (val / maxValue) * (GRAPH_HEIGHT - 20) - 20; // 20px padding for text
                    return (
                        <React.Fragment key={index}>
                            <Line
                                x1="0"
                                y1={y}
                                x2={GRAPH_WIDTH}
                                y2={y}
                                stroke={isDark ? "#374151" : "#E5E7EB"}
                                strokeWidth="1"
                                strokeDasharray="4 4"
                            />
                        </React.Fragment>
                    );
                })}

                {/* Bars */}
                {chartData.map((item, index) => {
                    const x = index * (barWidth + spacing);
                    const barHeight = (item.value / maxValue) * (GRAPH_HEIGHT - 20);
                    const y = GRAPH_HEIGHT - barHeight - 20;

                    // Color based on value
                    let barColor = colors.primary;
                    if (item.value < 75) barColor = "#EF4444"; // Red for low attendance
                    else if (item.value >= 90) barColor = "#10B981"; // Green for high

                    return (
                        <React.Fragment key={index}>
                            {/* Bar */}
                            <Rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                fill={barColor}
                                rx={6} // Rounded corners
                            />
                            {/* Value Label (Top of Bar) */}
                            <SvgText
                                x={x + barWidth / 2}
                                y={y - 6}
                                fontSize="10"
                                fill={colors.textSecondary}
                                textAnchor="middle"
                                fontWeight="600"
                            >
                                {item.value}%
                            </SvgText>
                            {/* Subject Label (Bottom) */}
                            <SvgText
                                x={x + barWidth / 2}
                                y={GRAPH_HEIGHT - 4}
                                fontSize="12"
                                fill={colors.textSecondary}
                                textAnchor="middle"
                            >
                                {item.subject}
                            </SvgText>
                        </React.Fragment>
                    );
                })}
            </Svg>
        </View>
    );
}
