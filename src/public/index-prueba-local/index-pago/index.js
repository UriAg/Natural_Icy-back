//---------------------------MOSTRAR CARRITO
let quantity
let unitPrice
let amount = 0

function showCart(){
  let tokenCookie = localStorage.getItem('tokenCookie');

  const productIds = [{id:'659857ac68d4f2ebb581d6e6', quantity:1}, {id:'659857ac68d4f2ebb580d6e6', quantity:2}, {id:'659857c868d4f2ebb581d6ea', quantity:3}, {id:'65985819bc7e6b723972114f', quantity:5}]
  
  let fetchOptions = {
      method: 'POST',
      mode: 'cors',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(productIds)
  };

  if (tokenCookie) {
      fetchOptions.headers['Authorization'] = `Bearer ${tokenCookie}`;
  }

  fetch('https://naturalicy-back-production.up.railway.app/api/carts/selected', fetchOptions)
  .then(res => res.json())
  .then(res => {
      const productsDiv = document.querySelector('.items')
      console.log(res)
      if(!res.products || !res.products.length){
          return console.log('no se encontraron productos en carrito')
      }
      for(const product of res.products){
        quantity = parseInt(product.quantity, 10);
        unitPrice = parseFloat(product.price);
        amount += parseInt(unitPrice) * parseInt(quantity);
          const div = document.createElement('div')
          div.innerHTML = `
              <h4>${product.title}</h4>
              <p><b>ID: </b>${product.id}</p>
              <p><b>Description: </b id="product-description">${product.description}</p>
              <p><b>Price: $</b id="unit-price">${product.price}</p>
              <p><b>Quantity: </b id="quantity">${product.quantity}</p>
              <p><b>Category: </b>${product.category}</p>
              ${product.thumbnail.length && product.thumbnail.map(img=> `<img src="https://naturalicy-back-production.up.railway.app/${img}" width="200px" heigth="150px" alt="Imagen de producto">`)}
              <button type="button">Eliminar del carrito</button>
              <hr>
              `
          productsDiv.append(div);
      }
  })
  .catch(error => console.log(error))
}
showCart()


// Add SDK credentials
const mercadopago = new MercadoPago('APP_USR-278bc867-ac14-4978-8816-bb8f9d0be97d', {
    locale: 'es-AR' // The most common are: 'pt-BR', 'es-AR' and 'en-US'
  });
  
  // Handle call to backend and generate preference.
  document.getElementById("checkout-btn").addEventListener("click", function () {
  
    $('#checkout-btn').attr("disabled", true);
  
    // const orderData = [{id:'659857ac68d4f2ebb581d6e6', quantity:1}, {id:'659857ac68d4f2ebb580d6e6', quantity:2}, {id:'659857c868d4f2ebb581d6ea', quantity:3}, {id:'65985819bc7e6b723972114f', quantity:5}]
    const orderData = [{id:'659857ac68d4f2ebb581d6e6', quantity:1}, {id:'659857c868d4f2ebb581d6ea', quantity:3}, {id:'65985819bc7e6b723972114f', quantity:5}]
    const address = {
      street_name: 'Calle falsa',
      street_number: 7732,
      apartment: '7C',
      aditional_info: 'Es por ahí, buscá',
      zip_code: '5885' 
    }
    const phone = {
      area_code: 3544,
      number: 300779
    }
    

    let tokenCookie = localStorage.getItem('tokenCookie');

    let fetchOptions = {
        method: 'POST',
        // mode: 'cors',
        // credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({orderData, address, phone}),
    };
    if (tokenCookie) {
        fetchOptions.headers['Authorization'] = `Bearer ${tokenCookie}`;
    }

  
    fetch("https://naturalicy-back-production.up.railway.app/api/checkout/createPreference", fetchOptions)
      .then(function (response) {
        return response.json();
      })
      .then(function (preference) {
        console.log(preference)
        createCheckoutButton(preference.id);
  
        $(".shopping-cart").fadeOut(500);
        setTimeout(() => {
          $(".container_payment").show(500).fadeIn();
        }, 500);
      })
      .catch(function () {
        alert("Unexpected error");
        $('#checkout-btn').attr("disabled", false);
      });
  });
  
  function createCheckoutButton(preferenceId) {
    // Initialize the checkout
    const bricksBuilder = mercadopago.bricks();
  
    const renderComponent = async (bricksBuilder) => {
      if (window.checkoutButton) window.checkoutButton.unmount();
      await bricksBuilder.create(
        'wallet',
        'button-checkout', // class/id where the payment button will be displayed
        {
          initialization: {
            preferenceId: preferenceId,
          },
          callbacks: {
            onError: (error) => console.error(error),
            onSubmit:()=>{},
            onReady: () => {},
          },
        }
      );
    };
    window.checkoutButton =  renderComponent(bricksBuilder);
  }
  
  // Handle price update
  function updatePrice() {
    
  
    document.getElementById("cart-total").innerHTML = "$ " + amount;
    document.getElementById("summary-price").innerHTML = "$ " + unitPrice;
    document.getElementById("summary-quantity").innerHTML = quantity;
    document.getElementById("summary-total").innerHTML = "$ " + amount;
  }
  
  updatePrice();
  
  // Go back
  document.getElementById("go-back").addEventListener("click", function () {
    $(".container_payment").fadeOut(500);
    setTimeout(() => {
      $(".shopping-cart").show(500).fadeIn();
    }, 500);
    $('#checkout-btn').attr("disabled", false);
  });