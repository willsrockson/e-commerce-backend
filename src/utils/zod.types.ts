import * as z from 'zod';

export const ZloginType = z.object({
    emailPhone: z.string().regex(
    /^(?:\d{10}|(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_+\-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,})$/i,
    "Must be a valid email or 10-digit phone number"
  ) ,
    password: z.string().min(6, 'Password must be 6 characters or more.')
});

export const ZSignUpType = z.object({
    email: z.email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be 6 characters or more.'),
    fullName: z.string().nonempty('Name field cannot be empty'),
    phonePrimary: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits")

})

