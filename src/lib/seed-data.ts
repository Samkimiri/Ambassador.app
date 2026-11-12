import {
  AmbassadorApplication,
  AmbassadorProfile,
  Announcement,
  AppNotification,
  AuditLog,
  Badge,
  Campaign,
  CommissionEntry,
  Course,
  Enrolment,
  MarketingAsset,
  PayoutRequest,
  PointsLedgerEntry,
  Profile,
  Referral,
  RewardRuleConfig,
  SupportRequest,
  TrashItem,
} from "@/types";

export interface AppDatabaseState {
  profiles: Profile[];
  applications: AmbassadorApplication[];
  ambassadors: AmbassadorProfile[];
  courses: Course[];
  campaigns: Campaign[];
  referrals: Referral[];
  enrolments: Enrolment[];
  rewardRules: RewardRuleConfig;
  pointsLedger: PointsLedgerEntry[];
  commissions: CommissionEntry[];
  payoutRequests: PayoutRequest[];
  marketingAssets: MarketingAsset[];
  badges: Badge[];
  announcements: Announcement[];
  notifications: AppNotification[];
  supportRequests: SupportRequest[];
  auditLogs: AuditLog[];
  deletedApplicationIds?: string[];
  deletedUserIds?: string[];
  deletedEntityIds?: string[];
  deletedTrashIds?: string[];
  trash?: TrashItem[];
}

export const INITIAL_REWARD_RULES: RewardRuleConfig = {
  id: "rule-default-1",
  code: "default_policy",
  name: "SCDS Standard Ambassador Growth Policy (Configurable Example)",
  description:
    "Example default configuration for SCDS Ambassador Hub. Administrators can adjust points, commission rates, attribution window, and payout thresholds at any time.",
  currency: "KES",
  pointsPerClick: 0, // Link clicks never earn enrolment points
  pointsPerQualifiedLead: 25,
  pointsPerVerifiedEnrolment: 250,
  defaultCommissionPct: 15,
  minPayoutKes: 1000,
  attributionWindowDays: 30,
  isBusinessPolicyConfirmed: false,
  updatedAt: "2026-10-12T08:00:00Z",
  levelThresholds: [
    {
      level: "Starter",
      minPoints: 0,
      minEnrolments: 0,
      commissionPct: 15,
      perks: [
        "Unique SCDS referral code & link",
        "Official marketing resource access",
        "15% base tuition commission on verified enrolments",
      ],
    },
    {
      level: "Bronze",
      minPoints: 500,
      minEnrolments: 3,
      commissionPct: 17,
      perks: [
        "17% commission rate on verified enrolments",
        "Bronze Ambassador digital badge",
        "Priority admission support for referred learners",
      ],
    },
    {
      level: "Silver",
      minPoints: 1500,
      minEnrolments: 8,
      commissionPct: 20,
      perks: [
        "20% commission rate on verified enrolments",
        "50% scholarship voucher on 1 SCDS course",
        "Featured on SCDS Monthly Top Ambassadors",
      ],
    },
    {
      level: "Gold",
      minPoints: 3500,
      minEnrolments: 18,
      commissionPct: 22,
      perks: [
        "22% commission rate on verified enrolments",
        "100% scholarship on 1 SCDS Masterclass",
        "1-on-1 portfolio & career review with Samuel Kimiri",
      ],
    },
    {
      level: "Elite",
      minPoints: 7500,
      minEnrolments: 35,
      commissionPct: 25,
      perks: [
        "25% top-tier commission rate",
        "Official SCDS Campus Lead / Creative Fellow Letter of Recommendation",
        "Co-branded campus workshop sponsorship",
      ],
    },
  ],
};

