var db = require('../config/connection')
var collection = require('../config/collections')
const async = require('hbs/lib/async')
const { report } = require('../app')

const objectId = require('mongodb').ObjectId
module.exports = {
    addProduct: (body, files) => {
        body.images = files
        body.price = parseInt(body.price)
        body.offerPrices = body.price
        body.offerstatus = false;
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.PRODUCT_COLLECTION).insertOne(body)
            resolve();
        })
    },
    addOffer: (offer) => {

        return new Promise((resolve, reject) => {


            db.get().collection(collection.OFFER_COLLECTION).insertOne(offer).then((result) => {
                resolve(result)
            })
        })
    },

    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()

            resolve(products)
        })
    },
    getOffer: () => {
        return new Promise(async (resolve, reject) => {
            let offer = await db.get().collection(collection.OFFER_COLLECTION).find().toArray()
            resolve(offer)
        })
    },
    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
        
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(prodId) }).then((response) => {

                resolve(response)
            })
        })
    },

    getProductDetails: (proId) => {
        return new Promise(async (resolve, reject) => {

            try {
                let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) })

                resolve(product)
            } catch (error) {
                reject()
            }

        })
    },
    updateProduct: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) }, {
                $set: {
                    Name: proDetails.Name,
                    Description: proDetails.Description,
                    price: proDetails.price,
                    category: proDetails.category
                }
            }).then((response) => {
                resolve()
            })
        })
    },


    addUser: (users, callback) => {

        db.get().collection('users').insertOne(users).then((datas) => {

            callback(datas.insertedId)
        })
    },
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    deleteUser: (prodId) => {
        return new Promise((resolve, reject) => {
            console.log(prodId)

            db.get().collection(collection.USER_COLLECTION).deleteOne({ _id: objectId(prodId) }).then((response) => {

                resolve(response)
            })
        })
    },
    getUserDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(proId) }).then((user) => {
                resolve(user)
            })
        })
    },
    updateUser: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(proId) }, {
                $set: {
                    Name: proDetails.Name,
                    Email: proDetails.Email,
                    Password: proDetails.Password,

                }
            }).then((response) => {
                resolve()
            })
        })
    },
    blockuser: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(id) }, { $set: { status: true, status: false } }).then((block) => {
                resolve(block)
            })
        })
    },
    unblockuser: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(id) }, { $set: { status: false, status: true } }).then((unblock) => {
                resolve(unblock)
            })
        })
    },
    Category: (body, files) => {
        body.images = files
        body.Offer = parseInt(body.Offer)

        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CATEGORY_COLLECTION).insertOne(body)
            resolve();
        })
    },

    getCategory: () => {

        return new Promise(async (resolve, reject) => {
            let category = db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })
    },
    getCategoryView: () => {
        return new Promise(async (resolve, reject) => {
            let item = db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(item)

        })


    },
    deleteCategory: (dataId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(dataId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getCategoryDetails: (proId) => {
        return new Promise(async (resolve, reject) => {

            console.log(proId)

            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(proId) })

            resolve(category)
        })
    },



    updateCategory: (proId, proDetails) => {


        proDetails.Offer = parseInt(proDetails.Offer)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(proId) }, {
                $set: {
                    Name: proDetails.Name,

                    Offer: proDetails.Offer

                }
            }).then((response) => {
                resolve()
            })
        })
    },
    getOrderList: () => {
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
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
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'

                    }
                },


            ]).toArray()
            console.log(order);
            resolve(order)

        })
    },


    cancelOrder: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(userId) },
                {
                    $set: {
                        status: 'cancelled'
                    }
                }).then(() => {
                    resolve()
                })
        })

    },
    deliverOrder: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(userId) },
                {
                    $set: {
                        status: 'delivered'
                    }
                }).then(() => {
                    resolve()
                })
        })

    },
    shipOrder: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(userId) },
                {
                    $set: {
                        status: 'shipped'
                    }
                }).then(() => {
                    resolve()
                })
        })

    },
    updateStatus: (detail) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(detail.orderId) },
                {

                })
        })
    },
    getDailySale: () => {
        return new Promise(async (resolve, reject) => {
            let dailysale = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        "status": { $nin: ['cancelled', 'pending'] }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        total: { $sum: '$totalAmount' },
                        count: { $sum: 1 },
                    }
                },
                {
                    $sort: { _id: 1 },
                }

            ]).toArray()

            resolve(dailysale)
        })
    },
    getMonthlySale: () => {
        return new Promise(async (resolve, reject) => {
            let monthlySales = await db
                .get()
                .collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: {

                            "status": { $nin: ["cancelled", "Pending"] }

                        },
                    },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
                            total: { $sum: '$totalAmount' },
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $sort: { _id: 1 },
                    },

                ])
                .toArray();

            resolve(monthlySales);
        });
    },
    getYearlySale: () => {
        return new Promise(async (resolve, reject) => {
            let yearlySales = await db
                .get()
                .collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: {


                            "status": { $nin: ["cancelled", "Pending"] }




                        },
                    },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y", date: "$date" } },
                            total: { $sum: '$totalAmount' },
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $sort: { _id: 1 },
                    },

                ])
                .toArray();

            resolve(yearlySales);
        });
    },
    totalSale: () => {
        return new Promise(async (resolve, reject) => {
            total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalAmount' }
                    }
                },
            ]).toArray()


            if (total[0]) {
                resolve(total[0].total)
            } else {
                resolve(0)
            }

        })

    },
    totalPaypal: () => {
        return new Promise(async (resolve, reject) => {
            total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                {
                    $match: {
                        paymentMethod: "PAYPAL",
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalAmount' }
                    }
                },
            ]).toArray()

            if (total[0]) {
                resolve(total[0].total)
            } else {
                resolve(0)
            }

        })

    },
    totalCod: () => {
        return new Promise(async (resolve, reject) => {
            total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                {
                    $match: {
                        paymentMethod: "COD",
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalAmount' }
                    }
                },
            ]).toArray()

            if (total[0]) {
                resolve(total[0].total)
            } else {
                resolve(0)
            }

        })

    },
    totalRazorpay: () => {
        return new Promise(async (resolve, reject) => {
            total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                {
                    $match: {
                        paymentMethod: "RAZORPAY",
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalAmount' }
                    }
                },
            ]).toArray()

            if (total[0]) {
                resolve(total[0].total)
            } else {
                resolve(0)
            }

        })

    },
    applyOffer: (proId, Offer) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find({ _id: objectId(proId) }).toArray()
            let offer = await db.get().collection(collection.OFFER_COLLECTION).find({ _id: objectId(Offer.offer) }).toArray()


            let price = product[0].price;
            let offers = 1 - parseInt(offer[0].offer) / 100
            offerPrice = price * offers
            discountPrice = price - offerPrice;


            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) },
                {
                    $set: {
                        offerPrices: Math.round(offerPrice),
                        DiscountPrice: Math.round(discountPrice),

                        offerPercentage: offer[0].offer,
                        offerstatus: true
                    }
                }).then((result) => {
                    resolve(result)
                })

        })

    },
    updateOffers: (Name) => {
        console.log(Name);
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ Name: Name.data })
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                {
                    $match: {
                        category: Name.data,
                    }
                },
            ]).toArray()

            resolve(product)

            product.map(async (value, index) => {
                let id = value._id
                let offers = value.price - category.Offer
                console.log(offers);
                await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({ _id: objectId(id) },
                    {
                        $set: {
                            price: offers,
                        }
                    })
            })
            resolve()

        })

    },
    addcoupon: (body) => {
        body.couponOffer = parseInt(body.couponOffer)
        return new Promise(async (resolve, reject) => {
            Coupon = await db.get().collection(collection.COUPON_COLLECTION).insertOne(body)

            resolve()
        })
    },
    getAllCoupon: () => {
        return new Promise(async (resolve, reject) => {
            coupon = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
            resolve(coupon)
        })
    },

    getSaleReport: (from, to) => {

        return new Promise(async (resolve, reject) => {
            let report = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        date: {
                            $gte: from,
                            $lte: to
                        },
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $lookup: {
                        from: collection.USER_COLLECTION,
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                }

            ]).toArray()
            resolve(report)


        })
    },
    removeOffer: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) }, {
                $set: {
                    offerPrices: 0,
                    offerPercentage: 0,
                    DiscountPrice: 0,
                    offerstatus: false,


                }
            }).then((response) => {
                resolve(response)
            })
        })
    }
}