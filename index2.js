//Elementos del DOM
// Agrega un evento para detectar el cambio en el select de "Tipo Caja"
const tipoCajaSelect = document.getElementById("tipoCaja");
const uniSelect = document.getElementById("uni");
console.log(uni);

//Declaracion de variables para generar codigo QR
const contenedorQR = document.getElementById('contenedorQR');
const formulario = document.getElementById('formulario')
const QR = new QRCode(contenedorQR); 

// Inicializa el select2
$(document).ready(function() {
    $('.select2').select2();
});

// Agrega un evento para llenar el select de "Unidad" cuando se carga la página
window.addEventListener("load", () => {
    const selectedTipoCaja = tipoCajaSelect.value;
    
    // Actualiza la URL GET_URL con el tipo de caja seleccionado
    const GET_URL = `https://quintaapp.com.mx:3001/unidad/consulta/QUERETARO|${selectedTipoCaja}`;
    
    // Realiza una solicitud para obtener la lista de unidades
    fetch(GET_URL)
        .then(response => response.json())
        .then(object => {
            // Limpia el select de "Unidad"
            uniSelect.innerHTML = "";

            // Agrega las opciones correspondientes al select de "Unidad" manteniendo la misma URL
            object.forEach(element => {
                uniSelect.add(new Option(element.unidad, 'https://quintaapp.com.mx:3001/trailerapp/ubicacion_cajas.html?id=' + element._id + '&numero_unidad=' + element.unidad));
            });
        })
        .catch(error => console.log(error));
});

tipoCajaSelect.addEventListener("change", () => {
    const selectedTipoCaja = tipoCajaSelect.value;
    
    // Actualiza la URL GET_URL con el tipo de caja seleccionado
    const GET_URL = `https://quintaapp.com.mx:3001/unidad/consulta/QUERETARO|${selectedTipoCaja}`;
    
    // Realiza una solicitud para obtener la lista de unidades
    fetch(GET_URL)
        .then(response => response.json())
        .then(object => {
            // Limpia el select de "Unidad"
            uniSelect.innerHTML = "";

            // Agrega las opciones correspondientes al select de "Unidad" manteniendo la misma URL
            object.forEach(element => {
                uniSelect.add(new Option(element.unidad, 'https://quintaapp.com.mx:3001/trailerapp/ubicacion_cajas.html?id=' + element._id + '&numero_unidad=' + element.unidad));
            });
        })
        .catch(error => console.log(error));
});

    formulario.addEventListener("submit", (e) => {//con este evento detecta cuando presionas el boton
        e.preventDefault();//para que no se actualice automaticamente la pagina
        QR.makeCode($('#uni').val());
    });

  const downloadBtn = document.getElementById('downloadBtn');

  downloadBtn.addEventListener('click',() => {
        let img = document.getElementById('contendorQR img');

        if(img !== null){
            let imgAtrr = img.getAttribute('src');
            downloadBtn.setAttribute("href", imgAtrr);
        }
        else{
            downloadBtn.setAttribute("href", `${document.querySelector('canvas').toDataURL()}`);
        }
  });

    const scanner = new Html5QrcodeScanner('reader', {
        qrbox: {
            width: 250,
            height: 250,
        },
        fps: 20,
    });

    scanner.render(success, error);

    function success(result) {

        document.getElementById('result').innerHTML = `
        <h2>Resultado:</h2>
        <p><a href="${result}">${result}</a></p>
        `;

        scanner.clear();
        document.getElementById('reader').remove();
    
    }

    function error(err) {
        console.error(err);
    }