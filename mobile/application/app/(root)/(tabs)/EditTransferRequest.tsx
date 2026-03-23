// apps/frontend/app/teacher/transfer/edit.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Save,
  X,
  ChevronDown,
  User,
  School,
  MapPin,
  BookOpen,
  Award,
  MessageSquare,
  Check,
  AlertCircle,
} from "lucide-react-native";
import { apiFetch } from "@/utils/api";
import useAuthStore from "@/stores/authStore";

const { width } = Dimensions.get("window");

// Types
interface UpdateTransferRequestDto {
  registrationId?: string;
  currentSchool?: string;
  currentSchoolType?: string;
  currentDistrict?: string;
  currentZone?: string;
  fromZone?: string;
  toZones?: string[];
  subject?: string;
  medium?: string;
  level?: "A/L" | "O/L";
  yearsOfService?: number;
  qualifications?: string[];
  isInternalTeacher?: boolean;
  preferredSchoolTypes?: string[];
  additionalRequirements?: string;
  notes?: string;
}

interface DropdownItem {
  id: string;
  value: string;
  label: string;
}

interface DropdownConfig {
  items: DropdownItem[];
  multiSelect?: boolean;
  onSelect: (value: string | string[]) => void;
  selectedValues: string[];
  placeholder: string;
}

// Static data (same as create)
const SCHOOL_TYPES = [
  { id: "1", value: "1AB", label: "Type 1AB" },
  { id: "2", value: "1C", label: "Type 1C" },
  { id: "3", value: "Type 2", label: "Type 2" },
  { id: "4", value: "Type 3", label: "Type 3" },
];

const LEVELS = [
  { id: "1", value: "O/L", label: "O/L" },
  { id: "2", value: "A/L", label: "A/L" },
];

const QUALIFICATIONS = [
  { id: "1", value: "B.Ed", label: "B.Ed" },
  { id: "2", value: "PGDE", label: "PGDE" },
  { id: "3", value: "M.Ed", label: "M.Ed" },
  { id: "4", value: "B.Sc", label: "B.Sc" },
  { id: "5", value: "M.Sc", label: "M.Sc" },
  { id: "6", value: "Trained Graduate", label: "Trained Graduate" },
  { id: "7", value: "Untrained Graduate", label: "Untrained Graduate" },
  { id: "8", value: "NCOE", label: "NCOE" },
];

