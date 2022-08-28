const Product = require("../models/product");
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");

exports.getProductById = (req, res, next, id) => {
  Product.findById(id).exec((err, product) => {
    if (err) {
      return res.status(400).json({
        error: "product not found in DB",
      });
    }
    req.product = product;
    next();
  });
};

exports.createProduct = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        error: "problem with image",
      });
    }

    //destructuring
    const { name, description, price, category, stock } = fields;

    if (!name || !description || !price || !category || !stock) {
      return res.status(400).json({
        err: "include all fields",
      });
    }

    let product = new Product(fields);

    if (file.photo) {
      if (file.photo.size > 3000000) {
        return res.status(400).json({
          err: "file size too big",
        });
      }
      // console.log(file.photo.path)
      product.photo.data = fs.readFile(file.photo.path, function (err, data) {
        if (err) throw err;
        console.log(data);
      });
      product.photo.contentType = file.photo.type;
    }
    product.save((err, product) => {
      console.log(err);
      if (err) {
        return res.status(400).json({
          err: "cannot save product in db",
        });
      }
      res.json(product);
    });
  });
};

exports.getProduct = (req, res) => {
  req.product.photo = undefined;
  return res.json(req.product);
};

//middleware for image loading optimization
exports.photo = (req, res, next) => {
  if (req.product.photo.data) {
    res.set("Content-Type", req.product.photo.contentType);
    return res.send(req.product.photo.data);
  }
  next();
};

exports.deleteProduct = (req, res) => {
  let product = req.product;
  product.remove((err, deletedProduct) => {
    if (err) {
      res.status(400).json({
        error: "failed to delete the product",
      });
    }
    res.json({
      message: "successfully deleted the product",
      deletedProduct,
    });
  });
};

exports.updateProduct = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        error: "problem with image",
      });
    }

    let product = req.product;
    product = _.extend(product, fields);

    if (file.photo) {
      if (file.photo.size > 3000000) {
        return res.status(400).json({
          err: "file size too big",
        });
      }
      // console.log(file.photo.path)
      product.photo.data = fs.readFile(file.photo.path, function (err, data) {
        if (err) throw err;
        console.log(data);
      });
      product.photo.contentType = file.photo.type;
    }

    product.save((err, product) => {
      console.log(err);
      if (err) {
        return res.status(400).json({
          err: "updation of product failed",
        });
      }
      res.json(product);
    });
  });
};

//for listing the products
exports.getAllProducts = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 8;
  let sortBy = req.query.sortBy ? req.query.sortBy : "_id";

  Product.find()
    .select("-photo")
    .populate("category")
    .sort([[sortBy, "asc"]])
    .limit(limit)
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({
          error: "NO product found",
        });
      }
    });
};

exports.getAllUniqueCategories = (res, req) => {
  Product.distinct("category",{},(err,category)=>{
    if(err){
      res.status(400).json({
        err:"no category found"
      })
    }
  })
  res.json(category)
};


exports.updateStock = (req, res, next) => {
  let myOperations = req.body.order.products.map((prod) => {
    return {
      updateOne: {
        filter: { _id: prod._id }, //to find the product
        update: { $inc: { stock: -prod.count, sold: +prod.count } },
      },
    };
  });
  Product.bulkWrite(myOperations, {}, (err, products) => {
    if (err) {
      res.status(400).json({
        err: "Bulk operation failed",
      });
    }
  });
  next();
};
