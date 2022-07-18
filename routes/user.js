var express = require('express');

var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const { doLogin } = require('../helpers/user-helpers');
const userHelpers = require('../helpers/user-helpers')
const otp = require('../config/otp');
const { serviceSID } = require('../config/otp');
const async = require('hbs/lib/async');
const { response } = require('express');
const shortid=require('shortid')
const paypal = require('paypal-rest-sdk');
const client = require('twilio')(otp.accountSID, otp.authToken)

/* GET home page. */
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    userHelpers.getCartCount(req.session.userData._id).then((count) => {
      req.session.count = count;
      next()
    })

  } else {
    res.redirect('/login')
  }
}


router.get('/', verifyLogin, async function (req, res, next) {
 

  let cartCount = null

  let catagory = await productHelpers.getCategory()

  cartCount = await userHelpers.getCartCount(req.session.userData._id)
  req.session.count = cartCount
 
  var product = null
  productHelpers.getAllProducts().then((products) => {

    if (req.session.catshow) {
      
      products = req.session.catshow


    } 


    res.render('index', { user: true, cartCount: req.session.count, userData: req.session.userData,  products, catagory });
  })


});

router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/login', { loginErr: req.session.loginErr, user: true })
    req.session.loginErr = null
  }
})

// router.post('/login',(req,res)=>{
//   userHelpers.doLogin(req.body).then((response)=>{
//     console.log('otp');
//     console.log('1111111111111111111111111111111111111');
//   console.log(response);
//    let user=response.user
//    console.log(user);
//     if(response.status){
//       console.log('if condition');
//       console.log(response.status);
//       // req.session.user=response.user
//       // req.session.loggedIn=true;
//       req.session.phone=response.user.Number
//     console.log(response.user.Number);
//     var Number=response.user.Number
//     client.verify
//     .services(otp.serviceSID)
//     .verifications.create({
//       to:`+91${user.Number}`,
//       channel:"sms"
//     })
//     .then((data)=>{
//       req.session.user=response.user
//       req.session.loggedIn=true
//       // console.log(data);
//      res.redirect('/otp')
//      })
// }
//     else{
//       req.session.loginErr="Invalid user name or password"
//       res.redirect('/login')
//     }



//   })
// })
router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {

    if (response.status) {
     
      req.session.loggedIn = true
      req.session.userData = response.user

      if(response.user.refferal){
        userHelpers.addRefferal(response.user.refferal,req.session.userData._id).then(()=>{

        })
      }
      res.redirect('/')
    } else {
      req.session.loginErr = "invalid username or password"
      res.redirect('/login')
    }
  })
})

router.get('/otp', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/otp', { userData: req.session.userData, Number })
  }


})
+
// router.post('/otp', verifyLogin, (req, res) => {
//   if (req.body.otp == "1234") {
//     console.log(otp);
//     res.redirect('/')
//   } else {
//     res.redirect('/otp')
//   }
// })
router.post('/otp',(req,res)=>{
  let Otp=req.body.otp
   console.log(Otp);
   console.log(req.session.phone);
  client.verify
  .services(otp.serviceSID)
  .verificationChecks.create({
    to:`+91${req.session.phone}`,
    code:Otp
  })
  .then((data)=>{
    console.log(data);
    if(data.status=="approved"){
      req.session.loggedIn=true
      res.redirect("/login")
    }else{
      otpErr="Invalid Otp";
      res.redirect("user/otp", { otpErr,userData:user.session.userData });
    }

    })
})



router.get('/signup', (req, res) => {


  res.render('user/signup', { SigninErr: req.session.SigninErr, user: true })
  req.session.SigninErr = null

})
router.post('/signup', (req, res) => {
req.body.refferalcode=shortid.generate()
req.session.newuser=req.body
console.log("body vannu")
console.log(req.body)
req.session.phone=req.body.Number
if(req.body.Email&&req.body.password){


  userHelpers.signUp(req.body).then((response) => {

    if (response.status) {
      req.session.SigninErr = "Email id already existed"
      res.redirect('/signup')


    } else {
      userHelpers.doSignup(req.session.newuser).then((response) => {
        client.verify
    .services(otp.serviceSID)
    .verifications.create({
      to:`+91${req.body.Number}`,
      channel:"sms"
    })
    .then((data)=>{
 
     res.redirect('/otp')
     })

        


      })
    }
    

  })
}

})
router.get('/logout', (req, res) => {

  req.session.destroy()
  res.redirect('/')
})


