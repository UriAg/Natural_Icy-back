async function pasoDos(){
  function getParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      token: params.get('token'),
      email: params.get('email'),
    };
  }
  
  const { token, email } = getParams();
  
  // Verificar si se proporcionaron ambos parámetros
  if (!token || !email) {
    console.log('Alerta de que no se encontraron los params')
    return;
  }
  
  const pass = document.querySelector('#password')
  const repeatPass = document.querySelector('#repeatedPassword')
  
  const data = {
    password:pass.value,
    repeatedPassword:repeatPass.value,
    token,
    email
  }

  fetch('https://natural-icy-market.netlify.app/api/sessions/changePassword', {
  method: 'POST',
  headers: {
      'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
})
  .then(response => response.json())
  .then(data => {
      console.log(data)
  })
  .catch(error => {
    console.error('Error al realizar la solicitud:', error);
  });

}