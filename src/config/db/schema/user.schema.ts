import {pgTable, timestamp, varchar, text, uuid, integer, pgEnum } from "drizzle-orm/pg-core";

export const idVerificationStatus = pgEnum("id_verification_status", ['Not Verified', 'Processing', 'Verified']);
export const emailVerificationStatus = pgEnum("email_verification_status", ['Not Verified', 'Verified']);

const timestamps = {
  updated_at: timestamp().defaultNow().notNull(),
  created_at: timestamp().defaultNow().notNull()
}

export const UserTable = pgTable('users', {
    user_id: uuid('user_id').primaryKey().defaultRandom(),
    email: varchar('email', {length: 100}).unique().notNull(),
    password: text('password').notNull(),
    store_name: varchar('store_name', {length: 50}),
    full_name: text('full_name').notNull(),
    phone_primary: varchar('phone_primary', {length: 10}).unique().notNull(),
    phone_secondary: varchar('phone_secondary', {length: 10}).unique(),
    store_address: text('store_address'),
    token_version: integer('token_version').default(0),
    email_verification_status: emailVerificationStatus().default('Not Verified').notNull(),
    id_verification_status: idVerificationStatus().default('Not Verified').notNull(),
    ...timestamps
})

export const AvatarTable = pgTable('avatars', {
    avatar_id: uuid('avatar_id').primaryKey().defaultRandom(),
    image_url: text(),
    user_id: uuid("user_id").notNull().references(()=> UserTable.user_id, { onDelete: "cascade"}),
    ...timestamps
})






// CREATE TABLE avatars(
//   avatar_id SERIAL PRIMARY KEY,
//   imageUrl TEXT,
//   user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );


// CREATE TABLE users(
//   user_id SERIAL PRIMARY KEY, --
//   email VARCHAR(100) NOT NULL UNIQUE,--
//   pwd TEXT NOT NULL,--
//   storename TEXT NOT NULL, --
//   fullname TEXT NOT NULL, --
//   phone VARCHAR(10) NOT NULL UNIQUE, --
//   phone2 VARCHAR(10) DEFAULT NULL, --
//   storeAddress TEXT DEFAULT NULL, --
//   verificationstatus VARCHAR(20) DEFAULT ' Not Verified ' --,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ---,
//   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP --
// )
