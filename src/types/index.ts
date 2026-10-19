export type UserRole = "super_admin" | "ambassador" | "learner";

export type AccountStatus = "active" | "pending" | "suspended" | "rejected";

export type AmbassadorLevel = "Starter" | "Bronze" | "Silver" | "Gold" | "Elite";

export type ReferralStatus =
  | "clicked"
  | "lead_submitted"
  | "contacted"
  | "application_submitted"
  | "enrolled"
  | "payment_pending"
  | "payment_verified"
  | "rejected"
  | "cancelled";

export type ApplicationStatus = "pending" | "approved" | "rejected" | "suspended";

export type VerificationStatus = "pending" | "verified" | "rejected";

export type CommissionStatus = "pending" | "approved" | "paid" | "rejected" | "reversed";

export type PayoutStatus = "pending" | "approved" | "paid" | "rejected";

export type AssetCategory =
  | "Course Posters"
  | "Social Media Graphics"
  | "Short Promotional Videos"
  | "WhatsApp Promotional Content"
  | "Course Descriptions"
  | "Ready-to-Use Captions"
  | "Approved Testimonials"
  | "Campaign Guidelines"
  | "Brand Assets"
  | "Referral Campaign Materials";

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AmbassadorApplication {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  county: string;
  institution: string;
  occupation: string;
  socialLinks: {
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
    portfolio?: string;
  };
  motivation: string;
  experience: string;
  acceptedTerms: boolean;
  status: ApplicationStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface AmbassadorProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  referralCode: string;
  level: AmbassadorLevel;
  totalPoints: number;
  availablePoints: number;
  totalCommissionKes: number;
  availableCommissionKes: number;
  paidCommissionKes: number;
  payoutMethod: "MPESA" | "BANK_TRANSFER";
  payoutPhone: string;
  county: string;
  institution: string;
  occupation: string;
  bio: string;
  isActive: boolean;
  clickCount: number;
  badgeIds: string[];
  createdAt: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  shortCode: string;
  description: string;
  category: string;
  duration: string;
  publishedFeeKes: number;
  currency: string;
  commissionRatePct: number;
  pointsReward: number;
  enrollmentUrl: string;
  imageUrl?: string;
  highlights: string[];
  status: "published" | "draft" | "archived";
  nextIntake: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  description: string;
  objective: string;
  targetAudience: string;
  courseIds: string[];
  startDate: string;
  endDate: string;
  bonusPointsPerEnrolment: number;
  bonusCommissionPct: number;
  status: "active" | "draft" | "completed" | "archived";
  guidelines: string;
  createdAt: string;
}

export interface ReferralEvent {
  id: string;
  referralId: string;
  previousStatus: ReferralStatus | null;
  newStatus: ReferralStatus;
  actorName: string;
  note: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  referralCode: string;
  ambassadorId: string;
  ambassadorName: string;
  courseId: string;
  courseTitle: string;
  campaignId?: string;
  campaignName?: string;
  learnerName: string;
  learnerEmail: string;
  learnerPhone: string;
  learnerCounty: string;
  enquiryNotes: string;
  consentGiven: boolean;
  status: ReferralStatus;
  attributionSource: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  events: ReferralEvent[];
}

export interface Enrolment {
  id: string;
  referralId: string;
  courseId: string;
  courseTitle: string;
  ambassadorId: string;
  ambassadorName: string;
  referralCode: string;
  learnerName: string;
  learnerEmail: string;
  learnerPhone: string;
  cohort: string;
  tuitionAmountKes: number;
  amountPaidKes: number;
  currency: string;
  paymentMethod: "MPESA" | "BANK_TRANSFER";
  paymentReference: string;
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface LevelThreshold {
  level: AmbassadorLevel;
  minPoints: number;
  minEnrolments: number;
  commissionPct: number;
  perks: string[];
}

export interface RewardRuleConfig {
  id: string;
  code: string;
  name: string;
  description: string;
  currency: string;
  pointsPerClick: number;
  pointsPerQualifiedLead: number;
  pointsPerVerifiedEnrolment: number;
  defaultCommissionPct: number;
  minPayoutKes: number;
  attributionWindowDays: number;
  levelThresholds: LevelThreshold[];
  isBusinessPolicyConfirmed: boolean;
  updatedAt: string;
}

export interface PointsLedgerEntry {
  id: string;
  ambassadorId: string;
  ambassadorName: string;
  referralId?: string;
  campaignId?: string;
  eventKey: string; // Prevents duplicate issuance
  pointsDelta: number;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface CommissionEntry {
  id: string;
  ambassadorId: string;
  ambassadorName: string;
  enrolmentId: string;
  referralId: string;
  courseTitle: string;
  learnerName: string;
  tuitionPaidKes: number;
  commissionRatePct: number;
  amountKes: number;
  currency: string;
  status: CommissionStatus;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface PayoutRequest {
  id: string;
  ambassadorId: string;
  ambassadorName: string;
  ambassadorEmail: string;
  amountKes: number;
  currency: string;
  paymentMethod: "MPESA" | "BANK_TRANSFER";
  recipientPhone: string;
  status: PayoutStatus;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  transactionReference?: string;
  adminNotes?: string;
}

export interface MarketingAsset {
  id: string;
  title: string;
  description: string;
  category: AssetCategory;
  courseId?: string;
  courseTitle?: string;
  campaignId?: string;
  campaignName?: string;
  fileUrl?: string;
  previewType: "poster" | "video" | "caption" | "guideline" | "brand";
  aspectRatio?: string;
  captionTemplate: string;
  usageInstructions: string;
  status: "published" | "draft" | "archived";
  uploadedBy: string;
  createdAt: string;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  iconName: string;
  criteriaType: "verified_enrolments" | "qualified_leads" | "points" | "campaign";
  criteriaThreshold: number;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: "all" | "ambassadors" | "level_specific";
  isPinned: boolean;
  publishedBy: string;
  publishedAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "reward";
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface SupportRequest {
  id: string;
  userId: string;
  ambassadorName: string;
  ambassadorEmail: string;
  subject: string;
  category:
    | "Attribution Review"
    | "Commission & Payout"
    | "Marketing Assets"
    | "Account & Level"
    | "Technical Support";
  message: string;
  status: "open" | "in_progress" | "resolved";
  adminResponse?: string;
  respondedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

