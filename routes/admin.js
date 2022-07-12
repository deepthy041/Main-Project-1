var express = require('express');
const session = require('express-session');
 const res = require('express/lib/response');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();

const controller=require('../controller/controller')

const multer=require('multer')

  
 const verifyAdminLogin=(req,res,next)=>{
 if(req.session.adminSignin){
    next()
  }else{
    res.redirect('/admin')
}
 }



 //set storage
 const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
     
    cb(null, "./public/productimages");
  },
  filename: function (req, file, callback) {
    callback(null, "filename" + Date.now() + ".jpeg");
  },
});

  const productImgStore = multer({ storage: productStorage });
//
  const categoryStorage = multer.diskStorage({
    destination: function (req, file, cb) {
       
      cb(null, "./public/productimages");
    },
    filename: function (req, file, callback) {
      callback(null, "filename" + Date.now() + ".jpeg");
    },
  });
  
    const categoryImgStore = multer({ storage: categoryStorage });


router.get('/', function(req, res, next) {
  
 
  if(req.session.adminSignin){
    res.redirect('/admin/admin-home')
  }else{

    console.log('no')
    res.render('admin/signin',{adminErr:req.session.adminErr})
    req.session.adminErr=null
  }
});
// router.get('/',(req,res,next)=>{
//   if(!req.session.adminSignin){
//     res.render('admin/signin')
//   }else{
//     res.redirect('/admin/admin-home')
//   }
// })
router.post('/signin',(req,res)=>{
  console.log(req.body);
  if (req.body.Email=="admin@gmail.com"&& req.body.password==123){
    req.session.adminSignin=true
    res.redirect('/admin/admin-home')
 
  }else{
    
    req.session.adminErr="Invalid user name or Password"
    res.redirect('/admin')
  }
})
router.get('/logout',(req,res)=>{
  req.session.adminSignin=false
  
  res.redirect('/admin')
})



router.get('/admin-home',async(req,res)=>{
if(!req.session.adminSignin){
res.redirect('/admin')
}
else{
  let totalsales = await  productHelpers.totalSale()
  let totalsale=Math.round(totalsales)
  let paypals=await productHelpers.totalPaypal()
  let paypal=Math.round(paypals)
  let cods=await productHelpers.totalCod()
  let cod=Math.round(cods)
  let razorpays=await productHelpers.totalRazorpay()
  let razorpay=Math.round(razorpays)
  let dailysale=await productHelpers.getDailySale()
  console.log("dailysale")
  console.log(dailysale)
  let monthlysale = await productHelpers.getMonthlySale()
  console.log("monthlysale")
  console.log(monthlysale)
  let yearlysale = await productHelpers.getYearlySale()
  console.log(yearlysale)        
  
  
    res.render('admin/admin-home',{admin:true,totalsale,paypal,cod,razorpay,dailysale,monthlysale,yearlysale,report:req.session.report}) 
 
    
//   const formatCash = n=> {
//     if (n < 1e3) return n;
//     if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
//     if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
//     if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
//     if (n >= 1e12) return +(n / 1e12).toFixed(1) + "T";
//   };
// let totalsales=formatCash(totalsale)
// let paypals=formatCash(paypal)
// let cods=formatCash(cod)
// let razorpays=formatCash(razorpay)


 
}
    
})
router.post('/admin-home',(req,res)=>{
let From=new Date(req.body.from)
  let To=new Date(req.body.to)
  productHelpers.getSaleReport(From,To).then((report)=>{
    req.session.report=report
    res.redirect('/admin/admin-home')
  })
  
})

router.get('/add-product',async function(req,res){
  if(!req.session.adminSignin){
    res.redirect('/admin')
  }else{
    let catagory=await productHelpers.getCategory()
    res.render('admin/add-product',{admin:true,catagory})
  } 
})
// router.get('/add-product',controller.add);

// router.post('/add-product',(req,res)=>{
 
//   productHelpers.addProduct(req.body,(id)=>{
//     let image=req.files.Image
//     console.log(id);
//     image.mv('./public/product-images/'+id+'.jpg',(err)=>{
//       if(!err){
//         res.redirect("/admin")
//       }else{
//         console.log(err)
//       }

//     })
   
