import z from "zod";
import { clientZodValidator } from "./brain.js";
import { GH_PHONE_NUMBER_REGEX, SIX_DIGIT_CODE_REGEX } from "../../config/constants.js";


const accountSettingsSchema = z.object({
   storeName: z.string().trim().min(3, "Store name can not be empty").optional(),
   fullName: z.string().trim().min(3, "Full name can not be empty").optional(),
   phonePrimary: z
      .string()
      .regex(
         GH_PHONE_NUMBER_REGEX,
         "Please enter a valid 10-digit number (e.g., 0244123456)."
      )
      .optional(),
   phoneSecondary: z
      .string()
      .regex(
         GH_PHONE_NUMBER_REGEX,
         "Please enter a valid 10-digit number (e.g., 0244123456)."
      )
      .optional(),
   storeAddress: z.string().trim().min(3, "Store address can not be empty").optional(),
});

export const updateAccountSettingsValidator = clientZodValidator(accountSettingsSchema, "form");

const otpCodeSchema = z.object({
   phone: z.string('Phone cannot be empty').regex(GH_PHONE_NUMBER_REGEX,
         "Please enter a valid 10-digit number (e.g., 0244123456).").or(z.literal('')).optional(),
   code: z.string().regex(SIX_DIGIT_CODE_REGEX, "Please enter a valid 6-digit code").or(z.literal('')).optional(),
   oldPhone: z.string().regex(GH_PHONE_NUMBER_REGEX,
         "Please enter a valid 10-digit number (e.g., 0244123456).").or(z.literal('')).optional(),
});

export const otpCodeValidator = clientZodValidator(otpCodeSchema, "json");


const changePasswordSchema = z.object({
   currentPassword: z.string("Current password is required.").min(6, "Current password must be 6 characters or more."), 
   newPassword: z.string("New password is required.").min(6, "New password must be 6 characters or more."),
   confirmPassword: z.string("Confirm password is required.").min(6, "Confirm password must be 6 characters or more."),
})

export const changePasswordValidator = clientZodValidator(changePasswordSchema, "json");


const changeEmailSchema = z.object({
    newEmail: z.email('Please enter a valid email address'), 
    confirmEmail:  z.email('Please enter a valid email address'),
    code: z.string().regex(SIX_DIGIT_CODE_REGEX, "Please enter a valid 6-digit code").or(z.literal('')).optional(),
});

export const changeUnverifiedEmailValidator = clientZodValidator(changeEmailSchema.omit({code: true}), "json");
export const changeVerifiedEmailValidator = clientZodValidator(changeEmailSchema, "json");


const productCardSchema = z.object({
    productId: z.string("AdsId cannot be empty").min(5, "Enter a valid ads id"), 
});

export const productCardValidator = clientZodValidator(productCardSchema, "json");





