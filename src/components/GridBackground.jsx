import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Defs, Pattern, Rect, Line } from "react-native-svg";
import { useTheme } from "@/utils/useTheme";

export default function GridBackground({ children }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <Line
              x1="0"
              y1="0"
              x2="0"
              y2="40"
              stroke={colors.grid}
              strokeWidth="0.5"
            />
            <Line
              x1="0"
              y1="0"
              x2="40"
              y2="0"
              stroke={colors.grid}
              strokeWidth="0.5"
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={colors.background} />
        <Rect width="100%" height="100%" fill="url(#grid)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
