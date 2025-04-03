import sql from "../config/dbConn.js";
import supabase from "../config/supabaseConn.js";
import sharp from "sharp";
import { deleteAllFilesAfterUpload } from "../utils/deleteFilesInUploads.js";

// Get phones + Query
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const fetchMobilePhones = async (req, res) => {
  try {
    const {
      region,
      town,
      brand,
      model,
      condition,
      min_price,
      max_price,
      disk_space,
      color,
    } = req.query;

    const finalData = await sql`
            SELECT mobilephones.mobile_id, mobilephones.images, mobilephones.price, mobilephones.description, mobilephones.title, mobilephones.region, mobilephones.condition, users.isverifiedstore
            FROM mobilephones
            JOIN users on users.user_id = mobilephones.user_id
            WHERE mobilephones.deactivated != true
            ${region ? sql`AND region = ${region}` : sql``}
            ${town ? sql`AND town = ${town}` : sql``}
            ${brand ? sql`AND brand = ${brand}` : sql``}
            ${model ? sql`AND model = ${model}` : sql``}
            ${condition ? sql`AND condition = ${condition}` : sql``}
            ${min_price ? sql`AND price >= ${min_price}` : sql``}
            ${max_price ? sql`AND price <= ${max_price}` : sql``}
            ${disk_space ? sql`AND disk_space = ${disk_space}` : sql``}
            ${color ? sql`AND color = ${color}` : sql``}
            
         `;

    res.status(200).json(finalData);
  } catch (error) {
    res.json([]);
  }
};

// Function below gets each phones clicked on the site

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getEachPhoneById = async (req, res) => {
  const { id } = req.params;

  try {
    const getPhone = await sql`
            SELECT m.mobile_id, m.brand, m.model, m.region, m.town, m.color, m.disk_space, m.ram_size, m.exchange_possible,
            m.price, m.description, m.title, m.images, m.negotiation, m.condition, m.created_at, avatars.imageurl,
            users.storename, users.fullname, users.phone, users.phone2, users.isverifiedstore, users.created_at As user_created_at
            FROM mobilephones AS m
            FULL JOIN users on users.user_id = m.user_id
            FULL JOIN avatars on avatars.user_id = users.user_id
            WHERE m.mobile_id = ${id};
         `;
    if (!getPhone) {
      throw new Error("Phone not found");
    }

    res.status(200).json(getPhone);
  } catch (error) {
    console.log(error.message);
    return res.status(401).json([]);
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const editMobilePhoneDetails = async (req, res, err) => {
  const expectedPhotos = 7;

  try {
    const userID = req.userData.userID.user_id;
    const mobile_id = req.params.id;
    const files = req.files;
    const {
      region,
      town,
      brand,
      model,
      color,
      storage,
      ram,
      negotiation,
      condition,
      description,
      title,
      exPossible,
      price,
    } = req.body;
    

    if (err) throw new Error(err.message);

    // Adding or changing photos logic
    if (files.length > 0) {
      const { data, error } = await supabase
        .from("mobilephones")
        .select("images")
        .match({ mobile_id: mobile_id, user_id: userID });

      if (error) throw new Error("Error finding image");

      const numberOfPhotos =
        files.length + data[0].images.length > expectedPhotos;
      if (numberOfPhotos) {
        deleteAllFilesAfterUpload("./uploads");
        throw new Error(`Total uploads can't be more than ${expectedPhotos}`);
      }

      // map through each file upload it
      const uploadAdImagePromises = files.map(async (file) => {
        // Take the file from /uploads, convert it and store it inside supabase storage
        const outputBuffer = await sharp(file.path)
          .webp({ quality: 95 })
          .rotate()
          .resize(1080, 810, { fit: "inside" })
          .toBuffer()

        const { data, error: upLoadError } = await supabase.storage
          .from("ecommerce")
          .upload(
            `ads-images/${userID}/${Date.now()}-${file.filename}.webp`,
            outputBuffer,
            {
              cacheControl: "3600",
              upsert: false,
            }
          );

        if (upLoadError) {
          throw upLoadError;
        }

        return data;
      });
      const results = await Promise.all(uploadAdImagePromises);

      const getAllUrl = results.map(async (result) => {
        const { data: Url } = supabase.storage
          .from("ecommerce")
          .getPublicUrl(result.path);

        return Url;
      });
      const uRl = await Promise.all(getAllUrl);

      await sql`
           UPDATE mobilephones 
           SET images = array_cat(images, ${uRl?.map(url => url.publicUrl)}) 
           WHERE mobile_id = ${mobile_id} AND user_id = ${userID};

      `
      deleteAllFilesAfterUpload("./uploads");
      
      if(!region &&
        !town &&
        !brand &&
        !model &&
        !color &&
        !storage &&
        !ram &&
        !negotiation &&
        !condition &&
        !description &&
        !title &&
        !exPossible &&
        !price ){
           return res.status(200).json({ message: "Updated successful" });
           
        }
      
      
    } // Files upload ends here



    let dataToUpdate = {}; // It creates an object of all changes made
    if (region) dataToUpdate.region = region;
    if (town) dataToUpdate.town = town;
    if (brand) dataToUpdate.brand = brand;
    if (model) dataToUpdate.model = model;
    if (color) dataToUpdate.color = color;
    if (storage) dataToUpdate.disk_space = storage;
    if (ram) dataToUpdate.ram_size = ram;
    if (negotiation) dataToUpdate.negotiation = negotiation;
    if (condition) dataToUpdate.condition = condition;
    if (description) dataToUpdate.description = description;
    if (title) dataToUpdate.title = title;
    if (exPossible) dataToUpdate.exchange_possible = exPossible;
    if (price) dataToUpdate.price = price;

    // Only update when changes has been made
    if (Object.keys(dataToUpdate).length > 0) {
      const { error: updateMobileError } = await supabase
        .from("mobilephones")
        .update(dataToUpdate)
        .match({ user_id: userID, mobile_id: mobile_id });

      if (updateMobileError) {
        throw updateMobileError;
      }
    } else {
      return res.status(200).json({ message: "Nothing changed" });
    }

    res.status(200).json({ message: "Updated successful" });
  } catch (error) {
    return res.status(400).json({ errorMessage: error.message });
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const deleteAdsPhotoOneByOne = async (req, res) => {
  try {
    const userID = req.userData.userID.user_id;
    const mobile_id = req.params.id;
    const { imageIndex } = req.body;

    const { data, error } = await supabase
      .from("mobilephones")
      .select("images")
      .match({ mobile_id: mobile_id, user_id: userID });

    if (error) throw new Error("Error finding image");

    // Stop running when there is one image left
    if (data[0].images.length === 1)
      throw new Error("Advert must have at least one image.");

    // this takes the directory of the image to be deleted
    const partOfImageLink = data[0].images[imageIndex].split("ecommerce/")[1];
    await sql`
            UPDATE mobilephones 
            SET images = array_remove(images, ${`${data[0].images[imageIndex]}`}) 
            WHERE mobile_id = ${mobile_id};
        `;

    const { error: deleteAdsError } = await supabase.storage
      .from("ecommerce")
      .remove([`${partOfImageLink}`]);

    if (deleteAdsError) throw new Error("Unexpected error happened");

    res.status(200).json({ message: "Image removed" });
  } catch (error) {
    return res.status(400).json({ errorMessage: error.message });
  }
};