router.get('/view-category', (req, res) => {
  res.render('user/view-category', { user: true,userData:req.session.userData,cartCount: req.session.count })
})
router.get('/single-product/:id',verifyLogin, async (req, res) => {
  try{
    
    let id = req.params
    let product = await productHelpers.getProductDetails(id)
   
    res.render('user/single-product', { product, user: true , cartCount: req.session.count,userData:req.session.userData})
  }catch(error){
    res.redirect('/error')
  }
 
})
router.get('/contact', (req, res) => {
  res.render('user/contact')
})
router.get('/view-cart', verifyLogin, async (req, res) => {
  try{
 
    
    let products = await userHelpers.getCartProducts(req.session.userData._id)
   products[0].offer=products[0].offer??0
     let totalVal = await userHelpers.getTotalAmount(req.session.userData._id)
   
  let totalValue=Math.round(totalVal)
  
    let Total=await userHelpers.getTotalWithoutCoupon(req.session.userData._id)
    let totalvalues =Math.round(Total)
    let calculation=totalvalues-totalValue

  
    
    let singleAmount = await userHelpers.singleProductPrice(req.session.userData._id)
  
  

  
    res.render('user/view-cart', { products, user: req.session.userData, cartCount: req.session.count, totalValue , userData: req.session.userData, singleAmount,totalvalues ,calculation})
  
  }catch(error){
    console.log(error)
    res.status(400)
  }
 })
router.get('/add-cart/:id', (req, res) => {
 
  
  if (req.session.userData) {
    userHelpers.addCart(req.params.id, req.session.userData._id).then((response) => {
   
      res.json(response)
    })
  } else {
    res.redirect('/login')
  }
})
router.post('/change-product-quantity', (req, res, next) => {
  
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
  
    response.totals = await userHelpers.getTotalAmount(req.session.userData._id)
    

    response.total=Math.round(response.totals)
  
    res.json(response)


  })
})
router.post('/remove-item', (req, res, next) => {
  userHelpers.changeItem(req.body).then((response) => {
    res.json(response)
  })
})


router.get('/place-order', verifyLogin, async (req, res) => {
  let totals = await userHelpers.getTotalAmount(req.session.userData._id)
  let user= await userHelpers.getUserAddress(req.session.userData._id)
 let  total=Math.round(totals)
  req.session.userData=user

  res.render('user/place-order', { total, user, cartCount: req.session.count ,userData:req.session.userData})
})
router.post('/place-order', async (req, res) => {


  let products = await userHelpers.getCartProductList(req.session.userData._id)


  let totalPrice = await userHelpers.getTotalAmount(req.session.userData._id)
 
  userHelpers.placeOrder(req.body, products, totalPrice, req.session.userData,req.session.applycoupon).then((orderId) => {
    req.session.orderId = orderId
    if (req.body.paymentmethod === 'COD') {

      res.json({ codSuccess: true })
    } else if (req.body.paymentmethod === 'RAZORPAY') {
      userHelpers.generateRazorPay(orderId, totalPrice).then((response) => {
        console.log("razor  ");
        response.status = 'RAZORPAY'
        

        res.json(response)
      })
    } else {
      userHelpers.generatePaypal(orderId, totalPrice).then((payment) => {
        res.json(payment)
      })
    }


  })

})


router.get('/success', async (req, res) => {
 
  userHelpers.changePaymentStatus(req.session.orderId)


  let total = await userHelpers.getTotal(req.session.orderId)


  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {

    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "USD",
        "total": total.totalAmount
      }
    }]
  };


  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {

      throw error;
    } else {

      console.log(JSON.stringify(payment));
      res.redirect('/check-out')
    }
  });
})



router.get('/check-out', async (req, res) => {

  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  res.render('user/check-out', { user: req.session.userData, user: true, totalPrice,cartCount: req.session.count,userData:req.session.userData })
})
router.get('/user-profile', (req, res) => {
 
 
    userHelpers.getNewUser(req.session.userData._id).then((users)=>{
    
    let user = req.session.userData
    res.render('user/user-profile', {  user: req.session.userData,users,cartCount: req.session.count,userData:req.session.userData})
  })

  
})

router.post('/user-profileaddress',(req,res)=>{
 
  req.body.addressId=shortid.generate()
  let id = req.session.userData._id
  userHelpers.addprofileAddress(req.body,id)
  res.redirect('/user-profile')
})


