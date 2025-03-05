import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from './context/LanguageContext';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const sections = [
    {
      title: t.privacy.sections.information.title,
      content: t.privacy.sections.information.content
    },
    {
      title: t.privacy.sections.usage.title,
      content: t.privacy.sections.usage.content
    },
    {
      title: t.privacy.sections.sharing.title,
      content: t.privacy.sections.sharing.content
    },
    {
      title: t.privacy.sections.security.title,
      content: t.privacy.sections.security.content
    },
    {
      title: t.privacy.sections.rights.title,
      content: t.privacy.sections.rights.content
    },
    {
      title: t.privacy.sections.children.title,
      content: t.privacy.sections.children.content
    },
    {
      title: t.privacy.sections.updates.title,
      content: t.privacy.sections.updates.content
    },
    {
      title: t.privacy.sections.contact.title,
      content: t.privacy.sections.contact.content
    }
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7F7FD5', '#86A8E7', '#91EAE4']}
        style={styles.header}
      >
        <SafeAreaView style={styles.headerContent}>
          <View style={[styles.headerTop, isRTL && styles.headerTopRTL]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons 
                name={isRTL ? "chevron-forward" : "chevron-back"} 
                size={24} 
                color="#86A8E7" 
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t.privacy.title}</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={[styles.lastUpdated, isRTL && styles.rtlText]}>
          {t.privacy.lastUpdated}: {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
        </Text>

        <Text style={[styles.introduction, isRTL && styles.rtlText]}>
          {t.privacy.introduction}
        </Text>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{section.title}</Text>
            {section.content.map((item, itemIndex) => (
              <View key={itemIndex} style={[styles.bulletPoint, isRTL && styles.bulletPointRTL]}>
                <Text style={styles.bullet}>•</Text>
                <Text style={[styles.bulletText, isRTL && styles.rtlText]}>{item}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    height: 120,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  headerTopRTL: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  introduction: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2A363B',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingRight: 16,
  },
  bulletPointRTL: {
    flexDirection: 'row-reverse',
    paddingRight: 0,
    paddingLeft: 16,
  },
  bullet: {
    width: 20,
    fontSize: 16,
    color: '#86A8E7',
    textAlign: 'center',
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#4A4A4A',
  },
  rtlText: {
    textAlign: 'right',
  },
}); 