// Fetch data from backend (same as create)
const fetchBackendData = async (endpoint: string) => {
  try {
    const { refreshTokens } = useAuthStore.getState();
    let response = await apiFetch(endpoint, { method: "GET" });

    if (response.status === 401) {
      const refreshSuccess = await refreshTokens();
      if (refreshSuccess) {
        response = await apiFetch(endpoint, { method: "GET" });
      } else {
        throw new Error("Authentication failed");
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Handle different response structures
    if (result.data !== undefined) {
      if (Array.isArray(result.data)) {
        return result.data;
      }
      return result.data;
    } else if (Array.isArray(result)) {
      return result;
    }
    return result;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
};

export default function EditTransferRequest() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const transferId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Dropdown states
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownConfig, setDropdownConfig] = useState<DropdownConfig | null>(null);
  const [tempSelected, setTempSelected] = useState<string[]>([]);

  // Dynamic data from backend
  const [subjects, setSubjects] = useState<DropdownItem[]>([]);
  const [mediums, setMediums] = useState<DropdownItem[]>([]);
  const [zones, setZones] = useState<DropdownItem[]>([]);
  const [districts, setDistricts] = useState<DropdownItem[]>([]);

  // Form data (matching create structure)
  const [formData, setFormData] = useState<UpdateTransferRequestDto>({
    registrationId: "",
    currentSchool: "",
    currentSchoolType: "",
    currentDistrict: "",
    currentZone: "",
    fromZone: "",
    toZones: [],
    subject: "",
    medium: "",
    level: "",
    yearsOfService: 0,
    qualifications: [],
    isInternalTeacher: false,
    preferredSchoolTypes: [],
    additionalRequirements: "",
    notes: "",
  });

  // Errors state
  const [errors, setErrors] = useState<Partial<Record<keyof UpdateTransferRequestDto, string>>>({});

  // Fetch all required data
  const fetchAllData = async () => {
    try {
      console.log("📡 Fetching transfer form data...");

      // Fetch subjects
      try {
        const subjectsData = await fetchBackendData("/api/v1/subjects?isActive=true");
        const subjectsArray = Array.isArray(subjectsData)
          ? subjectsData
          : subjectsData?.data
            ? subjectsData.data
            : subjectsData?.subjects
              ? subjectsData.subjects
              : [];

        const subjectItems = subjectsArray
          .map((subject: any) => ({
            id: subject.id || subject._id || Math.random().toString(),
            value: subject.name || subject.value || "",
            label: subject.name || subject.value || "",
          }))
          .filter((item: DropdownItem) => item.value && item.label);

        setSubjects(subjectItems);
        console.log("✅ Subjects loaded:", subjectItems.length);
      } catch (error) {
        console.error("❌ Failed to fetch subjects:", error);
        setSubjects([]);
      }

      // Fetch mediums
      try {
        const mediumsData = await fetchBackendData("/api/v1/mediums");
        const mediumsArray = Array.isArray(mediumsData)
          ? mediumsData
          : mediumsData?.data
            ? mediumsData.data
            : mediumsData?.mediums
              ? mediumsData.mediums
              : [];

        const mediumItems = mediumsArray
          .map((medium: any) => ({
            id: medium.id || medium._id || Math.random().toString(),
            value: medium.name || medium.value || "",
            label: medium.name || medium.value || "",
          }))
          .filter((item: DropdownItem) => item.value && item.label);

        setMediums(mediumItems);
        console.log("✅ Mediums loaded:", mediumItems.length);
      } catch (error) {
        console.error("❌ Failed to fetch mediums:", error);
        setMediums([]);
      }

      // Fetch zones
      try {
        const zonesData = await fetchBackendData("/api/v1/admin/zones");
        const zonesArray = Array.isArray(zonesData)
          ? zonesData
          : zonesData?.data
            ? zonesData.data
            : zonesData?.zones
              ? zonesData.zones
              : [];

        const zoneItems = zonesArray
          .map((zone: any) => ({
            id: zone.id || zone._id || Math.random().toString(),
            value: zone.name || zone.value || "",
            label: zone.name || zone.value || "",
          }))
          .filter((item: DropdownItem) => item.value && item.label);

        setZones(zoneItems);
        console.log("✅ Zones loaded:", zoneItems.length);
      } catch (error) {
        console.error("❌ Failed to fetch zones:", error);
        setZones([]);
      }

      // Fetch districts
      try {
        const districtsData = await fetchBackendData("/api/v1/admin/districts");
        const districtsArray = Array.isArray(districtsData)
          ? districtsData
          : districtsData?.data
            ? districtsData.data
            : districtsData?.districts
              ? districtsData.districts
              : [];

        const districtItems = districtsArray
          .map((district: any) => ({
            id: district.id || district._id || Math.random().toString(),
            value: district.name || district.value || "",
            label: district.name || district.value || "",
          }))
          .filter((item: DropdownItem) => item.value && item.label);

        setDistricts(districtItems);
        console.log("✅ Districts loaded:", districtItems.length);
      } catch (error) {
        console.error("❌ Failed to fetch districts:", error);
        setDistricts([]);
      }
    } catch (error) {
      console.error("❌ Error fetching form data:", error);
    }
  };

  // Load transfer details
  const loadTransferDetails = async () => {
    try {
      console.log("📡 Loading transfer details for ID:", transferId);
      
      const response = await apiFetch(`/api/v1/transfer/${transferId}`, {
        method: "GET",
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          Alert.alert("Not Found", "Transfer request not found");
          router.back();
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      const data = result.data || result;
      
      console.log("📥 Transfer data received:", data);
      
      // Map data to form (matching create structure)
      setFormData({
        registrationId: data.registrationId || "",
        currentSchool: data.currentSchool || "",
        currentSchoolType: data.currentSchoolType || "",
        currentDistrict: data.currentDistrict || "",
        currentZone: data.currentZone || "",
        fromZone: data.fromZone || "",
        toZones: data.toZones || [],
        subject: data.subject || "",
        medium: data.medium || "",
        level: data.level || "",
        yearsOfService: data.yearsOfService || 0,
        qualifications: data.qualifications || [],
        isInternalTeacher: data.isInternalTeacher || false,
        preferredSchoolTypes: data.preferredSchoolTypes || [],
        additionalRequirements: data.additionalRequirements || "",
        notes: data.notes || "",
      });
      
    } catch (error: any) {
      console.error("❌ Failed to load transfer details:", error);
      
      if (error.message?.includes("401") || error.message?.includes("403")) {
        Alert.alert("Session Expired", "Your session has expired. Please sign in again.");
        useAuthStore.getState().signOut();
        router.replace("/(auth)/selectSignIn");
        return;
      }
      
      Alert.alert("Error", "Failed to load transfer details");
      throw error;
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Check authentication
        const authStore = useAuthStore.getState();
        if (!authStore.isSignedIn || !authStore.accessToken) {
          Alert.alert("Authentication Required", "Please sign in to edit transfer request");
          router.replace("/(auth)/selectSignIn");
          return;
        }

        // Load all data in parallel
        await Promise.all([
          fetchAllData(),
          loadTransferDetails()
        ]);
        
      } catch (error) {
        console.error("❌ Failed to load data:", error);
        Alert.alert("Error", "Failed to load transfer data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [transferId]);

  // Validate form - CRITICAL: matches backend validation (same as create)
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UpdateTransferRequestDto, string>> = {};

    // Required fields (same as backend)
    if (!formData.registrationId?.trim()) {
      newErrors.registrationId = "Registration ID is required";
    }

    if (!formData.currentSchool?.trim()) {
      newErrors.currentSchool = "Current school is required";
    }

    if (!formData.currentDistrict?.trim()) {
      newErrors.currentDistrict = "Current district is required";
    }

    if (!formData.currentZone?.trim()) {
      newErrors.currentZone = "Current zone is required";
    }

    if (!formData.fromZone?.trim()) {
      newErrors.fromZone = "From zone is required";
    }

    if (!formData.toZones || formData.toZones.length === 0) {
      newErrors.toZones = "At least one desired zone is required";
    }

    if (!formData.subject?.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (!formData.medium?.trim()) {
      newErrors.medium = "Medium is required";
    }

    if (!formData.level?.trim()) {
      newErrors.level = "Level is required";
    }

    // Validate years of service
    if (!formData.yearsOfService || formData.yearsOfService <= 0) {
      newErrors.yearsOfService = "Years of service must be greater than 0";
    }

    // Validate qualifications
    if (!formData.qualifications || formData.qualifications.length === 0) {
      newErrors.qualifications = "At least one qualification is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    try {
      // Validate form
      if (!validateForm()) {
        Alert.alert("Validation Error", "Please fill in all required fields correctly");
        return;
      }

      setSaving(true);

      // Prepare data EXACTLY as backend expects (same as create)
      const submitData = {
        registrationId: formData.registrationId?.trim(),
        currentSchool: formData.currentSchool?.trim(),
        currentSchoolType: formData.currentSchoolType?.trim() || undefined,
        currentDistrict: formData.currentDistrict?.trim(),
        currentZone: formData.currentZone?.trim(),
        fromZone: formData.fromZone?.trim(),
        toZones: formData.toZones?.map((zone: string) => zone.trim()),
        subject: formData.subject?.trim(),
        medium: formData.medium?.trim(),
        level: formData.level as "A/L" | "O/L",
        yearsOfService: Number(formData.yearsOfService) || 0,
        qualifications: formData.qualifications || [],
        isInternalTeacher: Boolean(formData.isInternalTeacher),
        preferredSchoolTypes: formData.preferredSchoolTypes || [],
        additionalRequirements: formData.additionalRequirements?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      };

      // Remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(submitData).filter(([_, v]) => v !== undefined)
      );

      console.log("📤 Updating transfer request:", JSON.stringify(cleanedData, null, 2));

      const response = await apiFetch(`/api/v1/transfer/${transferId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      });

      console.log("📥 Update response status:", response.status);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          console.log("📥 Error response:", errorData);

          // Handle specific backend errors
          if (errorData.errorCode === "ZONE_NOT_FOUND") {
            throw new Error(
              `Zone not found: ${errorData.message || "Please select a valid zone."}`
            );
          }

          errorMessage = errorData.message || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("✅ Update success:", result);

      Alert.alert(
        "Success!", 
        "Transfer request updated successfully",
        [
          {
            text: "View Request",
            onPress: () => router.replace(`/teacher/transfer/details?id=${transferId}`)
          },
          {
            text: "Back to List",
            onPress: () => router.push("/teacher/transfer/requests")
          }
        ]
      );
      
    } catch (error: any) {
      console.error("❌ Update error:", error);
      
      if (error.message?.includes("401") || error.message?.includes("403")) {
        Alert.alert("Session Expired", "Please sign in again.");
        useAuthStore.getState().signOut();
        router.replace("/(auth)/selectSignIn");
        return;
      }
      
      Alert.alert("Update Failed", error.message || "Failed to update transfer request.");
    } finally {
      setSaving(false);
    }
  };

  // Dropdown handlers (same as create)
  const handleDropdownSelect = (item: DropdownItem) => {
    if (dropdownConfig?.multiSelect) {
      const isSelected = tempSelected.includes(item.value);
      const newSelected = isSelected
        ? tempSelected.filter((v) => v !== item.value)
        : [...tempSelected, item.value];
      setTempSelected(newSelected);
    } else {
      dropdownConfig?.onSelect(item.value);
      setShowDropdown(false);
      setDropdownConfig(null);
    }
  };

  const showDropdownMenu = (
    items: DropdownItem[],
    selectedValues: string[],
    placeholder: string,
    multiSelect: boolean,
    onSelect: (value: string | string[]) => void
  ) => {
    setDropdownConfig({
      items,
      multiSelect,
      onSelect,
      selectedValues,
      placeholder,
    });
    setTempSelected(selectedValues);
    setShowDropdown(true);
  };

  const handleDropdownComplete = () => {
    if (dropdownConfig) {
      if (dropdownConfig.multiSelect) {
        dropdownConfig.onSelect(tempSelected);
      } else if (tempSelected.length > 0) {
        dropdownConfig.onSelect(tempSelected[0]);
      }
    }
    setShowDropdown(false);
    setDropdownConfig(null);
  };

  const handleDropdownCancel = () => {
    setShowDropdown(false);
    setDropdownConfig(null);
  };

  const getDisplayValue = (
    value: string | string[],
    items: DropdownItem[]
  ): string => {
    if (Array.isArray(value)) {
      if (value.length === 0) return "";
      return value
        .map((v) => items.find((i) => i.value === v)?.label || v)
        .join(", ");
    }
    return items.find((i) => i.value === value)?.label || value || "";
  };

  // Render form field component (same as create)
  const renderField = (
    label: string,
    value: any,
    fieldKey: keyof UpdateTransferRequestDto,
    icon?: React.ReactNode,
    type: "text" | "number" | "picker" | "multipicker" | "textarea" = "text",
    items?: DropdownItem[]
  ) => {
    const displayValue = getDisplayValue(value, items || []);
    const error = errors[fieldKey];

    if (type === "picker" || type === "multipicker") {
      return (
        <TouchableOpacity
          style={styles.fieldRow}
          onPress={() =>
            showDropdownMenu(
              items || [],
              Array.isArray(value) ? value : [value].filter(Boolean),
              `Select ${label.toLowerCase()}`,
              type === "multipicker",
              (selected) => {
                setFormData((prev) => ({ ...prev, [fieldKey]: selected }));
                if (errors[fieldKey]) {
                  setErrors((prev) => ({ ...prev, [fieldKey]: undefined }));
                }
              }
            )
          }
        >
          {icon && <View style={styles.fieldIcon}>{icon}</View>}
          <View style={styles.fieldContent}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={[styles.pickerField, error && styles.errorBorder]}>
              <Text
                style={
                  displayValue ? styles.pickerValue : styles.pickerPlaceholder
                }
              >
                {displayValue || `Select ${label}`}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        </TouchableOpacity>
      );
    }

    if (type === "textarea") {
      return (
        <View style={styles.fieldRow}>
          {icon && <View style={styles.fieldIcon}>{icon}</View>}
          <View style={styles.fieldContent}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
              style={[styles.textArea, error && styles.errorBorder]}
              value={value}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, [fieldKey]: text }));
                if (errors[fieldKey]) {
                  setErrors((prev) => ({ ...prev, [fieldKey]: undefined }));
                }
              }}
              placeholder={`Enter ${label.toLowerCase()}`}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.fieldRow}>
        {icon && <View style={styles.fieldIcon}>{icon}</View>}
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <TextInput
            style={[styles.textInput, error && styles.errorBorder]}
            value={value?.toString()}
            onChangeText={(text) => {
              if (type === "number") {
                const numValue = parseInt(text) || 0;
                setFormData((prev) => ({ ...prev, [fieldKey]: numValue }));
                if (numValue > 0 && errors[fieldKey]) {
                  setErrors((prev) => ({ ...prev, [fieldKey]: undefined }));
                }
              } else {
                setFormData((prev) => ({ ...prev, [fieldKey]: text }));
                if (errors[fieldKey]) {
                  setErrors((prev) => ({ ...prev, [fieldKey]: undefined }));
                }
              }
            }}
            placeholder={`Enter ${label.toLowerCase()}`}
            keyboardType={type === "number" ? "numeric" : "default"}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading transfer details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Edit Transfer Request</Text>
            <Text style={styles.headerSubtitle}>
              Update your transfer application
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionsBanner}>
          <View style={styles.instructionsContent}>
            <AlertCircle size={20} color="#4F46E5" />
            <View style={styles.instructionsText}>
              <Text style={styles.instructionsTitle}>Editing Mode</Text>
              <Text style={styles.instructionsSubtitle}>
                Update your transfer request. All fields marked with * are required.
              </Text>
            </View>
          </View>
        </View>

        {/* Registration & Service */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Registration & Service</Text>
          </View>

          <View style={styles.sectionBody}>
            {renderField(
              "Registration ID *",
              formData.registrationId,
              "registrationId",
              null,
              "text"
            )}

            {renderField(
              "Years of Service *",
              formData.yearsOfService,
              "yearsOfService",
              null,
              "number"
            )}
          </View>
        </View>

        {/* Current School */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <School size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Current School</Text>
          </View>

          <View style={styles.sectionBody}>
            {renderField(
              "School Name *",
              formData.currentSchool,
              "currentSchool",
              null,
              "text"
            )}

            {renderField(
              "School Type",
              formData.currentSchoolType,
              "currentSchoolType",
              null,
              "picker",
              SCHOOL_TYPES
            )}

            {renderField(
              "District *",
              formData.currentDistrict,
              "currentDistrict",
              <MapPin size={16} color="#6B7280" />,
              "picker",
              districts
            )}

            {renderField(
              "Zone *",
              formData.currentZone,
              "currentZone",
              <MapPin size={16} color="#6B7280" />,
              "picker",
              zones
            )}
          </View>
        </View>

        {/* Transfer Zones */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Transfer Zones</Text>
          </View>

          <View style={styles.sectionBody}>
            {renderField(
              "From Zone *",
              formData.fromZone,
              "fromZone",
              <MapPin size={16} color="#6B7280" />,
              "picker",
              zones
            )}

            {renderField(
              "To Zones *",
              formData.toZones,
              "toZones",
              <MapPin size={16} color="#6B7280" />,
              "multipicker",
              zones
            )}
          </View>
        </View>

        {/* Teaching Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BookOpen size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Teaching Details</Text>
          </View>

          <View style={styles.sectionBody}>
            {renderField(
              "Subject *",
              formData.subject,
              "subject",
              null,
              "picker",
              subjects
            )}

            {renderField(
              "Medium *",
              formData.medium,
              "medium",
              null,
              "picker",
              mediums
            )}

            {renderField(
              "Level *",
              formData.level,
              "level",
              null,
              "picker",
              LEVELS
            )}

            {renderField(
              "Qualifications *",
              formData.qualifications,
              "qualifications",
              <Award size={16} color="#6B7280" />,
              "multipicker",
              QUALIFICATIONS
            )}
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageSquare size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Additional Information</Text>
          </View>

          <View style={styles.sectionBody}>
            {renderField(
              "Additional Requirements",
              formData.additionalRequirements,
              "additionalRequirements",
              null,
              "textarea"
            )}

            {renderField("Notes", formData.notes, "notes", null, "textarea")}
          </View>
        </View>

        {/* Internal Teacher Toggle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageSquare size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Internal Teacher</Text>
            <Switch
              value={formData.isInternalTeacher}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, isInternalTeacher: value }))
              }
              trackColor={{ false: "#E5E7EB", true: "#4F46E5" }}
              thumbColor="#fff"
              style={{ marginLeft: "auto" }}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, saving && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" style={styles.submitIcon} />
              <Text style={styles.submitButtonText}>
                Update Transfer Request
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={handleDropdownCancel}
      >
        <TouchableWithoutFeedback onPress={handleDropdownCancel}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownContainer}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownTitle}>
                    {dropdownConfig?.placeholder}
                  </Text>
                  <TouchableOpacity onPress={handleDropdownCancel}>
                    <X size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={dropdownConfig?.items || []}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        tempSelected.includes(item.value) &&
                          styles.dropdownItemSelected,
                      ]}
                      onPress={() => handleDropdownSelect(item)}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          tempSelected.includes(item.value) &&
                            styles.dropdownItemTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {tempSelected.includes(item.value) && (
                        <Check size={20} color="#4F46E5" />
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.dropdownList}
                  contentContainerStyle={styles.dropdownListContent}
                />

                {dropdownConfig?.multiSelect && (
                  <View style={styles.dropdownFooter}>
                    <TouchableOpacity
                      style={styles.dropdownCancelButton}
                      onPress={handleDropdownCancel}
                    >
                      <Text style={styles.dropdownCancelButtonText}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownDoneButton}
                      onPress={handleDropdownComplete}
                    >
                      <Text style={styles.dropdownDoneButtonText}>
                        Select ({tempSelected.length})
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  instructionsBanner: {
    backgroundColor: "#EEF2FF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  instructionsContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  instructionsText: {
    marginLeft: 12,
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
  },
  instructionsSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 12,
  },
  sectionBody: {
    paddingTop: 8,
  },
  fieldRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 6,
  },
  textInput: {
    fontSize: 16,
    color: "#111827",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  textArea: {
    fontSize: 16,
    color: "#111827",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 100,
  },
  pickerField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pickerValue: {
    fontSize: 16,
    color: "#111827",
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: width - 40,
    maxHeight: "80%",
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  dropdownList: {
    maxHeight: 400,
  },
  dropdownListContent: {
    paddingVertical: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemSelected: {
    backgroundColor: "#F5F3FF",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#111827",
  },
  dropdownItemTextSelected: {
    color: "#4F46E5",
  },
  dropdownFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  dropdownCancelButton: {
    flex: 1,
    padding: 14,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    alignItems: "center",
  },
  dropdownCancelButtonText: {
    fontSize: 16,
    color: "#6B7280",
  },
  dropdownDoneButton: {
    flex: 1,
    padding: 14,
    backgroundColor: "#4F46E5",
    borderRadius: 8,
    alignItems: "center",
  },
  dropdownDoneButtonText: {
    fontSize: 16,
    color: "#fff",
  },
  errorBorder: {
    borderColor: "#EF4444",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: "#4F46E5",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  submitIcon: {
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 32,
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
});