router.post('/user-addressEdit/:id',(req,res)=>{
  try{
    
    editid=req.params.id;
   
    userHelpers.addressEdit(editid,req.body,req.session.userData._id)
    res.redirect('/useraddress-view')
  }catch(error){
    console.log(error)
    
  }

})
router.get('/delete-address/:id', (req, res) => {
  deleteId = req.params.id;
  let id=req.session.userData._id
  userHelpers.deleteAddress(deleteId,id).then((response) => {
    res.redirect('/useraddress-view')
  }) 
})



//.......................Orders..................................//

router.get('/orders',verifyLogin, async (req, res) => {
  let orders = await userHelpers.getsingleUserorder(req.session.orderId)
  let products = await userHelpers.getOrderProducts(req.session.orderId)


  res.render('user/orders', { orders, products,user:true ,cartCount: req.session.count,userData:req.session.userData})
})


//.......................userAllorders...............................//
router.get('/profile-orders', verifyLogin,async (req, res) => {


 

  let proorder = await userHelpers.getUserOrders(req.session.userData._id)
 
  res.render('user/profile-orders', { proorder,cartCount: req.session.count, userData: req.session.userData ,user:true,})
})

router.get('/useraddress-view',(req,res)=>{
  
  
  userHelpers.getNewUser(req.session.userData._id).then((users)=>{
  res.render('user/useraddress-view',{user:true ,cartCount: req.session.count,userData:req.session.userData,users})
  })
})


router.post('/address-view', (req, res) => {
  
  req.body.addressId=shortid.generate()
  let id = req.session.userData._id
  userHelpers.updateUserAddress(req.body, id).then(() => {

    res.redirect('/useraddress-view')
  })
})




router.get('/show-category/:Name', (req, res) => {
  let name = req.params.Name
 
  userHelpers.getCategoryName(name).then((pro) => {

    req.session.catshow = pro
 
    res.redirect('/')
  })
})

//.........................Whishlist......................//
router.get('/whishlist', (req, res) => {

  console.log('wish list');

  userHelpers.getWhishlistItems(req.session.userData._id).then((whishlist) => {
 
    res.render('user/whishlist', { whishlist })
  }).catch((err) => {
    console.log(err);
  })
})



router.get("/add-to-wishlist/:id", async (req, res) => {
  
  
  if (req.session.user) {
    userHelpers.addToWishList(req.params.id, req.session.userData._id).then(() => {
      res.json({ status: true });
     
    })

  }

});

router.post('/verify-payment', (req, res) => {

  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
   
      res.json({ status: true })
    })

  }).catch((err) => {
    console.log(err);
    res.json({ status: false, errMsg: '' })
  })
})

router.get('/change-password',verifyLogin, (req, res) => {
  if (req.session.userData) {
    res.render('user/change-password', { user: req.session.userPassword, use: req.session.userPasswords ,cartCount: req.session.count, userData: req.session.userData })
    req.session.userPassword = null;
    req.session.userPasswords=null;
  } else {
    res.redirect('/login')
    
  } 

})
router.post('/change-password', (req, res) => {
  if (req.session.userData) {
    userHelpers.changePassword(req.body, req.session.userData._id).then((response) => {

      
      if (response.status) {
       
        req.session.userPassword = 'Password successfully changed'
        res.redirect('/change-password')
      } else {
      
        req.session.userPasswords = 'Entered Password is Wrong'
        res.redirect('/change-password')
      }



    })
  } else {


    res.redirect('/login')
  }
})

//.................cancel...................//
router.get('/cancel-orders/:id', (req, res) => {

  
  userHelpers.cancelOrders(req.params.id).then(()=>{
   
    res.json({status:true})
  })
})
router.post('/add-coupon',async(req,res)=>{
 

  id=req.session.userData._id

  console.log(id)
  req.session.applycoupon=req.body
  totalValue = await userHelpers.getTotalAmount(req.session.userData._id)
  userHelpers.addUserCoupon(req.body,id).then((response)=>{

      res.json(response)

  })
  
})

router.get('/error',(req,res)=>{
  res.render('user/error')
})

router.post('/removeCoupon', (req, res) => {
 
  userHelpers.removeCoupon(req.body.userId).then((response) => {
    res.json(response)
  })
})
module.exports = router;
 