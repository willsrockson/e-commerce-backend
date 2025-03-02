
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getUserProileDetials = ( req, res ) =>{
    const userData = req.userData;
    res.status(200).json({userData})
}