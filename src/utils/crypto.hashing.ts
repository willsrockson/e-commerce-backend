import crypto from "crypto";

export const hashUserId = (input: string) => {
    return crypto
        .createHash("sha256") //choose algorithm: sha256, sha1, md5, etc.
        .update(input)
        .digest("hex"); // hex output, you can also use "base64"
};