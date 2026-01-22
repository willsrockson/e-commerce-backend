import {pgTable, timestamp, varchar, text, uuid, integer, pgEnum } from "drizzle-orm/pg-core";

export const idVerificationStatus = pgEnum("id_verified", ['unverified', 'processing', 'verified']);
export const emailVerificationStatus = pgEnum("email_verified", ['unverified', 'verified']);
export const providerName = pgEnum('provider_name', ['google']);
export const role = pgEnum('role', ['user', 'moderator', 'superuser']);
export const phonePrimaryVerificationStatus = pgEnum("phone_primary_verified", ['unverified', 'verified']);
export const phoneSecondaryVerificationStatus = pgEnum("phone_secondary_verified", ['unverified', 'verified']);


const timestamps = {
  updated_at: timestamp().defaultNow().notNull(),
  created_at: timestamp().defaultNow().notNull()
}

export const UserTable = pgTable('users', {
    user_id: uuid('user_id').primaryKey().defaultRandom(),
    email: varchar('email', {length: 100}).unique().notNull(),
    password: text('password'),
    store_name: varchar('store_name', {length: 50}),
    store_name_slug: text('store_name_slug').unique(),
    full_name: text('full_name').notNull(),
    phone_primary: varchar('phone_primary', {length: 10}).unique(),
    phone_secondary: varchar('phone_secondary', {length: 10}).unique(),
    store_description: varchar('store_description', {length: 400}),
    open_hours: text('open_hours'),
    provider_id: text('provider_id').unique(),
    provider_name: providerName(),
    role: role().default('user').notNull(),
    store_address: text('store_address'),
    token_version: integer('token_version').default(0).notNull(),
    email_verified: emailVerificationStatus().default('unverified').notNull(),
    phone_primary_verified:phonePrimaryVerificationStatus().default('unverified').notNull(),
    phone_secondary_verified: phoneSecondaryVerificationStatus().default('unverified').notNull(),
    id_verified: idVerificationStatus().default('unverified').notNull(),
    ...timestamps
})

export const AvatarTable = pgTable('avatars', {
    avatar_id: uuid('avatar_id').primaryKey().defaultRandom(),
    image_url: text(),
    user_id: uuid("user_id").notNull().references(()=> UserTable.user_id, { onDelete: "cascade"}).unique(),
    ...timestamps
})
