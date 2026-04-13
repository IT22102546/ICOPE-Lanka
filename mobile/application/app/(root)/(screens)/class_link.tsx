// screens/ClassLink.tsx - Fixed with correct API structure
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '@/stores/authStore';
import { apiFetch } from '@/utils/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';

// Configure dayjs
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);

// Types
interface Class {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  schedule?: string;
  maxStudents?: number;
  isLive: boolean;
  startedAt?: string;
  endedAt?: string;
  teacherId: string;
  subjectId: string;
  gradeId: string;
  mediumId: string;
  teacherAssignmentId?: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
    description?: string;
    imageUrl?: string;
  };
  grade?: {
    id: string;
    name: string;
    code: string;
    level: number;
  };
  medium?: {
    id: string;
    name: string;
  };
  _count?: {
    enrollments: number;
  };
  currentEnrollment?: number;
}

interface TodayClassesResponse {
  teacherclasses: Class[];
  studentClasses: Class[];
  total: number;
}

interface MyClassesResponse {
  class?: Class;
  classes?: Class[];
}

const ClassLink = () => {
  const { currentUser, getAccessToken, debugAuthState, refreshTokens } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today');
  const [todayClasses, setTodayClasses] = useState<Class[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<Class[]>([]);
  const [filteredTodayClasses, setFilteredTodayClasses] = useState<Class[]>([]);
  const [filteredUpcomingClasses, setFilteredUpcomingClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug on mount
  useEffect(() => {
    debugAuthState();
  }, []);

  // Fetch data when active tab changes
  useEffect(() => {
    if (activeTab === 'today') {
      fetchTodayClasses();
    } else {
      fetchMyClasses(); // Use my-classes endpoint instead
    }
  }, [activeTab]);

  // Filter classes based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTodayClasses(todayClasses);
      setFilteredUpcomingClasses(upcomingClasses);
    } else {
      const query = searchQuery.toLowerCase();
      const filteredToday = todayClasses.filter(classItem =>
        classItem.name?.toLowerCase().includes(query) ||
        classItem.subject?.name?.toLowerCase().includes(query) ||
        classItem.teacher?.firstName?.toLowerCase().includes(query) ||
        classItem.teacher?.lastName?.toLowerCase().includes(query)
      );
      const filteredUpcoming = upcomingClasses.filter(classItem =>
        classItem.name?.toLowerCase().includes(query) ||
        classItem.subject?.name?.toLowerCase().includes(query) ||
        classItem.teacher?.firstName?.toLowerCase().includes(query) ||
        classItem.teacher?.lastName?.toLowerCase().includes(query)
      );
      setFilteredTodayClasses(filteredToday);
      setFilteredUpcomingClasses(filteredUpcoming);
    }
  }, [searchQuery, todayClasses, upcomingClasses]);

  // Fetch today's classes
  const fetchTodayClasses = useCallback(async () => {
    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🌐 Fetching today classes...');
      const response = await apiFetch('/api/v1/classes/today', {
        method: 'GET',
      });

      console.log('📡 Today classes response status:', response.status);
      
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await refreshTokens();
        if (refreshed) {
          return fetchTodayClasses();
        }
        Alert.alert('Session Expired', 'Please login again');
        return;
      }
      
      if (response.status === 404) {
        console.log('⚠️ /api/v1/classes/today not found, trying my-classes...');
        return fetchMyClassesForToday();
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch today's classes: ${response.status}`);
      }

      const data: TodayClassesResponse = await response.json();
      console.log('📊 Today classes data received');
      
      // Combine teacher and student classes
      let allClasses: Class[] = [];
      
      if (data.teacherclasses && Array.isArray(data.teacherclasses)) {
        allClasses = [...allClasses, ...data.teacherclasses];
      }
      
      if (data.studentClasses && Array.isArray(data.studentClasses)) {
        allClasses = [...allClasses, ...data.studentClasses];
      }
      
      // Filter only active classes and sort by start time
      const sortedClasses = allClasses
        .filter(classItem => classItem.status === 'ACTIVE')
        .sort((a, b) => {
          if (!a.startDate || !b.startDate) return 0;
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });

      console.log('✅ Filtered today classes:', sortedClasses.length);
      setTodayClasses(sortedClasses);
      setFilteredTodayClasses(sortedClasses);
      
    } catch (err: any) {
      console.error('❌ Error fetching today classes:', err);
      setError(err.message || 'Failed to load today classes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, refreshTokens]);

  // Fetch my classes for today (alternative)
  const fetchMyClassesForToday = useCallback(async () => {
    try {
      console.log('🌐 Fetching my classes for today...');
      const response = await apiFetch('/api/v1/classes/my-classes', {
        method: 'GET',
      });

      if (response.status === 401) {
        const refreshed = await refreshTokens();
        if (refreshed) {
          return fetchMyClassesForToday();
        }
        Alert.alert('Session Expired', 'Please login again');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch my classes: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 My classes data:', data);
      
      // Handle response structure
      let classesList: Class[] = [];
      
      if (Array.isArray(data)) {
        classesList = data;
      } else if (data.classes && Array.isArray(data.classes)) {
        classesList = data.classes;
      } else if (data.class) {
        classesList = [data.class];
      }
      
      // Filter for today's classes
      const today = dayjs().startOf('day');
      const todayClassesList = classesList.filter((classItem: Class) => {
        if (!classItem.startDate) return false;
        const classDate = dayjs(classItem.startDate).startOf('day');
        return classDate.isSame(today, 'day');
      });
      
      console.log('✅ Today classes from my-classes:', todayClassesList.length);
      setTodayClasses(todayClassesList);
      setFilteredTodayClasses(todayClassesList);
      
    } catch (err: any) {
      console.error('Error fetching my classes:', err);
      setError(err.message || 'Failed to load classes');
    }
  }, [refreshTokens]);

  // Fetch my classes (for upcoming tab)
  const fetchMyClasses = useCallback(async () => {
    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🌐 Fetching my classes...');
      const response = await apiFetch('/api/v1/classes/my-classes', {
        method: 'GET',
      });

      console.log('📡 My classes response status:', response.status);
      
      if (response.status === 401) {
        const refreshed = await refreshTokens();
        if (refreshed) {
          return fetchMyClasses();
        }
        Alert.alert('Session Expired', 'Please login again');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch my classes: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 My classes data received');
      
      // Handle response structure
      let classesList: Class[] = [];
      
      if (Array.isArray(data)) {
        classesList = data;
      } else if (data.classes && Array.isArray(data.classes)) {
        classesList = data.classes;
      } else if (data.class) {
        classesList = [data.class];
      }
      
      // Get tomorrow's date
      const tomorrow = dayjs().add(1, 'day').startOf('day');
      
      // Filter classes with startDate in the future (upcoming)
      const upcomingClassesList = classesList.filter((classItem: Class) => {
        if (!classItem.startDate) return false;
        const classDate = dayjs(classItem.startDate);
        return classDate.isAfter(tomorrow) || classDate.isSame(tomorrow, 'day');
      });

      // Sort by start date
      const sortedClasses = upcomingClassesList.sort((a, b) => {
        if (!a.startDate || !b.startDate) return 0;
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      });

      console.log('✅ Upcoming classes:', sortedClasses.length);
      setUpcomingClasses(sortedClasses);
      setFilteredUpcomingClasses(sortedClasses);
      
    } catch (err: any) {
      console.error('❌ Error fetching my classes:', err);
      setError(err.message || 'Failed to load classes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, refreshTokens]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (activeTab === 'today') {
      fetchTodayClasses();
    } else {
      fetchMyClasses();
    }
  }, [activeTab, fetchTodayClasses, fetchMyClasses]);

  // Start a class (for teachers)
  const startClass = async (classId: string) => {
    try {
      const response = await apiFetch(`/api/v1/classes/${classId}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        Alert.alert('Success', 'Class started successfully');
        // Refresh the list
        fetchTodayClasses();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to start class');
      }
    } catch (err) {
      console.error('Error starting class:', err);
      Alert.alert('Error', 'Failed to start class');
    }
  };

  // Stop a class (for teachers)
  const stopClass = async (classId: string) => {
    try {
      const response = await apiFetch(`/api/v1/classes/${classId}/stop`, {
        method: 'POST',
      });

      if (response.ok) {
        Alert.alert('Success', 'Class stopped successfully');
        // Refresh the list
        fetchTodayClasses();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to stop class');
      }
    } catch (err) {
      console.error('Error stopping class:', err);
      Alert.alert('Error', 'Failed to stop class');
    }
  };

  // Join a class
  const joinClass = (classItem: Class) => {
    Alert.alert(
      'Join Class',
      `Join ${classItem.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Join', 
          onPress: () => {
            Alert.alert('Joining Class', `Redirecting to ${classItem.name}...`);
            // navigation.navigate('VideoSession', { classId: classItem.id });
          }
        }
      ]
    );
  };

  // Format time
  const formatTime = (dateString?: string) => {
    if (!dateString) return 'Time not set';
    return dayjs(dateString).format('h:mm A');
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = dayjs(dateString);
    if (date.isToday()) return 'Today';
    if (date.isTomorrow()) return 'Tomorrow';
    return date.format('MMM D');
  };

  // Calculate time until class starts
  const getTimeUntilStart = (startDate?: string) => {
    if (!startDate) return '';
    const now = dayjs();
    const start = dayjs(startDate);
    const diffHours = start.diff(now, 'hour');
    
    if (diffHours <= 0) {
      const diffMinutes = start.diff(now, 'minute');
      if (diffMinutes <= 0) return 'Starting now';
      return `Starts in ${diffMinutes} minutes`;
    }
    
    return `Starts in ${diffHours} hours`;
  };

  // Render today class item
  const renderTodayClassItem = ({ item }: { item: Class }) => {
    const isTeacher = currentUser?.role?.includes('TEACHER');
    const canStartStop = isTeacher && item.teacherId === currentUser?.id;
    const timeUntilStart = getTimeUntilStart(item.startDate);
    const isStartingSoon = timeUntilStart.includes('minutes') || timeUntilStart.includes('Starting now');
    const displayName = item.subject?.name || item.name;
    const teacherName = item.teacher ? 
      `${item.teacher.firstName} ${item.teacher.lastName}`.trim() : 
      'Unknown Teacher';

    return (
      <View style={styles.classCard}>
        <View style={styles.classHeader}>
          <Text style={styles.subjectText}>{displayName}</Text>
          {item.startDate && (
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={12} color="#666" />
              <Text style={styles.timeText}>
                {formatDate(item.startDate)} {formatTime(item.startDate)}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.teacherText}>{teacherName}</Text>
        
        {item.isLive ? (
          <View style={styles.liveSection}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE NOW</Text>
            </View>
            <TouchableOpacity 
              style={styles.joinButton}
              onPress={() => joinClass(item)}
            >
              <Text style={styles.joinButtonText}>Join Class</Text>
            </TouchableOpacity>
          </View>
        ) : canStartStop ? (
          <View style={styles.actionSection}>
            <View style={styles.startsInBadge}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.startsInText}>{timeUntilStart}</Text>
            </View>
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => startClass(item.id)}
            >
              <Text style={styles.startButtonText}>Start Class</Text>
            </TouchableOpacity>
          </View>
        ) : isStartingSoon ? (
          <View style={styles.actionSection}>
            <View style={styles.startsInBadge}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.startsInText}>{timeUntilStart}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.joinButton, !item.isLive && styles.joinButtonDisabled]}
              onPress={() => joinClass(item)}
              disabled={!item.isLive}
            >
              <Text style={styles.joinButtonText}>
                {item.isLive ? 'Join Class' : 'Waiting to start'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.scheduledBadge}>
            <Text style={styles.scheduledText}>Scheduled</Text>
          </View>
        )}
        
        {(item._count?.enrollments || item.currentEnrollment) && (
          <View style={styles.enrollmentInfo}>
            <Ionicons name="people-outline" size={12} color="#666" />
            <Text style={styles.enrollmentText}>
              {item.currentEnrollment || item._count?.enrollments} enrolled
              {item.maxStudents && ` / ${item.maxStudents} max`}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render upcoming class item
  const renderUpcomingClassItem = ({ item }: { item: Class }) => {
    const displayName = item.subject?.name || item.name;
    const teacherName = item.teacher ? 
      `${item.teacher.firstName} ${item.teacher.lastName}`.trim() : 
      'Unknown Teacher';

    return (
      <View style={styles.classCard}>
        <View style={styles.classHeader}>
          <Text style={styles.subjectText}>{displayName}</Text>
          {item.startDate && (
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>
                {formatDate(item.startDate)} {formatTime(item.startDate)}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.teacherText}>{teacherName}</Text>
        
        <View style={styles.upcomingInfo}>
          {item.startDate && (
            <>
              <View style={styles.dateInfo}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.dateText}>
                  {dayjs(item.startDate).format('MMM D, YYYY')}
                </Text>
              </View>
              <Text style={styles.timeUntilText}>
                {getTimeUntilStart(item.startDate)}
              </Text>
            </>
          )}
        </View>
        
        <View style={styles.scheduledBadge}>
          <Text style={styles.scheduledText}>Scheduled</Text>
        </View>
        
        {(item._count?.enrollments || item.currentEnrollment) && (
          <View style={styles.enrollmentInfo}>
            <Ionicons name="people-outline" size={12} color="#666" />
            <Text style={styles.enrollmentText}>
              {item.currentEnrollment || item._count?.enrollments} enrolled
              {item.maxStudents && ` / ${item.maxStudents} max`}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={activeTab === 'today' ? "calendar-outline" : "calendar-sharp"} 
        size={64} 
        color="#ccc" 
      />
      <Text style={styles.emptyText}>
        {activeTab === 'today' 
          ? 'No classes scheduled for today' 
          : 'No upcoming classes scheduled'
        }
      </Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={onRefresh}
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Checking authentication...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Classes"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'today' && styles.activeTab]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
            Today Classes
          </Text>
          {todayClasses.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{todayClasses.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming Classes
          </Text>
          {upcomingClasses.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{upcomingClasses.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>
            Loading {activeTab === 'today' ? 'today\'s' : 'upcoming'} classes...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Text style={styles.refreshButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Classes List */
        <FlatList
          data={activeTab === 'today' ? filteredTodayClasses : filteredUpcomingClasses}
          renderItem={activeTab === 'today' ? renderTodayClassItem : renderUpcomingClassItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.classesList}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4f46e5']}
              tintColor="#4f46e5"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSpacing: {
    marginLeft: 8,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#4f46e5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: 10,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  classesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  subjectText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 10,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  teacherText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  liveSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  startsInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  startsInText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 4,
  },
  joinButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  joinButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scheduledBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  scheduledText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  upcomingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  timeUntilText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  enrollmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  enrollmentText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 20,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ClassLink;