export const TOKEN_KEY = "icope_admin_token";
export const THEME_KEY = "icope_admin_theme";
export const USER_KEY  = "icope_admin_user";

export const ADMIN_NAV = [
  { key: "overview",         label: "Overview",          icon: "Grid"      },
  { key: "physiotherapists", label: "Health Care Professionals",  icon: "Users"     },
  { key: "my-patients",      label: "My Patients",       icon: "Person"    },
  { key: "patients",         label: "All Patients",      icon: "UserGroup" },
  { key: "assessments",      label: "Assessments",       icon: "Steth"     },
];

export const PHYSIO_NAV = [
  { key: "my-patients",    label: "My Patients",  icon: "Person" },
  { key: "my-assessments", label: "Assessments",  icon: "Steth"  },
];

/** Backward compat — defaults to admin nav */
export const NAV_ITEMS = ADMIN_NAV;

export const STATUS_COLOR = {
  Normal:                "teal",
  "Mild Impairment":     "blue",
  "Moderate Impairment": "amber",
  "Severe Impairment":   "red",
  "Not Assessed":        "grey",
  "—":                   "grey",
  "Mild Loss":           "blue",
  "Moderate Loss":       "amber",
  "Severe Loss":         "red",
  "At Risk":             "amber",
  Malnourished:          "red",
  "Possible Depression": "amber",
  Depression:            "red",
  "Mild Limitation":     "blue",
  "Moderate Limitation": "amber",
  "Severe Limitation":   "red",
};
