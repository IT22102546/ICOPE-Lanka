const SRI_LANKA_LOCATIONS = {
  Central: ["Kandy", "Matale", "Nuwara Eliya"],
  Eastern: ["Ampara", "Batticaloa", "Trincomalee"],
  "North Central": ["Anuradhapura", "Polonnaruwa"],
  Northern: ["Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"],
  "North Western": ["Kurunegala", "Puttalam"],
  Sabaragamuwa: ["Kegalle", "Ratnapura"],
  Southern: ["Galle", "Hambantota", "Matara"],
  Uva: ["Badulla", "Monaragala"],
  Western: ["Colombo", "Gampaha", "Kalutara"],
};

const PROVINCES = Object.keys(SRI_LANKA_LOCATIONS);

const isValidProvinceDistrict = (province, district) => {
  if (!province || !district) {
    return false;
  }

  const districts = SRI_LANKA_LOCATIONS[province];
  if (!districts) {
    return false;
  }

  return districts.includes(district);
};

export { PROVINCES, SRI_LANKA_LOCATIONS, isValidProvinceDistrict };