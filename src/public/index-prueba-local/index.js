//---------------------------RELLENAR CAMPOS
function rellenar(){
    const title = document.getElementById('title').value = "Edit";
    const description = document.getElementById('description').value = "Edit";
    const labels = document.getElementById('labels').value = "Edit";
    const code = document.getElementById('code').value = "Edit";
    const price = document.getElementById('price').value = 1;
    const stock = document.getElementById('stock').value = 1;
    const category = document.getElementById('category').value = "Edit";
}

//---------------------------REGISTER
function register(){
    let tokenCookie = localStorage.getItem('tokenCookie');
    const URL = 'http://localhost:3000/api/sessions/register';
    const DATA = {
        name: 'Marta',
        last_name: 'papela',
        email: "marta@gmail.com",
        role: 'USER',
        password:"123"
    };

    let fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(DATA),
    };

    if (tokenCookie) {
        fetchOptions.headers['Authorization'] = `Bearer ${tokenCookie}`;
    }

    fetch(URL, fetchOptions)
    .then((res) => res.json())
    .then(res => {
        console.log(res)
    })
    .catch((error) => console.log("Error:", error))
}

//---------------------------LOGIN
function login(){
    let tokenCookie = localStorage.getItem('tokenCookie');
    const URL = 'http://localhost:3000/api/sessions/login';
    const DATA = { email: "marta@gmail.com", password:"123" };

    let fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(DATA),
    };

    if (tokenCookie) {
        fetchOptions.headers['Authorization'] = `Bearer ${tokenCookie}`;
    }

    fetch(URL, fetchOptions)
    .then((res) => res.json())
    .then(res => {
        localStorage.setItem('tokenCookie', res.generateTokenCookie);
        console.log(res)
        alert(res.payload)
    })
    .catch((error) => console.log("Error:", error))
}

//---------------------------LOGOUT
function logout(){
    let tokenCookie = localStorage.getItem('tokenCookie');
    let fetchOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (tokenCookie) {
        fetchOptions.headers['Authorization'] = `Bearer ${tokenCookie}`;
    }

    fetch('http://localhost:3000/api/sessions/logout', fetchOptions)
    .then((res) => res.json())
    .then(res => {
        localStorage.removeItem('tokenCookie');
        console.log(res)
        alert(res.payload)
    })
    .catch((error) => console.log("Error:", error))
}

//---------------------------SUBIR PRODUCTO
function subirProducto() {
    let tokenCookie = localStorage.getItem('tokenCookie');

    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const labels = document.getElementById('labels').value;
    const code = document.getElementById('code').value;
    const price = parseFloat(document.getElementById('price').value);
    const images = document.getElementById('images').files;
    const stock = parseInt(document.getElementById('stock').value, 10);
    const category = document.getElementById('category').value;
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('code', code);
    formData.append('price', price);
    formData.append('stock', stock);
    formData.append('category', category);
    
    const labelsArray = [];
    labels && labelsArray.push(labels)
    labelsArray.push('Otra Label')
    formData.append('labels', labelsArray);

    for (const image of images) {
        formData.append('thumbnail', image);
    }
    
    let fetchOptions = {
        method: 'POST',
        headers:{},
        body: formData,
    };
    if (tokenCookie) {
        fetchOptions.headers['Authorization'] = `Bearer ${tokenCookie}`;
    }

    fetch('http://localhost:3000/api/products', fetchOptions)
    .then(response=>{
        if(!response.ok){
            throw new Error(`Error en la solicitud: ${response.status}`);
        }
        return response.json()
    })
    .then(response => {
        console.log(response)
        alert('Producto cargado')
    })
    .catch(error => alert(error))
    
    return false
}