export const INITIAL_COURSES: Course[] = [
  {
    id: "course-ps",
    slug: "photoshop-masterclass",
    title: "Adobe Photoshop Masterclass",
    shortCode: "PS",
    description:
      "Master the world's most powerful image editing software. Learn professional photo retouching, manipulation, poster design, and digital brand identity creation.",
    category: "Design Software",
    duration: "4 Weeks (30 Days)",
    publishedFeeKes: 4000,
    currency: "KES",
    commissionRatePct: 15,
    pointsReward: 400,
    enrollmentUrl: "https://samcreativedesignschool.com/enroll?course=photoshop-masterclass",
    highlights: ["Poster Design", "Brand Identity", "Photo Retouching", "Mockup Design"],
    status: "published",
    nextIntake: "Cohort 11 · October 2026",
    createdAt: "2026-09-01T08:00:00Z",
  },
  {
    id: "course-ai",
    slug: "illustrator-training",
    title: "Adobe Illustrator Training",
    shortCode: "AI",
    description:
      "Unlock your creativity with vector graphics. Create logos, icons, custom typography, and complex commercial illustrations that scale perfectly at any size.",
    category: "Design Software",
    duration: "4 Weeks (30 Days)",
    publishedFeeKes: 4000,
    currency: "KES",
    commissionRatePct: 15,
    pointsReward: 400,
    enrollmentUrl: "https://samcreativedesignschool.com/enroll?course=illustrator-training",
    highlights: ["Logo Design", "Vector Illustration", "Typography", "Brand Identity"],
    status: "published",
    nextIntake: "Cohort 11 · October 2026",
    createdAt: "2026-09-01T08:00:00Z",
  },
  {
    id: "course-ux",
    slug: "vibe-designing-uiux",
    title: "Vibe Designing — UI/UX Masterclass",
    shortCode: "UX",
    description:
      "Design modern apps and websites with user research, wireframes, visual systems, interactive prototypes, and polished client case studies.",
    category: "Product Design",
    duration: "5 Weeks (35 Days)",
    publishedFeeKes: 5500,
    currency: "KES",
    commissionRatePct: 18,
    pointsReward: 550,
    enrollmentUrl: "https://samcreativedesignschool.com/enroll?course=vibe-designing-uiux",
    highlights: ["User Research", "Wireframing", "Figma UI Design", "UX Case Studies"],
    status: "published",
    nextIntake: "Cohort 11 · October 2026",
    createdAt: "2026-09-01T08:00:00Z",
  },
  {
    id: "course-dev",
    slug: "vibe-coding-web-dev",
    title: "Vibe Coding — Web Development Bootcamp",
    shortCode: "DEV",
    description:
      "Build responsive websites and full-stack web apps with HTML, CSS, JavaScript, React, Next.js, APIs, and production deployment workflows.",
    category: "Software Engineering",
    duration: "8 Weeks (56 Days)",
    publishedFeeKes: 8500,
    currency: "KES",
    commissionRatePct: 20,
    pointsReward: 850,
    enrollmentUrl: "https://samcreativedesignschool.com/enroll?course=vibe-coding-web-dev",
    highlights: ["HTML & CSS", "JavaScript & React", "Next.js & APIs", "Live Deployment"],
    status: "published",
    nextIntake: "Cohort 11 · October 2026",
    createdAt: "2026-09-01T08:00:00Z",
  },
  {
    id: "course-aip",
    slug: "ai-prompt-engineering",
    title: "AI & Prompt Engineering",
    shortCode: "AIP",
    description:
      "Use AI tools responsibly for content, design, business workflows, automation, research, and practical prompt systems.",
    category: "Artificial Intelligence",
    duration: "3 Weeks (21 Days)",
    publishedFeeKes: 3500,
    currency: "KES",
    commissionRatePct: 15,
    pointsReward: 350,
    enrollmentUrl: "https://samcreativedesignschool.com/enroll?course=ai-prompt-engineering",
    highlights: ["Prompt Design", "AI Content Workflows", "Business Automation", "Research Systems"],
    status: "published",
    nextIntake: "Cohort 11 · October 2026",
    createdAt: "2026-09-01T08:00:00Z",
  },
  {
    id: "course-cad",
    slug: "solidworks-engineers",
    title: "SolidWorks for Engineers",
    shortCode: "CAD",
    description:
      "Master 3D CAD design for mechanical engineering. Create complex parts, assemblies, and technical drawings for real-world projects.",
    category: "Engineering Setup",
    duration: "6 Weeks (45 Days)",
    publishedFeeKes: 9000,
    currency: "KES",
    commissionRatePct: 18,
    pointsReward: 900,
    enrollmentUrl: "https://samcreativedesignschool.com/enroll?course=solidworks-engineers",
    highlights: ["3D Part Modeling", "Mechanical Assemblies", "Technical Drawings", "Engineering Portfolio"],
    status: "published",
    nextIntake: "Cohort 11 · October 2026",
    createdAt: "2026-09-01T08:00:00Z",
  },
  {
    id: "course-cc",
    slug: "capcut-masterclass",
    title: "CapCut Video Editing Masterclass",
    shortCode: "CC",
    description:
      "Create viral video content using CapCut. Plan, cut, caption, and export short-form videos for TikTok, Reels, Shorts, and business pages.",
    category: "Video Workflow",
    duration: "2 Weeks (15 Days)",
    publishedFeeKes: 2000,
    currency: "KES",
    commissionRatePct: 15,
    pointsReward: 200,
    enrollmentUrl: "https://samcreativedesignschool.com/enroll?course=capcut-masterclass",
    highlights: ["Video Trimming", "Effects & Transitions", "Motion Captions", "Reels & TikTok Exports"],
    status: "published",
    nextIntake: "Cohort 11 · October 2026",
    createdAt: "2026-09-01T08:00:00Z",
  },
];

