// Static editorial content for the Brow Beauty Hub design.
// Anything that already lives in the database (services, products,
// reviews, homepage stats) is fetched — this file only holds the copy the
// mockup introduced and the CMS has no field for.

export const heroStatsFallback = [
  { id: 1, value: "5000", suffix: "+", label: "Happy clients" },
  { id: 2, value: "3", suffix: "", label: "Suburbs in Sydney" },
  { id: 3, value: "10", suffix: "+", label: "Specialist therapists" },
  { id: 4, value: "20", suffix: "+", label: "Beauty treatments" },
];

export const introSentence =
  "Brow Beauty Hub is a Sydney studio of precision artists who read bone structure before touching a single hair — turning ninety careful minutes into six weeks of ease.";

// Word index after which each inline image pill is dropped into the
// highlight paragraph above.
export const introPills = [
  { after: 8, image: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=300&q=80", alt: "Brow macro" },
  { after: 20, image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&q=80", alt: "Studio detail" },
];

export const values = [
  "Precision techniques",
  "Premium products",
  "Clean & hygienic",
  "Personalised care",
  "Results-driven",
  "Consistent standards",
];

export const glimpseCards = [
  {
    key: "brows",
    chip: "Brows",
    title: ["Mapped to bone", "structure, not trend"],
    copy: "Calipers and thread before a single hair moves.",
    variant: "ink" as const,
    image: null,
  },
  {
    key: "lashes",
    chip: "Lashes",
    title: ["Built lash by lash,", "never in a strip"],
    copy: "Classic through mega volume, weighted to your natural line.",
    variant: "photo" as const,
    image:
      "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=800&q=80",
  },
  {
    key: "skin",
    chip: "Skin",
    title: ["Skin read first,", "treated second"],
    copy: "Hydrafacial, dermaplaning and LED, chosen per face.",
    variant: "photo" as const,
    image:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80",
  },
  {
    key: "henna",
    chip: "Henna",
    title: ["Colour matched", "two shades under"],
    copy: "Plant-based pigment that stains the skin beneath.",
    variant: "pale" as const,
    image: null,
  },
];

export const contactRows = [
  {
    label: "Call us",
    value:
      "Roselands 0426 962 461 · Hurstville 0414 205 503 · Hornsby 02 8417 0814",
    mark: "☏",
  },
  {
    label: "4 studios",
    value: "Roselands · Hurstville Level 2 & 3 · Hornsby",
    mark: "✳",
  },
  {
    label: "Opening hours",
    value: "Mon–Sat 9am – 7pm · Sun 10am – 5pm",
    mark: "◷",
  },
];

export const lookbookFilters = [
  { key: "all", label: "All" },
  { key: "Brow Services", label: "Brows" },
  { key: "Lash Services", label: "Lashes" },
  { key: "Skin Treatments", label: "Skin" },
];

export const lookbookShots = [
  {
    tag: "Brow threading & shaping",
    studio: "Roselands",
    height: 380,
    cat: "Brow Services",
    image:
      "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=700&q=80",
  },
  {
    tag: "Volume lash set",
    studio: "Hurstville",
    height: 260,
    cat: "Lash Services",
    image:
      "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=700&q=80",
  },
  {
    tag: "Hydrafacial",
    studio: "Hornsby",
    height: 320,
    cat: "Skin Treatments",
    image:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=700&q=80",
  },
  {
    tag: "Brow henna",
    studio: "Hurstville",
    height: 300,
    cat: "Brow Services",
    image:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=700&q=80",
  },
  {
    tag: "Lash lift & tint",
    studio: "Roselands",
    height: 400,
    cat: "Lash Services",
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=700&q=80",
  },
  {
    tag: "Brow & lash tint",
    studio: "Hornsby",
    height: 270,
    cat: "Brow Services",
    image:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=700&q=80",
  },
  {
    tag: "Bridal henna",
    studio: "Hurstville",
    height: 340,
    cat: "Skin Treatments",
    image:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=700&q=80",
  },
  {
    tag: "Face waxing",
    studio: "Roselands",
    height: 250,
    cat: "Skin Treatments",
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=700&q=80",
  },
  {
    tag: "Warm oil head massage",
    studio: "Hornsby",
    height: 360,
    cat: "Lash Services",
    image:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=700&q=80",
  },
];

export const milestones = [
  {
    year: "2018",
    title: "One chair in Roselands",
    copy: "Threading and brow shaping only, six days a week, entirely by word of mouth.",
  },
  {
    year: "2020",
    title: "Lashes and skin added",
    copy: "Two specialist therapists joined and the service menu doubled — the waitlist did not shrink.",
  },
  {
    year: "2023",
    title: "Hurstville, twice over",
    copy: "Level 2 opened in autumn and filled so quickly that Level 3 followed within the year.",
  },
  {
    year: "2026",
    title: "Four studios, one standard",
    copy: "Hornsby opened with the same rule as the first chair: one artist per guest, start to finish.",
  },
];

export const team = [
  {
    name: "Simran",
    role: "Founder · Brow artist",
    studio: "Roselands",
    image:
      "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=600&q=80",
  },
  {
    name: "Aleena",
    role: "Lead lash technician",
    studio: "Hurstville",
    image:
      "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=600&q=80",
  },
  {
    name: "Mei",
    role: "Skin therapist",
    studio: "Hornsby",
    image:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80",
  },
  {
    name: "Ravneet",
    role: "Henna artist",
    studio: "Hurstville",
    image:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80",
  },
];

export const principles = [
  {
    no: "01",
    title: "Mapped, not guessed",
    copy: "Calipers and a consultation before a single hair moves — shape follows bone structure.",
  },
  {
    no: "02",
    title: "One artist per guest",
    copy: "The person who consults you finishes you. No hand-offs mid-appointment.",
  },
  {
    no: "03",
    title: "Clinical hygiene",
    copy: "Single-use tools, hospital-grade sterilisation, documented between every guest.",
  },
  {
    no: "04",
    title: "Premium products only",
    copy: "Professional lines we can stand behind — and sell you only if you need them.",
  },
  {
    no: "05",
    title: "Honest timing",
    copy: "We book realistic windows so nobody is rushed, including the therapist.",
  },
  {
    no: "06",
    title: "Same across four studios",
    copy: "Every artist trains in-house so the result does not depend on which centre you visit.",
  },
];

export const shopPerks = [
  {
    mark: "✳",
    title: "Studio-tested only",
    copy: "If it is not on our trolley, it is not on the shelf.",
  },
  {
    mark: "☏",
    title: "Free studio pick-up",
    copy: "Collect from Roselands, Hurstville or Hornsby the same day.",
  },
  {
    mark: "◷",
    title: "Routine, not a haul",
    copy: "Therapists will happily talk you out of what you do not need.",
  },
];
