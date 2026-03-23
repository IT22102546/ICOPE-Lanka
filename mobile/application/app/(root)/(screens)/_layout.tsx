import Overlay from "@/components/Overlay";
import Sidebar from "@/components/Sidebar";
import { icons } from "@/constants";
import { Stack } from "expo-router";
import { useState } from "react";
import { Image, TouchableOpacity } from "react-native";
import Toast from "react-native-toast-message";

const ScreenLayout = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: true,
          headerShadowVisible: false,
          headerTintColor: "black",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerLeft: () => (
            <TouchableOpacity style={{ marginLeft: 6 }} onPress={toggleSidebar}>
              <Image
                source={icons.burgermenu}
                resizeMode="contain"
                className="w-8 h-8 text-black"
              />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          tabBarShowLabel: false,
          tabBarStyle: {
            display: "none",
          },
        }}
      >
        <Stack.Screen
          name="chat_window"
          options={({ route }) => ({
            headerShown: true,
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#623B1C",
            headerTitle: () => <ChatHeader receiverId={route.params?.id} />,
          })}
        />

        <Stack.Screen
          name="Update profile"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#623B1C",
            headerTitleStyle: { fontWeight: "bold" },
            title: "Update Profile",
          }}
        />

        <Stack.Screen
          name="single_profile"
          options={{
            headerShown: false,
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#623B1C",
            headerTitleStyle: { fontWeight: "bold" },
            title: "Matching Profiles",
          }}
        />

        <Stack.Screen
          name="teachers"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "black",
            headerTitleStyle: { fontWeight: "bold" },
            title: "Physiotherapists",
          }}
        />

        <Stack.Screen
          name="SubjectNotesRecords"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "black",
            headerTitleStyle: { fontWeight: "bold" },
            title: "Subjects",
          }}
        />

        <Stack.Screen
          name="online_sessions"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: "#0057FF" },
            headerTintColor: "#fff",
            headerTitleStyle: { fontWeight: "bold" },
            title: "Online Sessions",
          }}
        />

        <Stack.Screen
          name="Account"
          options={{
            headerShown: false,
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#623B1C",
            headerTitleStyle: { fontWeight: "bold" },
            title: "Account",
          }}
        />

        <Stack.Screen
          name="class_link"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#623B1C",
            headerTitleStyle: { fontWeight: "bold" },
            title: "Class Links",
          }}
        />

        <Stack.Screen
          name="ExamResults"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#623B1C",
            headerTitleStyle: { fontWeight: "bold" },
            title: "Results",
          }}
        />

        <Stack.Screen
          name="ExamTaking"
          options={{
            headerShown: false,
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#623B1C",
            headerTitleStyle: { fontWeight: "bold" },
            title: "Exam",
          }}
        />

        <Stack.Screen
          name="exam_start"
          options={{
            headerShown: false,
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#623B1C",
            headerTitleStyle: { fontWeight: "bold" },
            title: "Exams",
          }}
        />
        <Stack.Screen
          name="Seminar"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#623B1C",
            headerTitleStyle: { fontWeight: "bold" },
            title: "Seminars",
          }}
        />

        <Stack.Screen
          name="ExamRanking"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#623B1C",
            headerTitleStyle: { fontWeight: "bold" },
            title: "Ranks",
          }}
        />

        <Stack.Screen
          name="CorrectionSheet"
          options={{
            headerShown: false,
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#623B1C",
            headerTitleStyle: { fontWeight: "bold" },
            title: "Correction Sheet",
          }}
        />

        <Stack.Screen
          name="ExamFinished"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#623B1C",
            headerTitleStyle: { fontWeight: "bold" },
            title: "Exams",
          }}
        />

        <Stack.Screen
          name="PaymentMethodSelect"
          options={{
            headerShown: false,
            headerStyle: { backgroundColor: "#fff" },
            headerTintColor: "#623B1C",
            headerTitleStyle: { fontWeight: "bold" },
            title: "Payment",
          }}
        />

        <Stack.Screen
          name="exercise_progress"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="doctor-patients"
          options={{
            headerShown: true,
            title: "Doctor Patients",
          }}
        />

        <Stack.Screen
          name="patient-assessment"
          options={{
            headerShown: true,
            title: "ICOPE Assessment",
          }}
        />
      </Stack>

      {/* Sidebar and Overlay */}
      <Sidebar
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />
      <Overlay
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />

      <Toast />
    </>
  );
};

export default ScreenLayout;