//---------------------------EDITAR PRODUCTO
function editarProducto(){
    let tokenCookie = localStorage.getItem('tokenCookie');

    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const labels = document.getElementById('labels').value;
    const price = parseFloat(document.getElementById('price').value);
    const images = document.getElementById('images').files;
    const stock = parseInt(document.getElementById('stock').value, 10);
    const category = document.getElementById('category').value;
    const productoAEditar = document.getElementById('editable').value;
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('stock', stock);
    formData.append('category', category);
    
    const labelsArray = [];
    labels && labelsArray.push(labels)
    labelsArray.push('Otra Label modificada')
    formData.append('labels', labelsArray);

    for (const image of images) {
        formData.append('thumbnail', image);
    }
    
    let fetchOptions = {
        method: 'PUT',
        headers:{},
        body: formData,
    };
    if (tokenCookie) {
        fetchOptions.headers['Authorization'] = `Bearer ${tokenCookie}`;
    }

    fetch(`http://localhost:3000/api/products/${productoAEditar}`, fetchOptions)
    .then(response=>{
        if(!response.ok){
            throw new Error(`Error en la solicitud: ${response.status}`);
        }
        return response.json()
    })
    .then(response => {
        console.log(response)
        return false;
    })
    
    return false
}

//---------------------------ELIMINAR PRODUCTO
function eliminarProducto(){
    let tokenCookie = localStorage.getItem('tokenCookie');

    const producto = document.getElementById('identificador').value;

    let fetchOptions = {
        method: 'DELETE',
        headers:{}
    };
    if (tokenCookie) {
        fetchOptions.headers['Authorization'] = `Bearer ${tokenCookie}`;
    }

    fetch(`http://localhost:3000/api/products/${producto}`, fetchOptions)
    .then(response=>{
        if(!response.ok){
            throw new Error(`Error en la solicitud: ${response.status}`);
        }
        return response.json()
    })
    .then(response => {
        console.log(response)
        return false;
    })
    
    return false
}

//---------------------------MOSTRAR PRODUCTOS
function showProducts(){
    fetch('http://localhost:3000/api/products/', {method:'GET'})
    .then(res => res.json())
    .then(res => {
        const productsDiv = document.getElementById('productos');
        if(!res.products || !res.products.length){
            return console.log('no se encontraron productos')
        }
        for(const product of res.products){
            const div = document.createElement('div')
            div.innerHTML = `
                <h4>${product.title}</h4>
                <p><b>ID: </b>${product._id}</p>
                <p><b>Description: </b>${product.description}</p>
                <p><b>Price: </b>$${product.price}</p>
                <p><b>Category: </b>${product.category}</p>
                <p><b>Stock: </b>${product.stock}</p>
                ${product.thumbnail.length && product.thumbnail.map(img=> `<img src="http://localhost:3000/${img}" width="200px" heigth="150px" alt="Imagen de producto">`)}
                <button type="button">Agregar a favoritos</button>
                <button type="button">Agregar al carrito</button>
                `
            productsDiv.append(div);
        }
    })
    .catch(error => console.log(error))
}
showProducts()

//---------------------------MOSTRAR FAVORITOS
function showFavorites(){
    let tokenCookie = localStorage.getItem('tokenCookie');

    // const productIds = ['659857ac68d4f2ebb581d6e6', '659857ac68d4f2ebb580d6e6', '659857c868d4f2ebb581d6ea', '65985819bc7e6b723972114f']
    const productIds = []

    let fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(productIds)
    };

    if (tokenCookie) {
        fetchOptions.headers['Authorization'] = `Bearer ${tokenCookie}`;
    }

    fetch('http://localhost:3000/api/products/selected', fetchOptions)
    .then(res => res.json())
    .then(res => {
        const productsDiv = document.getElementById('favoritos');
        console.log(res)
        if(!res.products || !res.products.length){
            return console.log('no se encontraron productos en favoritos')
        }
        for(const product of res.products){
            const div = document.createElement('div')
            div.innerHTML = `
                <h4>${product.title}</h4>
                <p><b>ID: </b>${product._id}</p>
                <p><b>Description: </b>${product.description}</p>
                <p><b>Price: </b>$${product.price}</p>
                <p><b>Category: </b>${product.category}</p>
                <p><b>Stock: </b>${product.stock}</p>
                ${product.thumbnail.length && product.thumbnail.map(img=> `<img src="http://localhost:3000/${img}" width="200px" heigth="150px" alt="Imagen de producto">`)}
                <button type="button">Eliminar de favoritos</button>
                `
            productsDiv.append(div);
        }
    })
    .catch(error => console.log(error))
}
showFavorites()


