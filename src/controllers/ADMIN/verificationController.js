import sql from "../../config/dbConn.js";
import supabase from "../../config/supabaseConn.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getUnverifiedUser = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(
        " user_id, email, firstname, lastname, phone, phone2, created_at, storeaddress "
      )
      .eq("isverifiedstore", false);

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    return res.status(400).json([]);
  }
};



export const getVerifiedStore = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(
        " user_id, email, firstname, lastname, phone, phone2, created_at, storeaddress "
      )
      .eq("isverifiedstore", true);

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    return res.status(400).json([]);
  }
};








/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getUserVerificationRequest = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(
        " user_id, email, firstname, lastname, phone, phone2, created_at, storeaddress "
      )
      .eq("verificationstatus", "Processing");

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    return res.status(400).json([]);
  }
};

// Fetch photos and ID number of people who requested for verification
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getIdVerificationInfo = async (req, res) => {
  const id = Number(req.params.id);
  
  try {

    const idInfo = await sql`
    SELECT ghcardno, businessregno, govimages, firstname, lastname
    FROM users
    FULL JOIN verificationcenter ON verificationcenter.user_id = users.user_id
    WHERE users.user_id = ${id}
  `;
    res.status(200).json(idInfo);
    
  } catch (error) {
    res.status(404).json({errMessage: error.message})
  }

};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const approveUser = async (req, res) => {
  const id = req.params.id;
  try {
    const { error } = await supabase
      .from("users")
      .update({ verificationstatus: "Verified", isverifiedstore: true })
      .eq("user_id", id);

    if (error) {
      throw new Error("Something happened while verifying store");
    }

    res.status(200).json({ message: "Store has been verified" });
  } catch (error) {
    res.status(400).json({ errMessage: error.message });
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const declineID = async (req, res) => {
  const id = req.params.id;
  try {
    const { error: UsersErorr } = await supabase
      .from("users")
      .update({ verificationstatus: "Not Verified", isverifiedstore: false })
      .eq("user_id", id);

    const { error: verificationTableError } = await supabase
      .from("verificationcenter")
      .delete()
      .eq("user_id", id);

    if (UsersErorr || verificationTableError) {
      throw new Error("Something happened while declining Gov. ID");
    }

    const { data, error: idError } = await supabase.storage
      .from("ecommerce")
      .list(`verification-center/${id}`);

    if (idError) {
      throw idError;
    } else {
      const idToDelete = data.map(
        (photo) => `verification-center/${id}/${photo.name}`
      );
      const { error: deleteError } = await supabase.storage
        .from("ecommerce")
        .remove(idToDelete);

      if (deleteError) {
        throw deleteError;
      }
    }

    res.status(200).json({ message: "Gov. ID declined successfully" });
  } catch (error) {
    res.status(400).json({ errMessage: error.message });
  }
};
