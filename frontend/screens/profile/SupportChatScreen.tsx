import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import { MessageSenderEnum, messageSenderConfigs } from '../../constants/enums';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

const QUICK_MESSAGES = [
  "Where is my refund?",
  "Report an issue with my order",
  "How do I cancel a ride?",
  "Connect to a human agent"
];

export default function SupportChatScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: MessageSenderEnum.SUPPORT_AGENT,
      text: "Hi there! I'm the Swibber virtual assistant. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputText, setInputText] = useState('');

  const sendQuickMessage = (text: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: MessageSenderEnum.USER,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMessage]);
    
    // Simulate support reply
    setTimeout(() => {
      const replyMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: MessageSenderEnum.SUPPORT_AGENT,
        text: `I can help you with "${text}". Let me pull up your account details...`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, replyMessage]);
    }, 1000);
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

    // Simulate support reply
    setTimeout(() => {
      const replyMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: MessageSenderEnum.SUPPORT_AGENT,
        text: "Thanks for your message. An agent will be with you shortly.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, replyMessage]);
    }, 1500);
  };

  const getAlias = (senderKey: string) => {
    return messageSenderConfigs[senderKey as keyof typeof messageSenderConfigs]?.alias || 'Unknown';
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === MessageSenderEnum.USER;
    const bubbleColor = isUser ? Colors.primary : colors.card;
    const textColor = isUser ? Colors.white : colors.text;
    const aliasColor = isUser ? 'rgba(255,255,255,0.7)' : colors.textSub;

    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperOther]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: `${Colors.primary}20` }]}>
            <Text style={{ fontSize: 16 }}>🎧</Text>
          </View>
        )}
        <View style={{ maxWidth: '75%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
            <Text style={[Typography.captionBold, { color: aliasColor, fontSize: 10, marginHorizontal: 4 }]}>
              {getAlias(item.sender)}
            </Text>
          </View>
          <View style={[styles.messageBubble, { backgroundColor: bubbleColor, borderBottomRightRadius: isUser ? 4 : BorderRadius.lg, borderBottomLeftRadius: isUser ? BorderRadius.lg : 4 }]}>
            <Text style={[Typography.body, { color: textColor }]}>{item.text}</Text>
          </View>
          <Text style={[Typography.caption, { color: colors.textMuted, fontSize: 10, marginTop: 4, alignSelf: isUser ? 'flex-end' : 'flex-start' }]}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }, Shadows.sm]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={[Typography.h4, { color: colors.text }]}>Live Support</Text>
            <Text style={[Typography.caption, { color: Colors.success }]}>Wait time: ~2 mins</Text>
          </View>
        </View>

        {/* Chat List */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
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
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, backgroundColor: isDark ? colors.background : '#F5F5F5' }]}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? Colors.primary : colors.border }]}
            onPress={sendMessage}
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
  },
  chatList: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperOther: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 16,
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
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
