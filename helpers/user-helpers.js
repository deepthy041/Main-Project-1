var db = require('../config/connection')
var collection = require('../config/collections')
var otp = require('../config/otp')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
const async = require('hbs/lib/async')
const { get } = require('mongoose')
const { response } = require('express')
const objectId = require('mongodb').ObjectId

const Razorpay = require('razorpay');
const paypal = require('paypal-rest-sdk');
const { resolve } = require('path')

var instance = new Razorpay({
    key_id: 'rzp_test_lylIusv0TH5GDr',
    key_secret: 'WkXpAK6iRh0CpnUt8r5PlyDs',
});
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AUUxBajyaCRd4GYZv3EGWTLQCM6XC4mp7_cOZAqqV8DB_r81iJy_KVDNSaXFoekjZNLwpdircEY6jXZV',
    'client_secret': 'EJUat-ff9GBwQnJEgPTSyoNwrgiKIF3_VgMG-Bbxz7kIdhxvpJh4dx27QibFshwNRwMieUVoV-ioFojd'
});


module.exports = {
    doSignup: (userData) => {
        userData.address = []
        userData.coupon = []
        console.log(userData);
        return new Promise(async (resolve, reject) => {

            userData.password = await bcrypt.hash(userData.password, 10)
            console.log(userData.password);
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
         
                resolve(data)

            })
        })

    },
    doLogin: (userData) => {
        console.log(userData);
        return new Promise(async (resolve, reject) => {

         
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
              


                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {

          

                        response.user = user

                        response.status = true
                        resolve(response)
                    } else {
                        console.log("Login fail");
                        resolve({ status: false })
                        resolve(response)
                    }
                })

            } else {
            
                resolve({ status: false })
                resolve(response)
            }

        })
    },
    signUp: (Email) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let email = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: Email.Email });
            if (email) {
                response.status = true
                resolve(response)

            } else {
                resolve({ status: false })
            }
        })

    },
    addCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }

        return new Promise(async (resolve, reject) => {
            let UserCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })

            if (UserCart) {
                let proExist = UserCart.products.findIndex(product => product.item == proId)
              
                if (proExist != -1) {
                    
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve({ productExist: true })
                        })
                }

                else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId) },
                        {

                            $push: { products: proObj }

                        }

                    ).then((response) => {
                        resolve({ status: true })
                    })
                }
            } else {
                console.log("helo");
                let cartObj = {
                    user: ObjectId(userId),
                    products: [proObj],
                    coupon: 1,


                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve({ status: true })
                })
            }
        })
    },
    getCartProducts: (userId) => {

        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([

                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        coupon: '$coupon',
                        couponoffer: '$couponoffer',
                        offer:'$offer',
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        coupon: 1,
                        couponoffer: 1,
                        product: { $arrayElemAt: ['$product', 0] },
                        offer:1,
                    }
                }

            ]).toArray()

            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (cart) {

                count = cart.products.length
                console.log(count);
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
     
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) }, {
                    $pull: { products: { item: objectId(details.product) } }
                }).then((response) => {
                    resolve({ removeProduct: true })
                })
            } else {

                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                    {
                        $inc: { 'products.$.quantity': details.count }
                    }).then((response) => {
                        resolve({ status: true })
                    })

            }
        })
    },
    changeItem: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) }, {
                $pull: { products: { item: objectId(details.product) } }
            }).then((response) => {
                resolve({ removeProduct: true })
            })
        })
    },
    singleProductPrice: (userId) => {

        return new Promise(async (resolve, reject) => {

            let producttotal = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },

                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $project: {

                        item: 1,
                        quantity: 1,
                        product: 1,
                     
                        total: { $sum: { $multiply: ['$quantity', '$product.offerPrices'] } }
                    }

                }

            ]).toArray()
   
            if (producttotal) {
                resolve(producttotal)
            } else {
                resolve()
            }
        })

    },


    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {

            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([

                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        coupon: '$coupon'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        coupon: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                },

                {
                    $group: {
                        _id: null,
                       
                        total: { $sum: { $multiply: ['$quantity', '$product.offerPrices', '$coupon'] } }
                    }
                }


            ]).toArray()
        

            

            if (total[0]) {
                console.log(total[0].total);
                resolve(total[0].total)

            } else {
                resolve(0)
            }
        })

    },
    getTotalWithoutCoupon: (userId) => {
        return new Promise(async (resolve, reject) => {

            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([

                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        coupon: '$coupon'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        coupon: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                },

                {
                    $group: {
                        _id: null,
                       
                        total: { $sum: { $multiply: ['$quantity', '$product.offerPrices'] } }
                    }
                }


            ]).toArray()
          

            if (total[0]) {
                resolve(total[0].total)

            } else {
                resolve(0)
            }
        })

    },


    getTotal: (orderId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectId(orderId) }).then((result) => {
                resolve(result)
            })

        })
    },

    placeOrder: (order, products, total, user, coupon) => {
    
        order.addressid = parseInt(order.addressid)
       
        return new Promise((resolve, reject) => {
            console.log(order, products, total)
            let status = order.paymentmethod === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    name: user.address[order.addressid].name,
                    mobile: user.address[order.addressid].number,
                    address: user.address[order.addressid].address,
                    pincode: user.address[order.addressid].pincode,
                    city: user.address[order.addressid].city,
                  
                },


                userId: objectId(user._id),
                paymentMethod: order.paymentmethod,
                products: products,
                totalAmount: total,
                status: status,
                
                date: new Date()
            }
            
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
              
             
               
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(user._id) },
                    {
                        $push: {
                            coupon: coupon
                        }
                    })
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(user._id) })
               
                resolve(response.insertedId)

            })
        })

    },

    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
          
            if(cart){
                resolve(cart.products)
            }
            
        })
    },
    getuserProfile: (body, userId) => {
        new Promise(async (resolve, reject) => {

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) });
            
            if (user.address) {
              
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
                    {
                        $push: { address: body }
                    }).then(() => {
                        resolve(response)
                    })
            } else {
             
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
                    $set: { address: body }
                }).then(() => {
                    resolve(response)
                })
            }
        });


    },
    getUserAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })

            resolve(address);
        })
    },

    updateUserAddress: (data, userId) => {

        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) })
           
            if (user.address) {
                
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) },
                    {
                        $push: { address: data }
                    }
                 
                    ).then(() => {
                        resolve(response)
                    })
            }

        })
    },
    addAddress: (body, userId) => {
        return new Promise((req, res) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId() })
        })
    },

    getUserOrders: (userId) => {
        console.log(userId);
        console.log("vannallooooo");
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                {
                    $match: { userId: ObjectId(userId) }
                },

                {
                    $project: {

                        date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        deliveryDetails: 1,

                        userId: 1,
                        paymentMethod: 1,
                        products: 1,
                        totalAmount: 1,
                        status: 1,
                        item: '$products.item',
                        quantity: '$products.quantity'
 
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },



            ]).toArray()

            resolve(orderItems)
        })
    },
    getsingleUserorder: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: objectId(orderId) }).then((order) => {

                resolve(order)
            })

        })
    },

    getOrderProducts: (orderId) => {

        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                {
                    $match: { _id: ObjectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()

            resolve(orderItems)
        })
    },
    getAllProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            orderProduct = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
           
            resolve(orderProduct)
        })

    },


    getCategoryName: (name) => {
        return new Promise(async (resolve, reject) => {
            let pro = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: name }).toArray()
            resolve(pro)
          
        })
    },
    generateRazorPay: (orderId, total) => {
       
        return new Promise((resolve, reject) => {
            

            var options = {
                amount: total * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                   
                    resolve(order)
                }

            });

        })
    },
    generatePaypal: (orderId, total) => {
      
        return new Promise((resolve, reject) => {



            const create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "https://deepthyprasad.com/success",
                    "cancel_url": "https://deepthyprasad.com/cancel"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "Red Sox Hat",
                            "sku": "001",
                            "price": total,
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": total
                    },
                    "description": "Hat for the best team ever"
                }]
            };
            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    throw error;
                } else {
                  
                    resolve(payment)
                  
                }
            });


        })
    },



    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'WkXpAK6iRh0CpnUt8r5PlyDs')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) },
                {
                    $set: {
                        status: "placed"
                    }
                }).then(() => {
                    resolve()
                })
        })
    },
    changePassword: (data, id) => {

        return new Promise(async (resolve, reject) => {
          
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(id) })
            console.log(user);
            if (user) {

                bcrypt.compare(data.oldpass, user.password).then(async (status) => {
                    
                    if (status) {
                        let password = await bcrypt.hash(data.newpass, 10)
                        db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(id) }, {
                            $set: {
                                password: password
                            }
                        }).then((response) => {

                            console.log(response)
                            response.status = true
                            resolve(response)
                        })
                        
                    } else {
                       
                        resolve({ status: false })
                    }
                })
            } else {
         
                resolve({ status: false })

            }
        })
    },
    getWhishlistItems: (userId) => {
        
        return new Promise(async (resolve, reject) => {
            let wishlistItems = await db
                .get()
                .collection(collection.WHISHLIST_COLLECTION)
                .aggregate([
                    {
                        $match: { user: objectId(userId) },
                    },
                    {
                        $unwind: "$products",
                    },
                    {
                        $project: {
                            item: "$products.item",
                            quantity: "$products.quantity",
                        },
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: "item",
                            foreignField: "_id",
                            as: "product",
                        },
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            product: { $arrayElemAt: ["$product", 0] },
                        },
                    },
                ])
                .toArray();
        
            resolve(wishlistItems);
        
        })
    },

    addToWishList: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }

        return new Promise(async (resolve, reject) => {
            let UserCart = await db.get().collection(collection.WHISHLIST_COLLECTION).findOne({ user: ObjectId(userId) })

            if (UserCart) {
                let proExist = UserCart.products.findIndex(product => product.item == proId)
                console.log(proExist);
                console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh");
                if (proExist != -1) {
                    console.log("111");
                    db.get().collection(collection.WHISHLIST_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve({ productExist: true })
                        })
                }

                else {
                    db.get().collection(collection.WHISHLIST_COLLECTION).updateOne({ user: ObjectId(userId) },
                        {

                            $push: { products: proObj }

                        }

                    ).then((response) => {
                        resolve({ status: true })
                    })
                }
            } else {
                console.log("helo");
                let cartObj = {
                    user: ObjectId(userId),
                    products: [proObj]

                }
                db.get().collection(collection.WHISHLIST_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve({ status: true })
                })
            }
        })
    },
    cancelOrders: (orderId) => {
    
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: {
                        status: 'cancelled'
                    }
                }).then(() => {
                    resolve()
                })
        })

    },

    addUserCoupon: (code, userId) => {

        return new Promise(async (resolve, reject) => {
            let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ couponCode: code.coupon })
            console.log(coupon)
            if (coupon) {



                let coupons = await db.get().collection(collection.USER_COLLECTION).aggregate([

                    {
                        $match: {
                            _id: objectId(userId)
                        }
                    },
                    {
                        $unwind: "$coupon"
                    }
                ]).toArray()
               

                if (coupons && coupons.length != 0) {
                    
                    resolve({ Alreadyusedcoupon: true })

                } else {
                    
                    let applycoupon = 1 - coupon.couponOffer / 100
             
                    let updatecoupon = await db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId) },
                        {
                            $set: {
                                coupon: applycoupon,
                                couponoffer: true,
                                offer:coupon.couponOffer,
                            }
                           
                        }
                    ).then((response) => {

                        resolve(response)


                    })

                }


            } else {
                resolve({ INVALIDCOUPON: true })
            }
        })
    },
    listorder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let result = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: objectId(orderId) })
            resolve(result)
        })
    },
    
    addRefferal: (refferal, userId) => {
        return new Promise(async (resolve, reject) => {
            user = await db.get().collection(collection.USER_COLLECTION).findOne({ refferalcode: refferal })
            if (user) {
                if (user.wallet) {
                    db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(user._id) }, {
                        $inc: {
                            wallet: 100
                        }
                    })
                } else {
                    db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(user._id) },
                        {
                            $set: {
                                wallet: 100
                            }
                        })
                }
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
                    {
                        $set: {
                            wallet: 100,
                        }
                    }).then(() => {
                        resolve()
                    })
            }
        })
    },
    getNewUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            resolve(user)

        })
    },
    addprofileAddress: (data, userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) })
       
            if (user.address) {
              
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) },
                    {
                        $push: { address: data }
                    }).then(() => {
                        resolve(response)
                    })
            }

        })
    },
    addressEdit: (data, body, userId) => {
        return new Promise((resolve, reject) => {
            

            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId) }, {
                $set: {
                  "address.$[elem].name": body.name,
                  "address.$[elem].number": body.number,
                 "address.$[elem].Email": body.Email,
                  "address.$[elem].address": body.address,
                  "address.$[elem].city": body.city,
                  "address.$[elem].pincode": body.pincode,
                  
                },
            },{arrayFilters:[{"elem.addressId":data}]}).then((s) => {
                console.log(s);
               
            }).then((response) => {
                resolve()
            })
        })
    },
    deleteAddress: (deleteId,userId) => {
        return new Promise((resolve, reject) => {
            
            db.get().collection(collection.USER_COLLECTION).update({ _id: objectId(userId) },{
                $pull:{
                    address:{
                        addressId:deleteId
                    }
                }
                

            },false,
            true
            ).then((response)=>{
                resolve(response)
            })
                
         
        })
    },
    removeCoupon: (id) => {
        return new Promise(async (resolve, reject) => {
            let usercart = await db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(id) }, {
                $set: {
                    coupon: 1,
                   couponoffer:false,

                }
            }).then((response) => {
             
                resolve({ status: true })
            })

        })
    },

}