//   })
// })
router.post('/add-product',productImgStore.array('Image',12),function(req,res){
  let arr=[]
    req.files.forEach(function (files, index, ar) {
        console.log(req.files[index].filename);
    
        arr.push(req.files[index].filename)
    
      })
      let objectarray = {...arr}
      console.log(objectarray);
      
      productHelpers.addProduct(req.body, arr).then(() => {
        res.redirect('/admin/view-products')
    
      })
})
router.post('/add-offer',(req,res)=>{
  console.log("454545454");
  console.log(req.body);
  productHelpers.addOffer(req.body)
 
  res.redirect('/admin/view-products')
})

// router.get('/remove-offer/:id', (req, res) => {
//   deleteId = req.params.id;
//   let id=req.session.userData._id
//   userHelpers.deleteOffer(deleteId,id).then((response) => {
//     res.redirect('/user-profile')
//   })
// })



router.get('/view-products',async(req,res)=>{
  if(!req.session.adminSignin){
    res.redirect('/admin')
  }else{
    let offers=await productHelpers.getOffer()
    productHelpers.getAllProducts().then((products)=>{
      console.log(products)
      res.render('admin/view-products',{admin:true,products,offers})
    })
  }
  
})
router.get('/delete-product/:id', (req, res) => {
  let prodId = req.params.id
  console.log(prodId);
  productHelpers.deleteProduct(prodId).then((response) => {
    res.redirect('/admin/view-products')
  })
})
router.get('/edit-product/:id',async (req,res)=>{
  console.log(req.params)
  if(!req.session.adminSignin){
    res.redirect('/admin')
  }else{
    let product= await productHelpers.getProductDetails(req.params.id)
    res.render('admin/edit-product',{admin:true,product})
  } 
})

router.post('/edit-product/:id',(req,res)=>{
  let editid=req.params.id
  console.log("hhhhhhhhhhhhhhhhhhhh");

  productHelpers.updateProduct(req.params.id,req.body).then((data)=>{
    console.log(editid);
    if(req.files){
      let image=req.files.Image
      image.mv('./public/productimages/'+editid+'.jpg')
      res.redirect('/admin/view-products')
    }else{
   res.redirect('/admin/view-products')
    }
  })
})

addUser:(users,callback)=>{
        
  db.get().collection('users').insertOne(users).then((datas)=>{
      
      callback(datas.insertedId)
  })
}


router.get('/all-users',verifyAdminLogin, function(req, res, next) {


  productHelpers.getAllUsers().then((users)=>{
    console.log(users)
    res.render('admin/all-users',{admin:true,users})
  })

  
});
router.post('/all-users',(req,res)=>{
  productHelpers.addUser(req.body,(id)=>{
    res.redirect('/admin/all-users')
  })

})
router.get('/delete-user/:id', (req, res) => {
  let prodId = req.params.id
  console.log(prodId);
  productHelpers.deleteUser(prodId).then((response) => {
    res.redirect('/admin/all-users')
  })
})
// router.get('/edit-user/:id',async (req,res)=>{
//   let users=await productHelpers.getUserDetails(req.params.id)
//   console.log(users);
//   res.render('admin/edit-user',{users})
// })
// router.post('/edit-user/:id',(req,res)=>{
//   console.log(req.params.id);
//   let id=req.params.id
//   productHelpers.updateUser(req.params.id,req.body).then(()=>{
//     res.redirect('/admin')
  
//   })
// })

router.get('/block-user/:id',(req,res)=>{
  let id = req.params.id
  console.log(id);
  productHelpers.blockuser(id).then((block) => {
    res.redirect('/admin/all-users')
  })
})
router.get('/unblock-user/:id',(req,res)=>{
  let id = req.params.id
  console.log(id);
  productHelpers.unblockuser(id).then((unblock) => {
    res.redirect('/admin/all-users')
  })
})

router.get('/add-category', (req, res) => {
  if(!req.session.adminSignin){
    res.redirect('/admin')
  }else{
    

    res.render('admin/add-category', { admin: true, activecategory: true })
  }
})


// router.post('/add-category',(req,res)=>{
 
//   productHelpers.category(req.body,(id)=>{
//     let image=req.files
//     console.log(id);
//     image.mv('./public/productimages/'+id+'.jpg',(err)=>{
//       if(!err){
//         res.redirect("/admin/view-category")
//       }else{
//         console.log(err)
//       }

