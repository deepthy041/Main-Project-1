var express = require('express');
//const req = require('express/lib/request');
//const { redirect } = require('express/lib/response');
//const res = require('express/lib/response');
//const { response } = require('../app');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const { doLogin } = require('../helpers/user-helpers');
const userHelpers = require('../helpers/user-helpers')
const otp = require('../config/otp');
const { serviceSID } = require('../config/otp');
const async = require('hbs/lib/async');
const { response } = require('express');
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
  // let userlogin=req.session.user
  // req.session.loggedIn=true
  let cartCount = null

  let catagory = await productHelpers.getCategory()

  cartCount = await userHelpers.getCartCount(req.session.userData._id)
  req.session.count = cartCount
  console.log("2222222222222222");
  var product = null
  productHelpers.getAllProducts().then((products) => {

    if (req.session.catshow) {
      console.log("vannuuuuuuu");
      products = req.session.catshow


    } 
    // req.session.help = false;

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
// router.post('/login', (req, res) => {
//   userHelpers.doLogin(req.body).then((response) => {
//     let user = response.user
//     if (response.status) {

//       console.log(user);
//       req.session.login = true
//       req.session.user = response.user

//       res.redirect('/',)


//     } else {
//       req.session.loginErr = 'Invalid username or password'
//       res.redirect('/login')
//     }
//   })
// })
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
      res.redirect('/otp')
    } else {
      req.session.loginErr = "invalid username or password"
      res.redirect('/login')
    }
  })
})

router.get('/otp', verifyLogin, (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/otp', { userData: req.session.userData, Number })
  }


})
router.post('/otp', verifyLogin, (req, res) => {
  if (req.body.otp == "1234") {
    console.log(otp);
    res.redirect('/')
  } else {
    res.redirect('/otp')
  }
})
// router.post('/otp',(req,res)=>{
//   let Otp=req.body.otp
//    console.log(Otp);
//    console.log(req.session.phone);
//   client.verify
//   .services(otp.serviceSID)
//   .verificationChecks.create({
//     to:`+91${req.session.phone}`,
//     code:Otp
//   })
//   .then((data)=>{
//     console.log(data);
//     if(data.status=="approved"){
//       req.session.loggedIn=true
//       res.redirect("/")
//     }else{
//       otpErr="Invalid Otp";
//       res.redirect("user/otp", { otpErr,userData:user.session.userData });
//     }

//     })
// })



router.get('/signup', (req, res) => {


  res.render('user/signup', { SigninErr: req.session.SigninErr, user: true })
  req.session.SigninErr = null

})
router.post('/signup', (req, res) => {

  userHelpers.signUp(req.body).then((response) => {

    if (response.status) {
      req.session.SigninErr = "Email id already existed"
      res.redirect('/signup')


    } else {
      userHelpers.doSignup(req.body).then((response) => {

        res.redirect('/login')


      })
    }

  })

})
router.get('/logout', (req, res) => {

  req.session.destroy()
  res.redirect('/')
})

// router.get('index',verifyLogin,async(req,res)=>{
//   console.log("index verindooo dsaaaaaaaaaaaaaaaa");

//   console.log('1111111111111111111111111111111111111111111111111111111');
//   console.log(catagory);
//   var product=null
//   productHelpers.getAllProducts().then((products)=>{
//     // console.log(products);

//     res.render('index',{products,user:true,cartCount:req.session.count,userData:req.session.userData,product,catagory})
//     req.session.help=false
//   })

