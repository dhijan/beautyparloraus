// Seed data for the studio side: the four studios, the bookable menu, the
// therapist roster and the opening stock take. Used by seed-salon.js, and the
// studio list is served to the client so the frontend has no second copy.

const STUDIOS = [
  {
    k: "R",
    no: "01",
    name: "Roselands Shopping Centre",
    short: "Roselands",
    address: "Level 2, 1128 Canterbury Rd, Roselands NSW 2196",
    hours: "Mon–Fri from 9:30 · Thu to 9pm · Sat 9–5 · Sun 10–5",
  },
  {
    k: "H2",
    no: "02",
    name: "Hurstville Westfield · Level 2",
    short: "Hurstville L2",
    address: "Westfield Hurstville, Level 2, Park Rd, NSW 2220",
    hours: "Mon–Fri from 9:30 · Thu to 9pm · Sat 9–5 · Sun 10–5",
  },
  {
    k: "H3",
    no: "03",
    name: "Hurstville Westfield · Level 3",
    short: "Hurstville L3",
    address: "Westfield Hurstville, Level 3, Shop 437, NSW 2220",
    hours: "Mon–Fri from 9:30 · Thu to 9pm · Sat 9–5 · Sun 10–5",
  },
  {
    k: "HB",
    no: "04",
    name: "Hornsby Westfield",
    short: "Hornsby",
    address: "Level 1, 236 Pacific Highway, Hornsby NSW 2077",
    hours: "Mon–Fri from 9:30 · Thu to 9pm · Sat 9–5 · Sun 10–5",
  },
];

// [label, title, minutes, price, description]
const MENU_ROWS = [
  ["BROW TATTOO", "Nano Brow Tattoo", 120, 600, "Ultra-fine digital hairstrokes that mimic real brow hairs — gentler than microblading, lasting two to three years."],
  ["BROW TATTOO", "Ombre Brow Tattoo", 120, 550, "Soft powdery shading, light at the front through to a defined tail. Two to three years with touch-ups."],
  ["BROW LAMINATION", "Brow Lamination", 40, 99, "Includes complimentary brow shaping and tint."],
  ["BROW HENNA (VEGAN)", "Brow Henna", 20, 35, "Vegan plant pigment that stains skin and hair for a fuller brow."],
  ["TINT", "Eyebrow Tint", 15, 20, ""],
  ["TINT", "Eyelash Tint", 15, 20, ""],
  ["TINT", "Brow and Lash Tint Combo", 30, 35, ""],
  ["EYELASH EXTENSION", "Classic Lash Extension", 60, 120, ""],
  ["EYELASH EXTENSION", "Lash Extension Volume 3D", 60, 150, ""],
  ["EYELASH EXTENSION", "Lash Extension Mega Volume 3D/5D", 60, 180, ""],
  ["EYELASH EXTENSION", "In-fills Eyelash Extension", 30, 70, ""],
  ["LASH LIFT", "Lash Lift", 30, 80, ""],
  ["LASH LIFT", "Lash Lift and Lash Tint", 40, 90, ""],
  ["ASAP FACIALS (AUSTRALIAN KIT)", "asap Express Facial", 30, 75, "Double cleanse, exfoliation, brush-on mask, hydrators and SPF for all skin types."],
  ["ASAP FACIALS (AUSTRALIAN KIT)", "asap DNA Regeneration Treatment", 45, 130, "Telomere technology and active complexes to help repair cellular DNA damage."],
  ["ASAP FACIALS (AUSTRALIAN KIT)", "asap Boost and Brighten Facial", 45, 130, "Actives and antioxidants promote cell turnover, stimulate collagen and reduce pigmentation."],
  ["ASAP FACIALS (AUSTRALIAN KIT)", "asap Ultimate Hydration Facial", 60, 130, "Deeply hydrating facial that plumps dull, dehydrated skin."],
  ["ASAP FACIALS (AUSTRALIAN KIT)", "asap Relaxing Deluxe Facial", 60, 130, "Steamer, double cleanse, extractions, massage, firming eye lift, hydrators and SPF."],
  ["ASAP FACIALS (AUSTRALIAN KIT)", "asap Anti-ageing Treatment Facial", 60, 130, "Massage with asap super A, B and C serums to soften fine lines and even tone."],
  ["ASAP FACIALS (AUSTRALIAN KIT)", "asap Antioxidant Facial", 60, 130, "Combats pollution and free radicals — suited to sensitive and dry skin."],
  ["ASAP FACIALS (AUSTRALIAN KIT)", "Corrective Advanced Facial with Frimator Resurfacing", 60, 130, "Double cleanse, Frimator exfoliation, extraction, massage, mask, hydrators and SPF."],
  ["ASAP FACIALS (AUSTRALIAN KIT)", "Corrective Advanced Facial with Ultrasonic Scrubber", 60, 130, "Ultrasonic cleansing lifts dead skin and boosts circulation and cell metabolism."],
  ["ASAP FACIALS (AUSTRALIAN KIT)", "Microdermabrasion with Deluxe Facial", 60, 130, "Diamond-tip microdermabrasion and vacuum suction to stimulate collagen."],
  ["ASAP FACIALS (AUSTRALIAN KIT)", "Non-surgical Anti-ageing Lifting Facial (Sonophoresis)", 60, 130, "Coenzyme Q10 lifting with ultrasonic technology to support collagen and elastin."],
  ["ASAP FACIALS (AUSTRALIAN KIT)", "Microdermabrasion & Sonophoresis Infusion", 60, 180, "Vitamin infusion driven deeper with warmth, motion and ultrasonic energy."],
  ["HYDRA FACIAL", "Hydra Facial", 60, 180, "Contact the studio to choose the correct type for your skin."],
  ["HERBAL FACIALS (INDIAN KIT)", "24K Gold Facial Treatment", 60, 110, "Antioxidant and mineral rich — slows collagen depletion and softens fine lines."],
  ["HERBAL FACIALS (INDIAN KIT)", "Exfoliating & Anti-ageing Diamond Facial", 60, 110, "Deep exfoliation for youthful radiance and cellular regeneration."],
  ["WAXING", "Forehead", 10, 10, ""],
  ["WAXING", "Neck", 10, 15, ""],
  ["WAXING", "Chin", 5, 15, ""],
  ["WAXING", "Under Arm", 15, 18, ""],
  ["WAXING", "Half Arm", 15, 20, ""],
  ["WAXING", "Lower Half Leg", 20, 30, ""],
  ["WAXING", "Top Half Leg", 20, 35, ""],
  ["WAXING", "Full Arm", 20, 35, ""],
  ["WAXING", "Full Leg", 30, 50, ""],
  ["WAXING", "Full Face (No Forehead)", 30, 55, ""],
  ["WAXING", "Full Face", 30, 65, ""],
  ["HENNA MEHENDI", "Small Design (One Hand)", 15, 25, ""],
  ["HENNA MEHENDI", "Medium Design (One Hand)", 20, 40, ""],
  ["HENNA MEHENDI", "Large Design (One Hand)", 30, 60, ""],
  ["MAKEUP", "Formal Makeup", 45, 80, ""],
  ["MAKEUP", "Party Makeup", 60, 120, "Price confirmed on booking."],
  ["MAKEUP", "Bridal Makeup", 120, 200, ""],
  ["OIL HEAD MASSAGE", "Oil Head Massage with Steam", 30, 75, ""],
];

