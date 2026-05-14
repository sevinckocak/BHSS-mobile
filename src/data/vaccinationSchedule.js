export const VACCINATION_SCHEDULE = [
  {
    id: "newborn_0_7_days",
    ageRange: "0-7 gün",
    title: "Yeni Doğan Dönem",
    vaccines: [
      { vaccineId: "ecoli", name: "E. coli", required: false },
      { vaccineId: "rota_corona", name: "Rota/Corona", required: false },
    ],
    notes: "Kolostrum çok kritik. İshal riskine karşı koruma.",
  },

  {
    id: "calf_2_4_weeks",
    ageRange: "2-4 hafta",
    title: "Erken Buzağı Dönemi",
    vaccines: [
      { vaccineId: "ibr", name: "IBR (ilk doz)" },
      { vaccineId: "bvd", name: "BVD (ilk doz)" },
      { vaccineId: "pasteurella", name: "Pasteurella" },
    ],
    notes: "Solunum yolu hastalıklarına karşı koruma başlar.",
  },

  {
    id: "calf_2_3_months",
    ageRange: "2-3 ay",
    title: "Buzağı Dönemi",
    vaccines: [
      { vaccineId: "sarbon", name: "Şarbon", condition: "risk_area" },
      { vaccineId: "enterotoksemi", name: "Enterotoksemi (Clostridial)" },
    ],
    notes: "Bölgesel risk varsa şarbon uygulanır.",
  },

  {
    id: "young_6_months",
    ageRange: "6 ay",
    title: "Genç Hayvan Dönemi",
    vaccines: [
      { vaccineId: "ibr", name: "IBR rapel (2. doz)" },
      { vaccineId: "bvd", name: "BVD rapel (2. doz)" },
      { vaccineId: "pasteurella", name: "Pasteurella rapel" },
    ],
    notes: "Bağışıklık güçlendirme dönemi.",
  },

  {
    id: "brucella_6_8_months",
    ageRange: "6-8 ay (Dişi)",
    title: "Brusella Aşılama",
    vaccines: [
      {
        vaccineId: "brusella",
        name: "Brusella (tek doz)",
        gender: "female_only",
      },
    ],
    notes: "Sadece dişi buzağılara uygulanır.",
  },

  {
    id: "young_6_12_months",
    ageRange: "6-12 ay",
    title: "Genç Sığır Dönemi",
    vaccines: [
      { vaccineId: "lsd", name: "LSD (Sığır Çiçeği)" },
      { vaccineId: "leptospiroz", name: "Leptospiroz (ilk doz)" },
      { vaccineId: "fmd", name: "Şap (FMD)" },
    ],
    notes: "6 ayda bir şap tekrarı gerekir.",
  },

  {
    id: "adult_12_18_months",
    ageRange: "12-18 ay",
    title: "Erginleşme Dönemi",
    vaccines: [
      { vaccineId: "fmd", name: "Şap (rapel)" },
      { vaccineId: "ibr", name: "IBR rapel" },
      { vaccineId: "bvd", name: "BVD rapel" },
      { vaccineId: "leptospiroz", name: "Leptospiroz rapel" },
    ],
    notes: "Rutin bağışıklık döngüsü başlar.",
  },

  {
    id: "adult_18_months_plus",
    ageRange: "18 ay+ (erişkin inek)",
    title: "Süt ve Damızlık Dönemi",
    vaccines: [
      { vaccineId: "fmd", name: "Şap (her 6 ay)" },
      { vaccineId: "leptospiroz", name: "Leptospiroz (yıllık)" },
      { vaccineId: "sarbon", name: "Şarbon (yıllık - riskli bölgede)" },
      { vaccineId: "ibr", name: "IBR (yıllık/6 aylık)" },
      { vaccineId: "bvd", name: "BVD (yıllık/6 aylık)" },
    ],
    notes: "Rutin sürü yönetimi dönemi.",
  },
];