export const INITIAL_BADGES: Badge[] = [
  {
    id: "badge-1",
    code: "first_spark",
    name: "First Spark",
    description: "Submitted your first qualified learner lead to SCDS.",
    iconName: "Sparkles",
    criteriaType: "qualified_leads",
    criteriaThreshold: 1,
  },
  {
    id: "badge-2",
    code: "verified_pioneer",
    name: "Verified Pioneer",
    description: "Achieved your first verified student enrolment.",
    iconName: "CheckCircle2",
    criteriaType: "verified_enrolments",
    criteriaThreshold: 1,
  },
  {
    id: "badge-3",
    code: "campus_catalyst",
    name: "Campus Catalyst",
    description: "Referred 5 verified learners into SCDS cohorts.",
    iconName: "Award",
    criteriaType: "verified_enrolments",
    criteriaThreshold: 5,
  },
  {
    id: "badge-4",
    code: "creative_strategist",
    name: "Creative Strategist",
    description: "Earned 1,500+ cumulative ambassador impact points.",
    iconName: "Trophy",
    criteriaType: "points",
    criteriaThreshold: 1500,
  },
  {
    id: "badge-5",
    code: "scds_elite_fellow",
    name: "SCDS Elite Fellow",
    description: "Reached 15+ verified enrolments with impeccable attribution integrity.",
    iconName: "Crown",
    criteriaType: "verified_enrolments",
    criteriaThreshold: 15,
  },
];

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: "camp-cohort11",
    name: "Cohort 11 October Intake Drive",
    slug: "cohort-11-october-drive",
    description:
      "Flagship intake campaign for SCDS Cohort 11 across all 7 practical creative & engineering tracks (280 seats available).",
    objective: "Drive 120+ qualified learner enquiries and 60+ verified enrolments for Cohort 11.",
    targetAudience:
      "University students, creative freelancers, campus clubs (JKUAT, UoN, KU, TUK, Strathmore), and junior marketers.",
    courseIds: [
      "course-ps",
      "course-ai",
      "course-ux",
      "course-dev",
      "course-aip",
      "course-cad",
      "course-cc",
    ],
    startDate: "2026-10-01",
    endDate: "2026-11-15",
    bonusPointsPerEnrolment: 50,
    bonusCommissionPct: 2,
    status: "active",
    guidelines:
      "Highlight practical portfolio outcomes, direct WhatsApp mentorship by Samuel Kimiri, 24/7 LMS access, and verified completion certificates. Never promise 'get rich overnight' schemes—stick to SCDS values: Exceptional, Strategic & Realistic.",
    createdAt: "2026-10-01T08:00:00Z",
  },
  {
    id: "camp-cad-eng",
    name: "Campus Engineering & SolidWorks Showcase",
    slug: "campus-solidworks-showcase",
    description:
      "Targeted outreach to mechanical, mechatronic, and civil engineering students needing practical 3D CAD portfolio skills.",
    objective: "Onboard 35 engineering students into the 6-week SolidWorks for Engineers track.",
    targetAudience: "Engineering students & student associations (NUSETA, IEK student chapters).",
    courseIds: ["course-cad"],
    startDate: "2026-10-05",
    endDate: "2026-11-30",
    bonusPointsPerEnrolment: 75,
    bonusCommissionPct: 3,
    status: "active",
    guidelines:
      "Share real 3D part assemblies and technical drawing deliverables. Direct engineering students to your unique /join?ref=CODE link.",
    createdAt: "2026-10-05T08:00:00Z",
  },
  {
    id: "camp-vibe-builders",
    name: "Vibe Design & Vibe Coding Sprint",
    slug: "vibe-design-coding-sprint",
    description:
      "Promote SCDS's modern UI/UX Vibe Designing and Full-Stack Vibe Coding tracks to aspiring digital builders.",
    objective: "Enroll 40 learners across UI/UX and Web Development bootcamps.",
    targetAudience: "Tech enthusiasts, career switchers, and computer science / design students.",
    courseIds: ["course-ux", "course-dev", "course-aip"],
    startDate: "2026-10-10",
    endDate: "2026-12-01",
    bonusPointsPerEnrolment: 60,
    bonusCommissionPct: 2,
    status: "active",
    guidelines:
      "Emphasize building real case studies, interactive Figma prototypes, and deployed Next.js apps within 5-8 weeks.",
    createdAt: "2026-10-10T08:00:00Z",
  },
];