const TREATMENTS = MENU_ROWS.map((row, index) => ({
  number: String(index + 1).padStart(2, "0"),
  label: row[0],
  title: row[1],
  dur: row[2],
  price: row[3],
  description: row[4],
}));

// Trading window per weekday index (0 = Sunday). Every therapist starts on it;
// the roster view edits each person's copy from there.
const TRADING_HOURS = {
  0: ["10:00", "17:00"],
  1: ["9:30", "17:30"],
  2: ["9:30", "17:30"],
  3: ["9:30", "17:30"],
  4: ["9:30", "21:00"],
  5: ["9:30", "17:30"],
  6: ["9:00", "17:00"],
};

const STAFF = [
  ["s1", "Simran", "Founder · Brow artist", "R", ["BROW TATTOO", "BROW LAMINATION", "BROW HENNA (VEGAN)", "TINT", "WAXING"]],
  ["s2", "Nadia", "Lash & skin therapist", "R", ["EYELASH EXTENSION", "LASH LIFT", "TINT", "ASAP FACIALS (AUSTRALIAN KIT)", "OIL HEAD MASSAGE", "MAKEUP"]],
  ["s3", "Aleena", "Lead lash technician", "H2", ["EYELASH EXTENSION", "LASH LIFT", "TINT", "BROW LAMINATION"]],
  ["s4", "Tara", "Brow & waxing specialist", "H2", ["WAXING", "BROW HENNA (VEGAN)", "TINT", "HENNA MEHENDI", "MAKEUP", "OIL HEAD MASSAGE"]],
  ["s5", "Ravneet", "Henna & makeup artist", "H3", ["HENNA MEHENDI", "BROW HENNA (VEGAN)", "MAKEUP", "BROW TATTOO", "BROW LAMINATION"]],
  ["s6", "Yasmin", "Skin therapist", "H3", ["ASAP FACIALS (AUSTRALIAN KIT)", "HYDRA FACIAL", "HERBAL FACIALS (INDIAN KIT)", "WAXING", "TINT", "EYELASH EXTENSION", "LASH LIFT"]],
  ["s7", "Mei", "Senior skin therapist", "HB", ["HYDRA FACIAL", "ASAP FACIALS (AUSTRALIAN KIT)", "HERBAL FACIALS (INDIAN KIT)", "OIL HEAD MASSAGE", "EYELASH EXTENSION", "LASH LIFT"]],
  ["s8", "Hana", "Brow artist", "HB", ["BROW TATTOO", "BROW LAMINATION", "TINT", "BROW HENNA (VEGAN)", "MAKEUP", "WAXING", "HENNA MEHENDI"]],
].map(([id, name, role, studio, cats]) => ({
  id,
  name,
  role,
  studio,
  cats,
  hours: TRADING_HOURS,
}));

