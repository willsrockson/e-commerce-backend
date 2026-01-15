import z from "zod";
import { clientZodValidator } from "./brain.js";

const loginSchema = z.object({
   emailPhone: z
      .string("Email or phone is required.")
      .regex(
         /^(?:\d{10}|(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_+\-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,})$/i,
         "Enter a valid email or 10-digit phone number"
      ),
   password: z.string("Password is required.").min(6, "Password must be 6 characters or more."),
});

export const loginValidator = clientZodValidator(loginSchema, "json");

const registerSchema = z.object({
   email: z.email("Please enter a valid email"),
   password: z.string("Password is required.").min(6, "Password must be 6 characters or more."),
   fullName: z.string("Name is required.").min(1, "Name field cannot be empty."),
   phonePrimary: z
      .string("Phone is required.")
      .regex(/^\d{10}$/, "Phone number must be exactly 10 digits."),
});

export const registerValidator = clientZodValidator(registerSchema, "json");


const verifyEmailSchema = z.object({
   verifyEmail: z.string('This is required').min(10, 'Param can not be less than 10').or(z.literal('')).optional()
})

export const emailVerificationValidator = clientZodValidator(verifyEmailSchema, "json");

