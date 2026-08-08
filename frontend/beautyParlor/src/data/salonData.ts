// Studio contact details. The bookable menu, the studio list and the roster all
// come from the API now (see api/bookingApi.ts) — this is only the copy that
// has no database field.

export const BIZ = {
  phone: "+61 424 638 413",
  tel: "tel:+61424638413",
  email: "eyebrowbeautyhub@gmail.com",
  policy: "No booking needed for brow shaping — walk in any time.",
};

export const TREATMENT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80";

// One picture per menu category. Treatments carry no image column — a
// per-treatment shoot is not something the studio would ever keep current.
export const TREATMENT_IMAGE: Record<string, string> = {
  "BROW TATTOO":
    "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=900&q=80",
  "BROW LAMINATION":
    "https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=900&q=80",
  "BROW HENNA (VEGAN)":
    "https://images.unsplash.com/photo-1595475207225-428b62bda831?w=900&q=80",
  TINT: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=900&q=80",
  "EYELASH EXTENSION":
    "https://images.unsplash.com/photo-1583241800698-e8ab01c85729?w=900&q=80",
  "LASH LIFT":
    "https://images.unsplash.com/photo-1590156206657-aec9b1e8d2ce?w=900&q=80",
  "ASAP FACIALS (AUSTRALIAN KIT)":
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&q=80",
  "HYDRA FACIAL":
    "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=900&q=80",
  "HERBAL FACIALS (INDIAN KIT)":
    "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=900&q=80",
  WAXING:
    "https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=900&q=80",
  "HENNA MEHENDI":
    "https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?w=900&q=80",
  MAKEUP:
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=900&q=80",
  "OIL HEAD MASSAGE":
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=900&q=80",
};

export const treatmentImage = (label: string) =>
  TREATMENT_IMAGE[label] || TREATMENT_FALLBACK_IMAGE;