// [name, category, sku, unit, cost, retail, par, supplier, [R, H2, H3, HB]]
const INVENTORY = [
  ["Eyebrow Gel", "Retail", "RT-BRW-01", "9ml tube", 12, 30, 8, "Lash & Brow Wholesale", [16, 11, 7, 4]],
  ["Brow Growth Serum", "Retail", "RT-BRW-02", "5ml bottle", 28, 69, 6, "Lash & Brow Wholesale", [9, 5, 3, 6]],
  ["Lash Growth Serum", "Retail", "RT-LSH-01", "5ml bottle", 36, 89, 6, "Lash & Brow Wholesale", [7, 2, 5, 3]],
  ["Lash Cleansing Foam", "Retail", "RT-LSH-02", "60ml pump", 14, 35, 10, "Lash & Brow Wholesale", [18, 12, 0, 9]],
  ["Vitamin C Brightening Serum", "Retail", "RT-SKN-01", "30ml bottle", 52, 129, 5, "ASAP Skincare AU", [6, 4, 4, 2]],
  ["50+ SPF Hydrating Defence", "Retail", "RT-SKN-02", "75ml tube", 31, 75, 8, "ASAP Skincare AU", [11, 8, 6, 8]],
  ["Ceramide Repair Cleanser", "Retail", "RT-SKN-03", "150ml bottle", 24, 58, 6, "ASAP Skincare AU", [5, 6, 2, 4]],
  ["Post-Treatment Aftercare Kit", "Retail", "RT-KIT-01", "4-piece box", 26, 65, 6, "In-house assembly", [12, 7, 9, 5]],
  ["Henna Aftercare Balm", "Retail", "RT-KIT-02", "15g tin", 9, 28, 10, "Mehendi Supply Co", [14, 3, 11, 2]],
  ["Hard wax beads", "Back bar", "BB-WAX-01", "1kg bag", 22, 0, 4, "Waxing Warehouse", [6, 3, 2, 1]],
  ["Threading cotton spools", "Back bar", "BB-THR-01", "pack of 12", 8, 0, 6, "Waxing Warehouse", [9, 7, 4, 0]],
  ["Lash adhesive 0.5s", "Back bar", "BB-LSH-01", "5ml bottle", 34, 0, 3, "Lash & Brow Wholesale", [4, 2, 3, 1]],
  ["Volume lash trays 0.07", "Back bar", "BB-LSH-02", "mixed tray", 19, 0, 8, "Lash & Brow Wholesale", [14, 9, 10, 6]],
  ["Brow tint sachets", "Back bar", "BB-TNT-01", "box of 10", 16, 0, 5, "Lash & Brow Wholesale", [7, 4, 1, 3]],
  ["Hydrafacial tips", "Back bar", "BB-HYD-01", "pack of 25", 44, 0, 2, "HydraTech AU", [3, 0, 2, 4]],
  ["Vegan henna cones", "Back bar", "BB-HNA-01", "6 x 50g", 21, 0, 4, "Mehendi Supply Co", [5, 6, 8, 2]],
  ["Nitrile gloves S/M", "Back bar", "BB-GEN-01", "box of 100", 13, 0, 6, "Clinic Essentials", [10, 8, 7, 5]],
  ["Disposable mascara wands", "Back bar", "BB-GEN-02", "pack of 50", 6, 0, 6, "Clinic Essentials", [12, 2, 9, 7]],
].map((row, index) => ({
  id: `i${index + 1}`,
  name: row[0],
  cat: row[1],
  sku: row[2],
  unit: row[3],
  cost: row[4],
  retail: row[5],
  par: row[6],
  supplier: row[7],
  stock: { R: row[8][0], H2: row[8][1], H3: row[8][2], HB: row[8][3] },
}));

module.exports = { STUDIOS, TREATMENTS, STAFF, INVENTORY, TRADING_HOURS };
