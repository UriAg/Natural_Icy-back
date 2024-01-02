//PRODUCT ERRORS
export const argsProductError = product =>{
    let { title, description, labelsArray, parsedPrice, thumbnail, code, parsedStock, category } = product
    return `
    Una o más propiedades estaban incompletas o no válidas.
    Lista de propiedades requeridas:
    * Título: debe ser una cadena de texto, se recibió '${title ? title : undefined}' (${typeof title})
    * Descripción: debe ser una cadena de texto, se recibió '${description ? description : undefined}' (${typeof description})
    * Etiquetas: debe ser un array de cadenas de texto, se recibió '${labelsArray.length ? labelsArray : undefined}' (${typeof labelsArray})
    * Precio: debe ser un número, se recibió '${parsedPrice ? parsedPrice : undefined}' (${typeof parsedPrice})
    * Imagenes: debe ser un array de cadenas de texto, se recibió '${thumbnail.length ? thumbnail : undefined}' (${typeof thumbnail})
    * Código: debe ser una cadena de texto, se recibió '${code ? code : undefined}' (${typeof code})
    * Stock: debe ser un número, se recibió '${parsedStock ? parsedStock : undefined}' (${typeof parsedStock})
    * Categoría: debe ser una cadena de texto, se recibió '${category ? category : undefined}' (${typeof category})`
}

export const invalidIdProductError = id =>{
    return `Id inválido (${id}). Se esperó un dato de tipo alfanumérico de 24 caracteres`
}


export const invalidQuantityProductError = quantity =>{
    return `Cantidad inválida (${quantity}). Se espero un valor numérico entero`
}

export const IdNotFoundProductError = id =>{
    return `El id (${id}), no se encuentra referenciado a ningún producto`
}

//CART ERRORS
export const IdNotFoundCartError = id =>{
    return `El id (${id}), no se encuentra referenciado a ningún carrito`
}

//FAVORITES ERROR
export const IdNotFoundFavoritesError = id =>{
    return `El id (${id}), no se encuentra referenciado a ningún favoritos`
}

//USER ERRORS
export const missingCredentials = () =>{
    return `Por favor, revise que la información esté completa`
}

export const missingToken = () =>{
    return `No se encontro un token adecuado de acceso, por favor logueate`
}