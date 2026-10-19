import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const ambassadorApplicationSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full name must be at least 3 characters.")
    .max(80, "Full name is too long."),
  email: z.string().email("Please provide a valid email address."),
  phone: z
    .string()
    .regex(
      /^(?:\+254|254|0)(?:7|1)\d{8}$/,
      "Enter a valid Kenyan phone number (e.g. 0748201131 or +254748201131)."
    ),
  password: z
    .string()
    .min(8, "Create a strong password of at least 8 characters."),
  county: z.string().min(2, "Please select or enter your county/location."),
  institution: z
    .string()
    .max(120, "Institution or organization name is too long.")
    .optional()
    .default(""),
  occupation: z
    .string()
    .min(2, "Please select your current occupation or student status."),
  instagram: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
  tiktok: z.string().optional().default(""),
  portfolio: z.string().optional().default(""),
  motivation: z
    .string()
    .min(30, "Please share at least 30 characters on why you want to represent SCDS.")
    .max(1000, "Motivation must be under 1000 characters."),
  experience: z
    .string()
    .min(20, "Briefly describe your marketing, campus leadership, or creative experience.")
    .max(1000, "Experience description must be under 1000 characters."),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({
      message: "You must accept the SCDS Ambassador Program Terms & Privacy Notice.",
    }),
  }),
});

export const learnerEnquirySchema = z.object({
  learnerName: z
    .string()
    .min(3, "Please enter your full name.")
    .max(80, "Name is too long."),
  learnerEmail: z.string().email("Please enter a valid email address."),
  learnerPhone: z
    .string()
    .regex(
      /^(?:\+254|254|0)(?:7|1)\d{8}$/,
      "Please enter a valid Kenyan WhatsApp/phone number (e.g. 0712345678)."
    ),
  learnerCounty: z.string().min(2, "Please enter your county or city."),
  courseId: z.string().min(1, "Please select the SCDS course you wish to join."),
  referralCode: z.string().optional().default(""),
  enquiryNotes: z
    .string()
    .max(500, "Notes must be under 500 characters.")
    .optional()
    .default(""),
  consentGiven: z.literal(true, {
    errorMap: () => ({
      message: "Please consent to SCDS contacting you regarding your course enquiry.",
    }),
  }),
});

export const payoutRequestSchema = z.object({
  amountKes: z.coerce
    .number()
    .positive("Amount must be greater than zero."),
  paymentMethod: z.enum(["MPESA", "BANK_TRANSFER"]),
  recipientPhone: z
    .string()
    .regex(
      /^(?:\+254|254|0)(?:7|1)\d{8}$/,
      "Provide a valid M-Pesa registered phone number (e.g. 0748201131)."
    ),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type AmbassadorApplicationInput = z.infer<typeof ambassadorApplicationSchema>;
export type LearnerEnquiryInput = z.infer<typeof learnerEnquirySchema>;
export type PayoutRequestInput = z.infer<typeof payoutRequestSchema>;