// })
// router.get('/single-product',(req,res)=>{
//   res.render('user/shop')
// })
router.get('/view-category', (req, res) => {
  res.render('user/view-category', { user: true })
})
router.get('/single-product/:id', async (req, res) => {
  let id = req.params
  let product = await productHelpers.getProductDetails(id)
  console.log(product);
  res.render('user/single-product', { product, user: true })
})
router.get('/contact', (req, res) => {
  res.render('user/contact')
})
router.get('/view-cart', verifyLogin, async (req, res) => {
  console.log(req.session.userData);
  let products = await userHelpers.getCartProducts(req.session.userData._id)

  totalValue = await userHelpers.getTotalAmount(req.session.userData._id)
  totalvalues=await userHelpers.getTotalWithoutCoupon(req.session.userData._id)

  let singleAmount = await userHelpers.singleProductPrice(req.session.userData._id)


  console.log(totalValue);

  console.log('lllllllllllllllllllllllllllllllllllllllll');


  res.render('user/view-cart', { products, user: req.session.userData, cartCount: req.session.count, totalValue, userData: req.session.userData, singleAmount,totalvalues })
})
router.get('/add-cart/:id', (req, res) => {
  console.log("api call");
  if (req.session.userData) {
    userHelpers.addCart(req.params.id, req.session.userData._id).then((response) => {
      console.log("jjjjjjjjjjjj");
      console.log(response);
      res.json(response)

    })
  } else {
    res.redirect('/login')
  }
})
router.post('/change-product-quantity', (req, res, next) => {
  console.log(req.body);
  console.log("111");
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    console.log("******");
    console.log(req.body);
    response.total = await userHelpers.getTotalAmount(req.session.userData._id)
    console.log("fffffff");
    console.log(response);
    res.json(response)


  })
})
router.post('/remove-item', (req, res, next) => {
  userHelpers.changeItem(req.body).then((response) => {
    res.json(response)
  })
})


router.get('/place-order', verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.userData._id)
  let user= await userHelpers.getUserAddress(req.session.userData._id)
  console.log("123")
 console.log(user)
  res.render('user/place-order', { total, user, cartCount: req.session.count })
})
router.post('/place-order', async (req, res) => {
  console.log(req.body);
  console.log("7777777777");

  let products = await userHelpers.getCartProductList(req.session.userData._id)

  console.log(products);
  console.log("1111111111111117777");
  let totalPrice = await userHelpers.getTotalAmount(req.session.userData._id)
  // res.render()
  userHelpers.placeOrder(req.body, products, totalPrice, req.session.userData,req.session.applycoupon).then((orderId) => {
    req.session.orderId = orderId
    if (req.body.paymentmethod === 'COD') {

      res.json({ codSuccess: true })
    } else if (req.body.paymentmethod === 'RAZORPAY') {
      userHelpers.generateRazorPay(orderId, totalPrice).then((response) => {
        console.log("razor  ");
        response.status = 'RAZORPAY'
        console.log(response);

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
  // userHelpers.changePaymentStatus(req.body['orderId']).then(()=>{
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
      console.log(error.response);
      throw error;
    } else {

      console.log(JSON.stringify(payment));
      res.redirect('/check-out')
    }
  });
})



router.get('/check-out', async (req, res) => {

  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  res.render('user/check-out', { user: req.session.userData, user: false, totalPrice })
})
router.get('/user-profile', verifyLogin, async (req, res) => {
  // let success=req.session.success
  // let failed=req.session.failed
  user = req.session.userData
  // let address=await userHelpers.getUserAddress(req.session.userData)
  // let profile=await userHelpers.getUserProfile(req.session.userData)
  res.render('user/user-profile', { user: req.session.userData })
})
// router.post('/user-profile',async(req,res)=>{
//   if(req.session.userData){

//     await userHelpers.getUserProfile(req.body).then(()=>{
//       res.render('/user-profile',{user:true,user:req.session.userData})
//     })
//   }else{
//     res.redirect('/')
//   }
// })

//.......................Orders..................................//

router.get('/orders', async (req, res) => {
  let orders = await userHelpers.getsingleUserorder(req.session.orderId)
  let products = await userHelpers.getOrderProducts(req.session.orderId)
  console.log("orderproduct........");
  console.log(orders);
  console.log(products);
  res.render('user/orders', { orders, products })
})


//.......................userAllorders...............................//
router.get('/profile-orders', async (req, res) => {


  console.log("product vannuuu");
  // let products=await  userHelpers.getAllProducts(req.session.userData._id)
  // console.log(products);
  let proorder = await userHelpers.getUserOrders(req.session.userData._id)
  console.log("vannnuuuuuuuuuuuu");
  console.log(proorder);
  res.render('user/profile-orders', { proorder })
})

//....................Address....................................//
router.get('/address-view', async (req, res) => {

  // let address=await userHelpers.getUserAddress(req.session.userData._id)
  res.render('user/address-view', { user: req.session.userData })
})
router.post('/address-view', (req, res) => {
  let id = req.session.userData._id
  userHelpers.updateUserAddress(req.body, id).then(() => {

    console.log("11118888");
    res.redirect('/place-order')
  })

})

//............profile address add..................//
router.get('/addprofile-address', async (req, res) => {

  // let address=await userHelpers.getUserAddress(req.session.userData._id)
  res.render('user/addprofile-address', { user: req.session.userData })
})
router.post('/addprofile-address', (req, res) => {
  let id = req.session.userData._id
  userHelpers.updateUserAddress(req.body, id).then(() => {

    console.log("11118888");
    res.redirect('/user-profile')
  })

})


router.get('/show-category/:Name', (req, res) => {
  let name = req.params.Name
  console.log("Category name Vannuuu");
  console.log(req.params.Name);
  userHelpers.getCategoryName(name).then((pro) => {

    req.session.catshow = pro
    // req.session.help = true
    res.redirect('/')
  })
})

//.........................Whishlist......................//
router.get('/whishlist', (req, res) => {
  // user = req.session.userData._id
  console.log('wish list');

  userHelpers.getWhishlistItems(req.session.userData._id).then((whishlist) => {
    // console.log(product);
    console.log("product vannuuu");
    res.render('user/whishlist', { whishlist })
  }).catch((err) => {
    console.log(err);
  })
})



router.get("/add-to-wishlist/:id", async (req, res) => {
  console.log('\n', req.params.id, 'Wishlist id \n');
  // count = await userHelpers.getWishlistCount(req.session.user?._id);
  if (req.session.user) {
    userHelpers.addToWishList(req.params.id, req.session.userData._id).then(() => {
      res.json({ status: true });
      console.log("Wishlist added\n");
    })
    // .catch(() => {
    //   console.log('\nErrorrrrrrrrrrrrrrrrrrrrrrrrrrrrrr\n');
    //   res.json({ status: 'exist' })
    // });
  }
  //  else {
  //   res.json({ status: false });
  // }
});

router.post('/verify-payment', (req, res) => {
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log("payment successfull");
      res.json({ status: true })
    })

  }).catch((err) => {
    console.log(err);
    res.json({ status: false, errMsg: '' })
  })
})

