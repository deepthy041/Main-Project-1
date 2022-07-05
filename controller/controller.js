const UploadModel=require('../config/schema')
const fs=require('fs')

exports.add=async(req,res)=>{
    const all_images=await UploadModel.find()
    res.render('add-product',{Image:all_images})
}

exports.productimages = (req,res,next)=>{
    
   

}
   