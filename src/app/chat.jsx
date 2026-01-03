import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Send } from "lucide-react-native";
import { useTheme } from "@/utils/useTheme";
import { useApp } from "@/context/AppContext";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { messages, addMessage } = useApp();
  const scrollViewRef = useRef(null);

  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;

    setSending(true);
    try {
      addMessage(inputText);
      setInputText("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={colors.statusBar} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.background,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: colors.text,
              }}
            >
              Campus Security
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              Available 24/7
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.length === 0 ? (
            <View style={{ paddingTop: 40, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 16,
                  color: colors.textSecondary,
                  textAlign: "center",
                }}
              >
                No messages yet. Start a conversation with Campus Security.
              </Text>
            </View>
          ) : (
            messages.map((message, index) => {
              const isUser = message.sender === "user";
              return (
                <View
                  key={message.id || index}
                  style={{
                    flexDirection: "row",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      maxWidth: "75%",
                      backgroundColor: isUser ? colors.primary : colors.surface,
                      borderRadius: 16,
                      padding: 12,
                      paddingHorizontal: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        color: isUser ? "#FFFFFF" : colors.text,
                        lineHeight: 20,
                      }}
                    >
                      {message.message}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: isUser ? "#FFFFFF" : colors.textTertiary,
                        opacity: 0.7,
                        marginTop: 4,
                        textAlign: "right",
                      }}
                    >
                      {formatTime(message.created_at)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Area */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: insets.bottom + 12,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <TextInput
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderRadius: 24,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 15,
                color: colors.text,
                maxHeight: 100,
              }}
              placeholder="Type a message..."
              placeholderTextColor={colors.textTertiary}
              multiline
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim() || sending}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor:
                  inputText.trim() && !sending
                    ? colors.primary
                    : colors.surfaceElevated,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send
                size={20}
                color={
                  inputText.trim() && !sending
                    ? "#FFFFFF"
                    : colors.textTertiary
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
