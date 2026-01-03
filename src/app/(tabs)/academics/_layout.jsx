import { Stack } from "expo-router";

export default function AcademicsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="attendance" />
            <Stack.Screen name="exams" />
            <Stack.Screen name="fees" />
            <Stack.Screen name="notices" />
        </Stack>
    );
}