export const INITIAL_MARKETING_ASSETS: MarketingAsset[] = [
  {
      id: "asset-1",
      title: "Cohort 11 All-Courses Official Poster & WhatsApp Flier",
      description:
        "High-contrast official SCDS Cohort 11 intake poster featuring all 7 skill tracks, LMS + Google Meet mentorship details, and flexible student fees.",
      category: "Course Posters",
      campaignId: "camp-cohort11",
      campaignName: "Cohort 11 October Intake Drive",
      previewType: "poster",
      aspectRatio: "4:5 Portrait (Instagram & WhatsApp Status)",
      captionTemplate:
        "Want to build real, portfolio-ready skills in Design, Coding, AI, Video Editing, or SolidWorks CAD? 🚀\n\nJoin Sam Creative Design School (SCDS) Cohort 11!\n✅ Guided practical projects & LMS access 24/7\n✅ Personal mentorship from Samuel Kimiri\n✅ Verified Certificate upon completion\n\nExplore courses & reserve your seat through my official ambassador link: {{REFERRAL_LINK}} (Code: {{REFERRAL_CODE}})",
      usageInstructions:
        "Share on WhatsApp Status, campus class groups, or Instagram. Always append your unique referral link so your leads are automatically attributed.",
      status: "published",
      uploadedBy: "Samuel Ndung'u Kimiri",
      createdAt: "2026-10-01T09:00:00Z",
    },
    {
      id: "asset-2",
      title: "SolidWorks for Engineers — Mechanical CAD Showcase Kit",
      description:
        "Engineering-focused promotional card and technical breakdown for mechanical, mechatronic, and civil engineering students.",
      category: "WhatsApp Promotional Content",
      courseId: "course-cad",
      courseTitle: "SolidWorks for Engineers",
      campaignId: "camp-cad-eng",
      campaignName: "Campus Engineering & SolidWorks Showcase",
      previewType: "caption",
      aspectRatio: "16:9 Presentation & WhatsApp Copy",
      captionTemplate:
        "Engineering students! 🔧 Don't graduate with only theory notes. Learn how to model real 3D parts, mechanical assemblies, and ISO technical drawings in the 6-week SCDS SolidWorks for Engineers program.\n\n👉 Reserve your slot here: {{REFERRAL_LINK}}",
      usageInstructions:
        "Best shared in NUSETA, engineering department WhatsApp groups, and LinkedIn posts targeting student engineers.",
      status: "published",
      uploadedBy: "Samuel Ndung'u Kimiri",
      createdAt: "2026-10-04T11:00:00Z",
    },
    {
      id: "asset-3",
      title: "Vibe Designing (UI/UX) & Vibe Coding (Web Dev) Carousel Pack",
      description:
        "Ready-to-post messaging explaining how SCDS teaches Figma UI/UX systems alongside full-stack React & Next.js development.",
      category: "Social Media Graphics",
      courseId: "course-dev",
      courseTitle: "Vibe Coding — Web Development Bootcamp",
      campaignId: "camp-vibe-builders",
      campaignName: "Vibe Design & Vibe Coding Sprint",
      previewType: "poster",
      aspectRatio: "1:1 Square Carousel",
      captionTemplate:
        "From Figma wireframes to live Next.js web apps 💻✨\n\nWhether you want to master UI/UX Vibe Designing (5 Weeks) or Full-Stack Vibe Coding (8 Weeks), Sam Creative Design School gives you weekly project reviews and a real portfolio.\n\nStart here: {{REFERRAL_LINK}} (Use my code: {{REFERRAL_CODE}})",
      usageInstructions:
        "Ideal for X (Twitter), LinkedIn, TikTok bio links, and campus tech community channels.",
      status: "published",
      uploadedBy: "Samuel Ndung'u Kimiri",
      createdAt: "2026-10-08T14:00:00Z",
    },
    {
      id: "asset-4",
      title: "SCDS Brand & Ethical Promotion Guidelines",
      description:
        "Official brand positioning rules ('Exceptional, Strategic & Realistic') and compliance checklist for all SCDS Ambassadors.",
      category: "Campaign Guidelines",
      previewType: "guideline",
      captionTemplate:
        "SCDS Brand Promise: We do not promise instant riches. We help learners build practical work, workflow discipline, and confidence needed to start small and grow steadily.",
      usageInstructions:
        "Read before publishing custom social content. Do not alter SCDS tuition figures or invent unapproved discounts.",
      status: "published",
      uploadedBy: "Samuel Ndung'u Kimiri",
      createdAt: "2026-09-25T10:00:00Z",
    },
    {
      id: "asset-5",
      title: "Approved Student Testimonial — Portfolio to First Client",
      description:
        "Verified student review story highlighting how weekly Photoshop & Illustrator feedback led to freelance poster & brand identity gigs.",
      category: "Approved Testimonials",
      courseId: "course-ps",
      courseTitle: "Adobe Photoshop Masterclass",
      previewType: "caption",
      captionTemplate:
        "\"The difference at SCDS is that you don't just watch videos—every week Samuel reviews your actual poster and logo files until your layout and typography are client-ready.\" — SCDS Alumni\n\nJoin the next cohort: {{REFERRAL_LINK}}",
      usageInstructions:
        "Use when answering questions from prospective learners who want to know how classes work.",
      status: "published",
      uploadedBy: "Samuel Ndung'u Kimiri",
      createdAt: "2026-10-10T10:00:00Z",
    },
];

export const INITIAL_DATABASE_STATE: AppDatabaseState = {
  profiles: [
    {
      id: "user-admin-1",
      email: "Samcreativedesignschool@gmail.com",
      password: "Admin@SCDS2026!#Sam",
      fullName: "Samuel Ndung'u Kimiri",
      phone: "0748201131",
      role: "super_admin",
      status: "active",
      createdAt: "2026-08-01T08:00:00Z",
      updatedAt: "2026-10-19T08:00:00Z",
    },
  ],
  applications: [],
  ambassadors: [],
  courses: INITIAL_COURSES,
  campaigns: INITIAL_CAMPAIGNS,
  referrals: [],
  enrolments: [],
  rewardRules: INITIAL_REWARD_RULES,
  pointsLedger: [],
  commissions: [],
  payoutRequests: [],
  marketingAssets: INITIAL_MARKETING_ASSETS,
  badges: INITIAL_BADGES,
  announcements: [],
  notifications: [],
  supportRequests: [],
  auditLogs: [],
  deletedApplicationIds: [],
  deletedUserIds: [],
  deletedEntityIds: [],
  deletedTrashIds: [],
  trash: [],
};