//     })
   
//   })
// })

router.post('/add-category',categoryImgStore.array('Image',5),function(req,res){
  let arr=[]
    req.files.forEach(function (files, index, ar) {
        console.log(req.files[index].filename);
    
        arr.push(req.files[index].filename)
    
      })
      let objectarray = {...arr}
      console.log(objectarray);
      productHelpers.Category(req.body, arr).then(() => {
        res.redirect('/admin/view-category')
    
      })
})

router.get('/view-category', (req, res) => {
  if(!req.session.adminSignin){
    res.redirect('/admin') 
  }else{
    productHelpers.getCategory().then((catagory) => {
      console.log(catagory);
      res.render('admin/view-category', { catagory, admin: true, activecategory: true })
    })
  }
  
})

router.get('/delete-category/:id', (req, res) => {
  productHelpers.deleteCategory(req.params.id).then((response) => {
    res.redirect('/admin/view-category')
  })

})
router.get('/edit-category/:id',async (req,res)=>{
  console.log(req.params)
  if(!req.session.adminSignin){
    res.redirect('/admin')
  }else{
    let category= await productHelpers.getCategoryDetails(req.params.id)
    res.render('admin/edit-category',{admin:true,category})
  }

})
router.post('/edit-category/:id',(req,res)=>{
  let editcat=req.params.id
  console.log(req.body);
  productHelpers.updateCategory(req.params.id,req.body).then((data)=>{
    if(req.files){
      let image=req.files.Image
      image.mv('./public/product-images'+editcat+'.jpg')
      res.redirect('/admin/view-category')
    }else{
      res.redirect('/admin/view-category') 
       }
  })
})
//.......................list-order.........................//
router.get('/order-list',async(req,res)=>{
  // listproduct= await productHelpers.getOrderProduct()
  // console.log(listproduct);
  console.log("product list vannuu");
  productHelpers.getOrderList().then((orders)=>{
    res.render('admin/order-list',{orders,admin:true})
 
  })
 
})
router.get('/cancel-order/:id',(req,res)=>{
  console.log(req.params.id);

  productHelpers.cancelOrder(req.params.id).then(()=>{
    // res.redirect('admin/order-list')
    res.json({status:true})
  })
})
router.get('/deliver-order/:id',(req,res)=>{
  productHelpers.deliverOrder(req.params.id).then(()=>{
    res.json({status:true})
  })
})
router.get('/ship-order/:id',(req,res)=>{
  productHelpers.shipOrder(req.params.id).then(()=>{
    res.json({status:true})
  })
})
//.............Dashboard..................//
// router.get('/admin-home',async(req,res)=>{
//   let dailysale= await productHelpers.getDailySale()
//   let monthlysale=await productHelpers.getMonthlySale()
//   let yearlysale=await productHelpers.getYearlySale()
  
// })
//..........category offer................//


router.post('/applyoffer/:id',(req,res)=>{
  productHelpers.applyOffer(req.params.id,req.body).then((result)=>{
    res.redirect('/admin/view-products')
  })

})
router

router.get('/updateoffers/:data',(req,res)=>{
  console.log(req.params);
  productHelpers.updateOffers(req.params).then(()=>{
    // res.send("Updated Successfully")
    res.json({status:true})
  })
})

//...............coupon...........................//
router.get('/coupon',(req,res)=>{

  productHelpers.getAllCoupon().then((coupon)=>{
    res.render('admin/coupon',{admin:true,coupon})
  })

})





router.post('/coupon',(req,res)=>{
  console.log("Haiiii");
  console.log(req.body);
  productHelpers.addcoupon(req.body).then(()=>{
    res.redirect('/admin/coupon')
  })
})


//...........sales report...........//
// router.post('/admin-home',async(req,res)=>{
  
//   productHelpers.getSaleReport(From,To).then(()=>{
//     res.render('admin/admin-home', )

//   })
 
// })
router.get('/removeOffer/:id',(req,res)=>{
  console.log(req.params.id)
  productHelpers.removeOffer(req.params.id).then((response)=>{
    response.status=true
    res.json(response);
  })
})


module.exports = router;
