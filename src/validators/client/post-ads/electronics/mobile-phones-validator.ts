import z from "zod";
import { clientZodValidator } from "../../brain.js";
import { GH_PHONE_NUMBER_REGEX } from "../../../../config/constants.js";

export const CONDITION_OPTIONS = [
   "Brand New",
   "Open Box",
   "Foreign Used",
   "Ghana Used",
   "Refurbished",
] as const;

export const YES_NO_OPTIONS = ["Yes", "No"] as const;

export const ACCESSORY_OPTIONS = [
   "Charger",
   "Box",
   "Headphones",
   "Receipt",
   "Screen Protector",
   "Case",
] as const;

const mobilePhonesSchema = z.object({
   region: z
      .string("Region is required")
      .min(1, "Region cannot be empty")
      .nonempty("Region cannot be empty"),
   town: z
      .string("Town is required")
      .min(1, "Town cannot be empty")
      .nonempty("Town cannot be empty"),
   mainCategory: z
      .string("Main category is required")
      .min(1, "Main category cannot be empty")
      .nonempty("Main category cannot be empty"),
   subCategory: z
      .string("Sub category is required")
      .min(1, "Sub category cannot be empty")
      .nonempty("Sub category cannot be empty"),
   title: z
      .string("Title is required")
      .min(5, "Title cannot be empty")
      .nonempty("Title cannot be empty"),
   description: z
      .string("Description is required")
      .min(20, "Description cannot be empty")
      .nonempty("Description cannot be empty"),
   brand: z
      .string("Brand is required")
      .min(1, "Brand cannot be empty")
      .nonempty("Brand cannot be empty"),
   model: z
      .string("Model is required")
      .min(1, "Model cannot be empty")
      .nonempty("Model cannot be empty"),
   storage: z
      .string("Storage is required")
      .min(1, "Storage cannot be empty")
      .nonempty("Storage cannot be empty"),
   ram: z.string("Ram is required").min(1, "Ram cannot be empty").nonempty("Ram cannot be empty"),
   color: z
      .string("Color is required")
      .min(1, "Color cannot be empty")
      .nonempty("Color cannot be empty"),
   batterySize: z
      .string("Battery is required")
      .min(1, "Battery cannot be empty")
      .nonempty("Battery cannot be empty"),
   batteryHealth: z.coerce
      .number("Battery health must be a number")
      .min(1, "Battery health must be at least 1%")
      .max(100, "Battery health cannot be more than 100%")
      .optional(),
   screenSize: z
      .string("Screen size is required")
      .min(1, "Screen size cannot be empty")
      .nonempty("Screen size cannot be empty"),
   condition: z.enum(CONDITION_OPTIONS, "Please select a valid condition (e.g. Foreign Used)"),
   negotiable: z.enum(YES_NO_OPTIONS, "Please specify if the price is negotiable"),
   exchangePossible: z.enum(YES_NO_OPTIONS, "Please specify if exchange is possible"),
   accessories: z.preprocess((val)=>{
          if(!val) return []
          if(Array.isArray(val)){
            return val
          }
          return [val]
   },
     z.array(z.enum(ACCESSORY_OPTIONS)).optional().default([])

   ),
   price: z.preprocess((val) => {
      if (typeof val === "string") {
         // Remove commas globally
         return val.replace(/,/g, "");
      }
      return val;
   }, z.coerce.number("Price must be a number").min(1, "Price must be at least 1 GHS")),
});

export const mobilePhonesPostingValidator = clientZodValidator(mobilePhonesSchema, 'form');


interface Bookmark{
  ads_id: string;
  title: string; 
  phone_primary: string; 
  condition: string; 
  image_url:string; 
  price: number; 
  location: string;
}

const mobileBookmarkSchema = z.object({
   adsId: z
      .string("AdsId is required")
      .min(1, "AdsId cannot be empty")
      .nonempty("AdsId cannot be empty"),
   slug: z
      .string("Slug is required")
      .min(2, "Invalid slug")
      .nonempty("Slug cannot be empty"),
   mainSlug: z
      .string("Main slug is required")
      .min(2, "Invalid slug")
      .nonempty("Slug cannot be empty"),
   subSlug: z
      .string("Sub slug is required")
      .min(2, "Invalid slug")
      .nonempty("Slug cannot be empty"),         
   title: z
      .string("Title is required")
      .min(5, "At least 5 characters")
      .nonempty("Title cannot be empty"),
   phonePrimary: z
      .string("Primary phone cannot be empty")
      .regex(GH_PHONE_NUMBER_REGEX, "Please enter a valid 10-digit number (e.g., 0244123456)."),
   condition: z.enum(CONDITION_OPTIONS, "Please select a valid condition (e.g. Foreign Used)"),
   imageUrl: z
      .string("Image url is required")
      .min(10, "Invalid image url")
      .nonempty("Image url cannot be empty"),
   price: z.preprocess((val) => {
      if (typeof val === "string") {
         // Remove commas globally
         return val.replace(/,/g, "");
      }
      return val;
   }, z.coerce.number("Price must be a number").min(1, "Price must be at least 1 GHS")),
   location: z
      .string("Location is required")
      .min(1, "Location cannot be empty")
      .nonempty("Location cannot be empty"),
});

export const mobilePhonesBookmarkValidator = clientZodValidator(mobileBookmarkSchema, 'json');

const isFile = (val: unknown): val is File => {
  return typeof File !== "undefined" && val instanceof File;
};

const mobilePhoneEditSchema = z.object({
   region: z.string().nonempty("Region is required"),
   town: z.string().nonempty("Town is required"),
   color: z.string().nonempty("Color is required"),
   storage: z.string().nonempty("Storage capacity is required"),
   ram: z.string().nonempty("RAM size is required"),
   batteryHealth: z.union([z.string(), z.number()]).optional(),
   exchangePossible: z.string().nonempty("Select exchange preference"),
   price: z.string().nonempty("Price is required"),
   negotiable: z.string().nonempty("Select negotiable preference"),
   condition: z.string().nonempty("Condition is required"),
   accessories: z.preprocess((val)=>{
          if(!val) return []
          if(Array.isArray(val)){
            return val
          }
          return [val]
   },
     z.array(z.enum(ACCESSORY_OPTIONS)).optional().default([])

   ),
   title: z.string()
      .min(5, "Title must be at least 5 characters")
      .nonempty("Title is required"),   
   description: z.string()
      .min(20, "Description must be at least 20 characters")
      .nonempty("Description is required"),    
   images: z.array(
      z.union([
         z.string().url("Invalid image URL"),
         z.custom<File>((val) => isFile(val), { message: "Must be a valid file" }),
      ])
   ).min(2, "You must keep at least 2 images"),
});

export const mobilePhonesEditValidator = clientZodValidator(mobilePhoneEditSchema, 'form');





const mobilePhoneDelImageSchema = z.object({
   imageUrl: z.string().nonempty("image url is required").includes("https://res.cloudinary.com"),
});

export const mobilePhonesDelImageValidator = clientZodValidator(mobilePhoneDelImageSchema, 'json');