router.get('/change-password', (req, res) => {
  if (req.session.userData) {
    res.render('user/change-password', { user: req.session.userPassword, use: req.session.userPasswords })
    req.session.userPassword = false;

  } else {
    res.redirect('/login')
  }

})
router.post('/change-password', (req, res) => {
  if (req.session.userData) {
    userHelpers.changePassword(req.body, req.session.userData._id).then((response) => {

      
      if (response.status) {
        console.log('righttttt');
        req.session.userPassword = 'Password successfully changed'
        res.redirect('/change-password')
      } else {
        console.log('wronggggg');
        req.session.userPasswords = 'Entered Password is Wrong'
        res.redirect('/change-password')
      }


      // req.session.destroy(
      //   res.redirect('/')

      // )
    })
  } else {


    res.redirect('/login')
  }
})

//.................cancel...................//
router.get('/cancel-orders/:id', (req, res) => {
  console.log(req.params.id);
  userHelpers.cancelOrders(req.params.id).then(()=>{
    // res.redirect('admin/order-list')
    res.json({status:true})
  })
})
router.post('/add-coupon',(req,res)=>{
  console.log(req.body)
  id=req.session.userData._id
  console.log("userId vannuu")
  console.log(id)
  req.session.applycoupon=req.body
  userHelpers.addUserCoupon(req.body,id).then((response)=>{
  
      res.json(response)

  })
})
module.exports = router;
