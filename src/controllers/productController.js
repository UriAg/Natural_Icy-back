import CustomError from "../services/errors/CustomError.js";
import {
  IdNotFoundProductError,
  argsProductError,
  invalidIdProductError,
} from "../services/errors/productErrors.js";
import { errorTypes } from "../services/errors/enums.js";
import productsService from "../services/products.service.js";
import { isValidObjectId } from "mongoose";
import path from "path";
import { promises as fsPromises } from "fs";
import { __dirname } from "../utils.js";

async function getProductsWithStockFromBD(req, res, next) {
  try {
    res.setHeader("Content-Type", "application/json");
    const products = await productsService.getProducts({isAvailable: true});

    if (!products)
      return res
        .status(200)
        .json({ payload: "No se enconraron productos", products });

    return res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
}

async function getProductsWithoutStockFromBD(req, res, next) {
  try {
    res.setHeader("Content-Type", "application/json");
    const products = await productsService.getProducts({isAvailable: false});

    if (!products)
      return res
        .status(200)
        .json({ payload: "No se enconraron productos", products });

    return res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
}

async function getProductsFromBD(req, res, next) {
  try {
    res.setHeader("Content-Type", "application/json");
    const products = await productsService.getProducts();

    if (!products)
      return res
        .status(200)
        .json({ payload: "No se enconraron productos", products });

    return res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
}

async function getFavoritesProductsFromBD(req, res, next) {
  try {
    res.setHeader("Content-Type", "application/json");
    if(!req.body || !req.body.length){
      CustomError.createError({
        name: "Error buscando productos",
        cause: "No se proporcionaron id's",
        code: errorTypes.INVALID_ARGS_ERROR,
      });
    }
    
    const productIds = req.body;
    const productIdsSanitized = productIds.filter(products=> isValidObjectId(products.id))

    const products = await productsService.getProducts({ _id: { $in: productIdsSanitized } });
    
    if (!products) return res.status(200).json({ payload: "No se encontraron productos", products });

    return res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
}

async function uploadProductToDB(req, res, next) {
  try {
    res.setHeader("Content-Type", "multipart/form-data");
    const { title, description, labels, code, price, stock, category } =
      req.body;
    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);
    const labelsArray = labels.split(",");

    let stringData = [title, description, code, category];
    let numberData = [parsedPrice, parsedStock];

    let thumbnail = req.files;
    if (
      !title ||
      !description ||
      !code ||
      !price ||
      !thumbnail ||
      !req.files ||
      !req.files.length ||
      !stock ||
      !category
    ) {
      CustomError.createError({
        name: "Error creando producto",
        cause: argsProductError({
          title,
          description,
          labelsArray,
          code,
          parsedPrice,
          thumbnail,
          parsedStock,
          category,
        }),
        code: errorTypes.INVALID_ARGS_ERROR,
      });
    }

    if (
      !stringData.every((element) => typeof element === "string") ||
      !numberData.every((element) => typeof element === "number") ||
      !labelsArray.every((element) => typeof element === "string")
    ) {
      CustomError.createError({
        name: "Error creando producto",
        cause: argsProductError({
          title,
          description,
          labelsArray,
          code,
          parsedPrice,
          thumbnail,
          parsedStock,
          category,
        }),
        code: errorTypes.INVALID_ARGS_ERROR,
      });
    }

    const isExistingCode = await productsService.getProductBy({ code: code });
    if (isExistingCode) {
      throw CustomError.createError({
        name: "Error creando producto",
        cause: "Otro producto ya posee ese codigo de identificación",
        code: errorTypes.INVALID_ARGS_ERROR,
      });
    }

    const imageUrls = [];
    for (const image of req.files) {
      imageUrls.push(image.filename.replace(/\//g, ""));
    }

    let newProduct = await productsService.createProduct({
      title,
      description,
      labels: labelsArray,
      code,
      price: parsedPrice,
      isAvailable: true,
      thumbnail: imageUrls,
      stock: parsedStock,
      category,
    });

    return res
      .status(201)
      .json({
        message: "Producto creado satisfactoriamente",
        product: newProduct,
      });
  } catch (error) {
    if (req.files.length) {
      for (const imageUrl of req.files) {
        const imagePath = path.join(
          __dirname,
          "/public/images/products",
          imageUrl.filename
        );
        try {
          await fsPromises.unlink(imagePath);
        } catch (error) {
          CustomError.createError({
            name: "Error al eliminar imagen de producto",
            cause: "Error en el procesamiento de fileSystem: multer",
            code: errorTypes.SERVER_SIDE_ERROR,
          });
        }
      }
    }
    next(error);
  }
}

async function editProductFromDB(req, res, next) {
  try {
    res.setHeader("Content-Type", "multipart/form-data");
    const productId = req.params.productId;
    const productParam = req.query.productParam.toLowerCase();

    if (!productParam) {
        CustomError.createError({
          name: "Error de parametros",
          cause: "No se proporcionó el query 'productParam'",
          code: errorTypes.INVALID_ARGS_ERROR,
        });
      }

    if (!isValidObjectId(productId)) {
      CustomError.createError({
        name: "Error buscando producto",
        cause: invalidIdProductError(productId),
        code: errorTypes.INVALID_ARGS_ERROR,
      });
    }

    const productToUpdate = await productsService.getProductById(productId);

    if (!productToUpdate) {
      CustomError.createError({
        name: "Error buscando producto",
        cause: IdNotFoundProductError(productId),
        code: errorTypes.NOT_FOUND_ERROR,
      });
    }

    const { newParamValue } = req.body;

    switch (productParam) {
      case "title":
        await productsService.updateOne(
          { _id: productId },
          { $set: { title: newParamValue } }
        );
        break;

      case "description":
        await productsService.updateOne(
          { _id: productId },
          { $set: { description: newParamValue } }
        );
        break;

      case "labels":
        const labelsArray = newParamValue.split(",");
        await productsService.updateOne(
          { _id: productId },
          { $set: { labels: labelsArray } }
        );
        break;

      case "price":
        const convertedPrice = parseFloat(newParamValue);
        await productsService.updateOne(
          { _id: productId },
          { $set: { price: convertedPrice } }
        );
        break;

      case "stock":
        const convertedStock = parseInt(newParamValue, 10);
        await productsService.updateOne(
          { _id: productId },
          { $set: { stock: convertedStock } }
        );
        break;

      case "category":
        await productsService.updateOne(
          { _id: productId },
          { $set: { category: newParamValue } }
        );
        break;

      default:
        CustomError.createError({
          name: "Error editando producto",
          cause: "El parametro proporcionado no coincide con los existentes",
          code: errorTypes.NOT_FOUND_ERROR,
        });
        break;
    }

    return res
      .status(201)
      .json({
        message: "Se modificó el producto satisfactoriamente",
        product: productToUpdate,
      });
  } catch (error) {
    next(error);
  }
}

async function addProductImagesFromDB(req, res, next) {
  try {
    res.setHeader("Content-Type", "multipart/form-data");
    const productId = req.params.productId;

    if (!isValidObjectId(productId)) {
      CustomError.createError({
        name: "Error buscando producto",
        cause: invalidIdProductError(productId),
        code: errorTypes.INVALID_ARGS_ERROR,
      });
    }

    const productToUpdate = await productsService.getProductById(productId);

    if (!productToUpdate) {
      CustomError.createError({
        name: "Error buscando producto",
        cause: IdNotFoundProductError(productId),
        code: errorTypes.NOT_FOUND_ERROR,
      });
    }

    const MAX_IMG_CAPACITY = 4;

    if(productToUpdate.thumbnail.length + req.files.length > MAX_IMG_CAPACITY){
        CustomError.createError({
            name: "Error añadiendo imagenes",
            cause: `El producto cuenta con ${productToUpdate.thumbnail.length}
            imagenes, el maximo de imagenes son 5, usted puede agregar 
            ${MAX_IMG_CAPACITY - productToUpdate.thumbnail.length} imagenes`,
            code: errorTypes.NOT_FOUND_ERROR,
        });
    }

    const imageUrls = [];
    for (const image of req.files) {
      imageUrls.push(image.filename.replace(/\//g, ""));
    }
    await productsService.updateOne(
      { _id: productId },
      { $push: { thumbnail: imageUrls } }
    );

    return res
      .status(201)
      .json({
        message: "Se agregaron las imagenes satisfactoriamente",
        uplaodedImages: imageUrls,
      });
  } catch (error) {
    if (req.files.length) {
      for (const imageUrl of req.files) {
        const imagePath = path.join(
          __dirname,
          "/public/images/products/",
          imageUrl.filename
        );
        try {
          await fsPromises.unlink(imagePath);
        } catch (error) {
          CustomError.createError({
            name: "Error al eliminar imagen de producto",
            cause: "Error en el procesamiento de fileSystem: multer",
            code: errorTypes.SERVER_SIDE_ERROR,
          });
        }
      }
    }

    next(error);
  }
}

async function deleteProductImageFromDB(req, res, next) {
  try {
    res.setHeader("Content-Type", "multipart/form-data");
    const productId = req.params.productId;
    const imageId = req.query.imageId;

    if (!imageId) {
      CustomError.createError({
        name: "Error de parametros",
        cause: "No se proporcionó el query 'imagenId'",
        code: errorTypes.INVALID_ARGS_ERROR,
      });
    }

    if (!isValidObjectId(productId)) {
      CustomError.createError({
        name: "Error buscando producto",
        cause: invalidIdProductError(productId),
        code: errorTypes.INVALID_ARGS_ERROR,
      });
    }

    const productToUpdate = await productsService.getProductById(productId);

    if (!productToUpdate) {
      CustomError.createError({
        name: "Error buscando producto",
        cause: IdNotFoundProductError(productId),
        code: errorTypes.NOT_FOUND_ERROR,
      });
    }

    productToUpdate.thumbnail.map(async (img) => {
      if (img === imageId) {
        try {
          await fsPromises.unlink(
            path.join(__dirname, "/public/images/products/", img)
          );
          await productsService.updateOne(
            { _id: productId },
            { $pull: { thumbnail: img } }
          );
        } catch (error) {
          CustomError.createError({
            name: "Error al eliminar imagen del producto",
            cause: "Error en el procesamiento de fileSystem: multer",
            code: errorTypes.SERVER_SIDE_ERROR,
          });
        }
      } else {
        CustomError.createError({
          name: "Error al eliminar imagen del producto",
          cause: "La imagen proporcionada no se encuentra en el producto",
          code: errorTypes.INVALID_ARGS_ERROR,
        });
      }
    });

    return res
      .status(201)
      .json({
        message: "Se removio la imagen satisfactoriamente",
        uplaodedImages: imageUrls,
      });
  } catch (error) {
    next(error);
  }
}

async function deleteProductFromDB(req, res, next) {
  try {
    res.setHeader("Content-Type", "application/json");
    if (!req.params.productId) {
      CustomError.createError({
        name: "Error buscando producto",
        cause: "No se especificó un ID",
        code: errorTypes.INVALID_ARGS_ERROR,
      });
    }

    const productId = req.params.productId;
    if (!isValidObjectId(productId)) {
      CustomError.createError({
        name: "Error buscando producto",
        cause: invalidIdProductError(productId),
        code: errorTypes.INVALID_ARGS_ERROR,
      });
    }

    const productToDelete = await productsService.getProductById(productId);

    if (!productToDelete) {
      CustomError.createError({
        name: "Error buscando producto",
        cause: IdNotFoundProductError(productId),
        code: errorTypes.NOT_FOUND_ERROR,
      });
    }

    for (const imageUrl of productToDelete.thumbnail) {
      const imagePath = path.join(
        __dirname,
        "/public/images/products/",
        imageUrl
      );
      try {
        await fsPromises.unlink(imagePath);
      } catch (error) {
        CustomError.createError({
          name: "Error al eliminar imagen de producto",
          cause: "Error en el procesamiento de fileSystem: multer",
          code: errorTypes.SERVER_SIDE_ERROR,
        });
      }
    }

    await productsService.deleteProduct(productId);

    let products = await productsService.getProducts();

    return res
      .status(200)
      .json({
        message: "Producto eliminado",
        productDeleted: productToDelete,
        products: products,
      });
  } catch (error) {
    next(error);
  }
}

function notFound(req, res) {
  res.setHeader("Content-Type", "application/json");
  return res.status(404).send("Bad request, 404 not found");
}

export default {
  getProductsWithStockFromBD,
  getProductsWithoutStockFromBD,
  getFavoritesProductsFromBD,
  uploadProductToDB,
  editProductFromDB,
  addProductImagesFromDB,
  deleteProductImageFromDB,
  deleteProductFromDB,
  notFound,
};
