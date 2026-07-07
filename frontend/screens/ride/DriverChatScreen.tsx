import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { MessageSenderEnum } from '../../constants/enums';
import type { RideStackParamList } from '../../navigation/types';

type ChatRoute = RouteProp<RideStackParamList, 'DriverChat'>;

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

const QUICK_MESSAGES = ["I'm here", "Where are you?", "On my way", "Please call me"];

export default function DriverChatScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { params } = useRoute<ChatRoute>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');

  const sendQuickMessage = (text: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: MessageSenderEnum.USER,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: MessageSenderEnum.USER,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === MessageSenderEnum.USER;
    return (
      <View style={[styles.messageBubbleWrapper, isUser ? styles.messageBubbleUser : styles.messageBubbleDriver]}>
        <View 
          style={[
            styles.messageBubble, 
            isUser ? { backgroundColor: Colors.primary } : { backgroundColor: isDark ? colors.card : '#E0E0E0' },
            isUser ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }
          ]}
        >
          <Text style={[Typography.body, { color: isUser ? Colors.white : colors.text }]}>{item.text}</Text>
          <Text 
            style={[
              Typography.caption, 
              { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textMuted, alignSelf: 'flex-end', marginTop: 4, fontSize: 10 }
            ]}
          >
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ marginLeft: 16 }}>
            <Text style={[Typography.h4, { color: colors.text }]}>{params.driverName}</Text>
            <Text style={[Typography.caption, { color: Colors.primary }]}>Online</Text>
          </View>
          <TouchableOpacity 
            style={[styles.callBtn, { backgroundColor: `${Colors.success}15` }]}
            onPress={() => Linking.openURL(`tel:${params.driverPhone}`)}
          >
            <MaterialIcons name="call" size={16} color={Colors.success} />
            <Text style={[Typography.captionBold, { color: Colors.success, marginLeft: 4 }]}>{params.driverPhone}</Text>
          </TouchableOpacity>
        </View>

        {/* Chat Area */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
        />

        {/* Quick Messages */}
        <View style={styles.quickMessagesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickMessagesScroll}>
            {QUICK_MESSAGES.map((msg, index) => (
              <TouchableOpacity key={index} style={[styles.quickMessageBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => sendQuickMessage(msg)}>
                <Text style={[Typography.captionBold, { color: colors.text }]}>{msg}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            onPress={sendMessage} 
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? Colors.primary : colors.background }]}
            disabled={!inputText.trim()}
          >
            <MaterialIcons name="send" size={20} color={inputText.trim() ? Colors.white : colors.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    flexDirection: 'row',
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  chatContainer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  messageBubbleWrapper: {
    marginBottom: Spacing.base,
    maxWidth: '80%',
  },
  messageBubbleUser: {
    alignSelf: 'flex-end',
  },
  messageBubbleDriver: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
  },
  quickMessagesContainer: {
    paddingVertical: Spacing.sm,
  },
  quickMessagesScroll: {
    paddingHorizontal: Spacing.xl,
    gap: 8,
  },
  quickMessageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    paddingHorizontal: Spacing.xl,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 100,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 16,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
