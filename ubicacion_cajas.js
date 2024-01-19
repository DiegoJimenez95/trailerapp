let hot_global;

let numero_fila;

function obtenerParametrosURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const numero_unidad = urlParams.get('numero_unidad');
    var no_unidad = document.getElementById('no_unidad');
    no_unidad.innerHTML = numero_unidad; 
    // Puedes seguir obteniendo más parámetros aquí
    return { id, numero_unidad };
  }

console.log(obtenerParametrosURL());

function enviarDatos(url, datos, tipoRegistro) {

  const mensajeConfirmacion = tipoRegistro === 'entra'
        ? '¿Estás seguro de que deseas registrar esta unidad como ENTRA?'
        : '¿Estás seguro de que deseas registrar esta unidad como SALE?';

    Swal.fire({
        title: 'Confirmación',
        text: mensajeConfirmacion,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: `Sí, registrar como ${tipoRegistro.toUpperCase()}`,
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            fetch('https://quintaapp.com.mx:3008/cajas/guardar-estado', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datos),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la solicitud');
                }
                return response.json();
            })
            .then(data => {
                Swal.fire('Registrado', `La unidad ha sido registrada como ${tipoRegistro.toUpperCase()}`, 'success')
                .then(() => {
                    window.location.reload();
                });
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    });

    }

function obtenerMovimientosCajas() {
    fetch('https://quintaapp.com.mx:3008/cajas/consulta-estado')
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la solicitud');
        }
        return response.json();
      })
      .then(data => {
        // Procesar los datos de los movimientos de cajas aquí
        console.log('Movimientos de cajas:', data);
        
        // Llamar a una función para actualizar la tabla con los datos
        actualizarTabla(data);
      })
      .catch(error => {
        console.error('Error:', error);
      });
}

// Define variables para almacenar la fecha de pausa y la duración del temporizador
let fechaPausa;
let idTimer;
let estadoTimer;
let tiempoRestante;

function actualizarTabla(data) {
  const tabla = document.getElementById('tablaMovimientos');
  const tbody = tabla.querySelector('tbody');

  // Limpiar el contenido existente de la tabla
  tbody.innerHTML = '';

  // Crear un objeto para almacenar el registro más reciente por unidad
  const registrosMasRecientes = {};

  // Obtener la fecha y hora actual en el momento en que se actualiza la tabla
  const fechaActual = moment();

  // Declarar la variable diferenciaHoras fuera del bucle
  let diferenciaHoras;

  const numeroUnidadReemplazo = {
    "3MAD0077": "3MAD0077S",
    "3MA0074s": "3MA0074S",
    "3MAD171935": "3MAD17193S",
    //"3MAD21231": "3MAD21231S",
    "3MAD14100": "3MAD14100S",
    // Agrega más mapeos según sea necesario
  };

  const registros = []; // Guarda los registros aquí

  // Iterar sobre los datos y encontrar los registros más recientes por unidad
  data.forEach((movimiento, index) => { // Calcular la diferencia de horas y agregarla a los datos

    const numeroUnidad = movimiento.numero_unidad;
    if (numeroUnidadReemplazo[numeroUnidad]) {
      // Reemplaza el número de unidad con el nuevo valor
      movimiento.numero_unidad = numeroUnidadReemplazo[numeroUnidad];
    }
    registros.push(movimiento);
    const fechaMovimiento = moment(movimiento.fecha);

    // Calcular la diferencia de tiempo en minutos
    const minutosDiferencia = fechaActual.diff(fechaMovimiento, 'minutes');
    movimiento.diferenciaHoras = minutosDiferencia;

    const fechaTaller = moment(movimiento.fecha_envio_taller);
    const diferenciaHorasTaller = fechaActual.diff(fechaTaller, 'minutes');
    movimiento.diferenciaHorasTaller = diferenciaHorasTaller;
    
  movimiento.objetivo_traslado = movimiento.objetivo_traslado =
    movimiento.objetivo_traslado === 'Importacion' ? 'Importacion' :
    movimiento.objetivo_traslado === 'Exportacion' ? 'Exportacion' :
    'N/A';

  movimiento.cargada = movimiento.cargada =
    movimiento.cargada === 1 ? 'Cargada' :
    movimiento.cargada === 2 ? 'Descarga' :
    movimiento.cargada === 3 ? 'Dedicada' :
    'Vacia';

  movimiento.estado_caja = movimiento.estado_caja === 'Bueno' ? 'Bueno' : 'Necesita Mantenimiento';
    // Verificar si ya tenemos un registro para esta unidad
    if (registrosMasRecientes[numeroUnidad]) {
      // Comprobar si el registro actual es más reciente que el almacenado
      const fechaActual = new Date(movimiento.fecha);
      const fechaAlmacenada = new Date(registrosMasRecientes[numeroUnidad].fecha);
      
      if (fechaActual > fechaAlmacenada) {
        // El registro actual es más reciente, reemplazarlo
        registrosMasRecientes[numeroUnidad] = movimiento;
      }
    } else {
      // Si no hay registro para esta unidad, almacenar el actual
      registrosMasRecientes[numeroUnidad] = movimiento;
    }

    // Calcular el valor de 'diagnostico' y almacenarlo en los datos
    const horasDiagnostico = movimiento.diagnostico;
    const segundosRestantes = horasDiagnostico * 3600 - movimiento.diferenciaHorasTaller * 60;

    if (movimiento.espacio_taller != 'N/A' && movimiento.espacio_taller != null) {

      if (segundosRestantes > 0) {
        const horas = Math.floor(segundosRestantes / 3600);
        const minutos = Math.floor((segundosRestantes % 3600) / 60);
        // movimiento.diagnostico = `${horas} hora(s) ${minutos} minuto(s)`; //se cambio esto
        movimiento.diagnostico_str = `${horas} hora(s) ${minutos} minuto(s)`;
    } else {
        movimiento.diagnostico_str = 'Tiempo agotado';
    } 

    } else if (movimiento.diagnostico != null) {
      movimiento.diagnostico_str =  movimiento.diagnostico + ' hora(s)';
      // movimiento.diagnostico = movimiento.diagnostico + ' hora(s)' //se cambio esto
    }
    
  });

  // Obtener el número de unidad de los parámetros de la URL
  const { numero_unidad } = obtenerParametrosURL();

  // Obtener el registro correspondiente al número de unidad
  const registroUnidad = registrosMasRecientes[numero_unidad];

  if (registroUnidad) {
    // Mostrar los datos solo si hay un número de taller y el temporizador está en curso
    if (registroUnidad.espacio_taller !== 'N/A' && registroUnidad.diagnostico !== 'Tiempo agotado') {
      document.getElementById('diagnosticoValor').textContent = registroUnidad.diagnostico;
      document.getElementById('tallerValor').textContent = registroUnidad.espacio_taller;
      document.getElementById('infoDiagnostico').style.display = 'block';
    } else {
      // Ocultar el div si no hay número de taller o el temporizador ha expirado
      document.getElementById('infoDiagnostico').style.display = 'none';
    }
  }

  // Obtener el ID de la unidad de los parámetros de la URL
  const parametrosURL = obtenerParametrosURL();
  const idUnidad = parametrosURL.id;
  // Realizar una solicitud GET para obtener el id_timer
  console.log('idUnidad:', idUnidad);
  fetch('https://quintaapp.com.mx:3008/timer/' + idUnidad)
  .then(response => {
    if (!response.ok) {
      throw new Error('Error en la solicitud' + response.status);
    }
    return response.json();
  })
  .then(data => {
    console.log('Timer data:', data);
    // Procesar los datos obtenidos, en este caso, almacenar el id_timer
    if (data !== null && data !== undefined) {
      // Procesar los datos obtenidos solo si data no es null ni undefined
    idTimer = data._id;
    estadoTimer = data.estado;
    //console.log('Timer data:', data);
    console.log('idTimer:', idTimer);
    console.log('Estado del temporizador:', estadoTimer);

    // Obtener la unidad específica según el dato "caja" del timer
    const unidadEspecifica = data.caja; // Ajusta según la estructura real de tus datos

    // Convertir registrosMasRecientes a un array
    const registrosArray = Object.values(registrosMasRecientes);

    // Encontrar el registro correspondiente a la unidad específica
    const registroUnidad = registrosArray.find(registro => registro.numero_unidad === unidadEspecifica);
    //console.log('Registro Unidad:', registroUnidad);

    if (registroUnidad) {
      const fechaInicio = moment(data.fecha_inicio_timer);
      const tiempoTotalPausado = data.total_tiempo_pausado * 60;
      // Calcular horasDiagnostico y horasAdicionales
      const horasDiagnostico = registroUnidad.diagnostico;
      const horasAdicionales = parseInt(horasDiagnostico); // Convertir a entero las horas del diagnóstico

      const fechaActual = moment();

      const totalHorasTimer = (horasAdicionales * 3600) + tiempoTotalPausado;

      const fechaFinalTimer = fechaInicio.clone().add(totalHorasTimer, 'seconds');

      tiempoRestante = fechaFinalTimer.diff(fechaActual, 'seconds');// Calcular la diferencia en segundos

      console.log('Fecha inicio:', fechaInicio.format('YYYY-MM-DD HH:mm:ss'));
      console.log('Tiempo total pausado:', tiempoTotalPausado);
      console.log('Horas Diagnostico:', horasDiagnostico);
      console.log('Horas adicionales:', horasAdicionales);
      console.log('Total horas timer:', totalHorasTimer);
      console.log('Fecha final timer:', fechaFinalTimer.format('YYYY-MM-DD HH:mm:ss'));
      console.log('Fecha actual:', fechaActual.format('YYYY-MM-DD HH:mm:ss'));
      console.log('Tiempo restante:', tiempoRestante);

      // Actualizar la información de diagnóstico
      actualizarInformacionDiagnostico(registrosMasRecientes, estadoTimer);

      // Agregar eventos de escucha a los botones Pausar y Reanudar
      document.getElementById('pausar').addEventListener('click', function () {
        pausarTemporizador();
      });

      document.getElementById('reanudar').addEventListener('click', function () {
        reanudarTemporizador();
      });

      document.getElementById('finalizar').addEventListener('click', function () {
        finalizarTemporizador();
      });

    } else {
      console.error('No se encontró un registro correspondiente a la unidad específica.');
    }
  } else {
    // Si data es null o undefined, puedes manejar este caso según tus necesidades.
    console.log('No hay timer activo.');
    // Por ejemplo, puedes reiniciar las variables idTimer y estadoTimer a un valor predeterminado.
    idTimer = null;
    //estadoTimer = 'INICIADO';  // Puedes ajustar el valor predeterminado según tus necesidades.
  }
  })
  .catch(error => {
    console.error('Error:', error);
  });

// Función para pausar el temporizador
function pausarTemporizador() {
  fechaPausa = moment().format('YYYY-MM-DDTHH:mm:ss'); // Obtener la fecha actual con moment

  console.log('Timer: ' + idTimer + ' Fecha: ' + fechaPausa);

  // Realizar solicitud al servidor al pausar
  fetch('https://quintaapp.com.mx:3008/timer/pausar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id_timer: idTimer,
      fecha: fechaPausa, // Enviar la fecha de pausa al servidor
      // Otros datos que puedas necesitar enviar al servidor
    }),
  })
    .then(response => response.json())
    .then(data => {
      // Verificar el estado del temporizador en la respuesta del servidor
      console.log('Estado del temporizador en la respuesta:', estadoTimer);

      window.location.reload();
    })
    .catch(error => {
      console.error('Error al pausar el temporizador:', error);
    });
}

// Función para reanudar el temporizador
function reanudarTemporizador() {
  // Reanudar el temporizador
  if (fechaPausa, estadoTimer) {
    const fechaReanudar = moment().format('YYYY-MM-DDTHH:mm:ss'); // Obtener la fecha actual con moment

    // Realizar solicitud al servidor al reanudar
    fetch('https://quintaapp.com.mx:3008/timer/reanudar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id_timer: idTimer,
        fecha: fechaReanudar, // Enviar la fecha de reanudar al servidor
        // Otros datos que puedas necesitar enviar al servidor
      }),
    })
      .then(response => response.json())
      .then(data => {
        window.location.reload();
      })
      .catch(error => {
        console.error('Error al reanudar el temporizador:', error);
      });
  } else {
    console.log('Error: No se ha pausado el temporizador previamente.');
  }
}

// Función para finalizar el temporizador
function finalizarTemporizador() {
  //Verificar si el tiempoRestante es mayor que cero
  const finalizoATiempo = tiempoRestante > 0;

  // Realizar solicitud al servidor al finalizar
  return fetch('https://quintaapp.com.mx:3008/timer/finalizar/' + idTimer, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id_timer: idTimer,
      finalizo_a_tiempo: finalizoATiempo,
      //fecha: fechaPausa, // Enviar la fecha de pausa al servidor
      // Otros datos que puedas necesitar enviar al servidor
    }),
  })
    .then(response => response.json())
    .then(data => {
      // Verificar el estado del temporizador en la respuesta del servidor
      console.log('Estado del temporizador en la respuesta:', estadoTimer);
      console.log('El temporizador finalizó a tiempo:', finalizoATiempo);

      //window.location.reload();
    })
    .catch(error => {
      console.error('Error al finalizar el temporizador:', error);
    });
}

// Definir la función de verificación periódica
function actualizarInformacionDiagnostico(registrosMasRecientes, estadoTimer) {
// Obtener el número de unidad de los parámetros de la URL
const { numero_unidad } = obtenerParametrosURL();

// Verificar si numero_unidad es nulo o indefinido
if (numero_unidad === null || numero_unidad === undefined) {
  // Si no se está obteniendo ningún número de unidad, ocultar "infoDiagnostico"
  const infoDiagnosticoElement = document.getElementById('infoDiagnostico');
  if (infoDiagnosticoElement) {
      infoDiagnosticoElement.style.display = 'none';
  }
  return; // Salir de la función
}                                                                                                                                                   

// Obtener el registro correspondiente al número de unidad
const registroUnidad = registrosMasRecientes[numero_unidad];

// Verificar si el registro existe
if (!registroUnidad) {
  return; // Si no existe, salir de la función
}

// Obtener referencias a los elementos del DOM
const diagnosticoElement = document.getElementById('diagnosticoValor');
const tallerElement = document.getElementById('tallerValor');
const infoDiagnosticoElement = document.getElementById('infoDiagnostico');
const registroFormElement = document.getElementById('registroForm');
const timerEnPausaElement = document.getElementById('timerEnPausa');
const infoTimerElement = document.getElementById('infoTimer');
const remolquesElement = document.getElementById('remolques');
const divBtnsElement = document.getElementById('divBtns');

// Verificar el estado del temporizador
if (estadoTimer === 'PAUSADO') {
  // Si el temporizador está pausado, ocultar "infoTimer" y mostrar "timerEnPausa"
  infoTimerElement.style.display = 'none';
  timerEnPausaElement.style.display = 'block';
} else if (estadoTimer === 'REANUDADO') {
  // Si el temporizador está reanudado, mostrar "infoTimer" y ocultar "timerEnPausa"
  infoTimerElement.style.display = 'block';
  timerEnPausaElement.style.display = 'none';
} 

// Verificar el estado del temporizador
if (estadoTimer === 'PAUSADO' || estadoTimer === 'REANUDADO' || estadoTimer === 'INICIADO') {
  // Si el temporizador está pausado, reanudado o iniciado, ocultar "remolques" y "divBtns"
  remolquesElement.style.display = 'none';
  divBtnsElement.style.display = 'none';
} 

// Verificar si ambos campos son null o undefined o "N/A"
const diagnosticoIsNull = registroUnidad.diagnostico === null || registroUnidad.diagnostico === undefined || registroUnidad.diagnostico === 'N/A';
const tallerIsNull = registroUnidad.espacio_taller === null || registroUnidad.espacio_taller === undefined || registroUnidad.espacio_taller === 'N/A';

// Verificar si el diagnostico es "Tiempo agotado" y espacio_taller no es "N/A"
const diagnosticoEsTiempoAgotado = registroUnidad.diagnostico === 'Tiempo agotado';
const espacioTallerEsNumero = !isNaN(registroUnidad.espacio_taller);

// Nueva validación: Mostrar "infoDiagnostico" si el temporizador está en "Tiempo agotado" y está pausado
if (diagnosticoEsTiempoAgotado && estadoTimer === 'PAUSADO') {
  diagnosticoElement.textContent = registroUnidad.diagnostico;
  tallerElement.textContent = registroUnidad.espacio_taller;
  infoDiagnosticoElement.style.display = 'block';
  registroFormElement.style.display = 'none';
  return; // Salir de la función porque ya hemos actualizado la visualización
}

// Nueva validación: Mostrar "registroForm" si el temporizador no está activo
if (!idTimer || estadoTimer === null) {
  infoDiagnosticoElement.style.display = 'none';
  registroFormElement.hidden = false;
  return; // Salir de la función porque ya hemos actualizado la visualización
}

if ((diagnosticoIsNull && tallerIsNull) || (diagnosticoEsTiempoAgotado && espacioTallerEsNumero)) {
    // Ambos campos son null, undefined o "N/A", o diagnostico es "Tiempo agotado" y espacio_taller es un número, ocultar "infoDiagnostico" y mostrar "registroForm"
    infoDiagnosticoElement.style.display = 'none';
    registroFormElement.hidden = false;
}  else {
  // Al menos uno de los campos no es null ni "N/A", o diagnostico no es "Tiempo agotado" o espacio_taller no es un número, mostrar "infoDiagnostico"
  const horasRestantes = Math.floor(tiempoRestante / 3600);
  const minutosRestantes = Math.floor((tiempoRestante % 3600) / 60);
  diagnosticoElement.textContent = `${horasRestantes} hora(s) ${minutosRestantes} minuto(s)`;
  console.log(`Tiempo restante final: ${horasRestantes} horas ${minutosRestantes} minutos`);
  //diagnosticoElement.textContent = registroUnidad.diagnostico;
  tallerElement.textContent = registroUnidad.espacio_taller;
  infoDiagnosticoElement.style.display = 'block';
  registroFormElement.style.display = 'none';
}

}

// Llamar a la función de verificación periódica cada 1000 milisegundos (1 segundo)
setInterval(() => {
    tiempoRestante -= 1; // Restar 1 segundo solo si el tiempo restante es mayor que cero
    actualizarInformacionDiagnostico(registrosMasRecientes, estadoTimer);
}, 1000);

  const tablaAnterior = document.getElementById('tablaMovimientos');
  tablaAnterior.parentElement.removeChild(tablaAnterior);

    // Obtén una referencia al contenedor Handsontable
    const container = document.getElementById('tabla2');

    // Define las columnas de la tabla Handsontable
    const columns = [
        { data: '_id', title: '_id', readOnly: true, },
        { data: 'sucursal', title: 'Sucursal', readOnly: false, },
        { data: 'numero_unidad', title: 'Número Unidad', readOnly: true, },
        { data: 'historico', title: 'Historico', readOnly: true, renderer: function (instance, td, row, col, prop, value, cellProperties) {
          td.innerHTML = '<button type="button" class="btn-historico" onclick="mostrarHistorico(' + row + ')">Ver Histórico</button>';
      },
  },
        { data: 'estado', title: 'Ubicacion', readOnly: false, },
        { data: 'cargada', title: 'Estatus', readOnly: false, },
        { data: 'objetivo_traslado', title: 'Destino', readOnly: false, },
        { data: 'fecha', title: 'Fecha', readOnly: true, },
        { data: 'diferenciaHoras', title: 'Ultimo Escaneo', readOnly: true, },
        { data: 'estado_caja', title: 'Estado Caja', readOnly: false, },
        { data: 'diagnostico', title: 'Diagnostico', readOnly: true, },
        { data: 'espacio_taller', title: 'Taller', readOnly: true, },
        { data: 'comentarios_mantenimiento', title: 'Comentarios Mantenimiento', readOnly: false, },
        // ... Otras columnas ...
    ];
    
  // Asegúrate de que la función `mostrarHistorico` esté definida en el ámbito global
window.mostrarHistorico = function (row) {
  // Utiliza toPhysicalRow para obtener el índice físico de la fila en los datos originales
  const physicalRow = hot.toPhysicalRow(row);

  const numeroUnidad = hot.getSourceDataAtRow(physicalRow).numero_unidad;
  // Llama a la función que manejará la apertura de la ventana modal y obtendrá el histórico del servidor
  abrirVentanaModal(numeroUnidad);
};

  // Configura las opciones de Handsontable, incluyendo los filtros
  const hot = new Handsontable(container, {
      data:  Object.values(registrosMasRecientes),
      columns: columns,
      //colHeaders: true, 
      rowHeaders: true,
      manualColumnResize: true,
      //touchUI: true,
      colWidths: [100, 100, 120, 110, 90, 80, 80, 130, 150, 150, 100, 100, 370,],
      filters: true, // Habilita los filtros
      dropdownMenu: true, //['filter_by_condition', 'filter_by_value', 'filter_action_bar'], // Tipo de filtro
      licenseKey: 'non-commercial-and-evaluation',
      hiddenColumns: {
        columns: [0],
      },
      afterChange: function (change, source) {
        if (source === 'edit') {

          const filaActualizada = hot.getDataAtRow(change[0][0]);

          // Crea el objeto de datos con la información necesaria
          const datos = crearObjetoDatos(filaActualizada);
          
          // Llama a la función que utilizará los datos
          usarDatos(datos);

          //editarDatos(filaActualizada);

          numero_fila = change[0][0];
        }
        //console.log(change);
        },
      cells: function (row, col, prop) {
        const cellProperties = {};

        if (col === columns.findIndex(col => col.data === 'diferenciaHoras')) {
            cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
              const horas = Math.floor(value / 60);
              const minutos = value % 60;

              td.innerHTML = `${horas} horas ${minutos} minutos`;
              td.className = getColorClass(value); // Aplicar la clase de estilo
          };
        } else if (col === columns.findIndex(col => col.data === 'fecha')) {
          cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
              const fecha = moment(value).format('YYYY-MM-DDTHH:mm:ss');
              td.innerHTML = fecha;
          };
      } else if (col === columns.findIndex(col => col.data === 'diagnostico')) {
        cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
          const data = instance.getSourceData();
          const datum = data[row];
          //console.log(datum);
          
          if (value === 'Tiempo agotado') {
            // Aplica el estilo de texto en rojo
            td.style.color = 'red';
          } else if (datum.espacio_taller != 'N/A') {
            // Aplica el estilo de texto en verde si hay un número de taller y la cuenta regresiva ha comenzado
            td.style.color = 'green';
          } else {
            // Aplica el estilo de texto en negro en otros casos
            td.style.color = 'black';
          }
    
        // Muestra el valor almacenado en 'diagnóstico'
        td.innerHTML = value;
       
        };
      }
        return cellProperties;
      },
  });

  hot.addHook('afterFilter', function () {
    console.log('Filtros aplicados con éxito');
});


  hot_global = hot;

  function abrirVentanaModal(numeroUnidad) {
    // Hacer una solicitud al servidor para obtener el histórico
    fetch('https://quintaapp.com.mx:3008/historico-unidad/' + numeroUnidad)
        .then(response => response.json())
        .then(historico => {
            // Mostrar el histórico en la ventana modal utilizando SweetAlert2
            Swal.fire({
                title: 'Histórico de la Unidad ' + numeroUnidad,
                html: construirHistoricoHTML(historico),
            });
        })
        .catch(error => {
            console.error('Error al obtener el histórico', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al obtener el histórico. Por favor, inténtalo de nuevo.',
            });
        });
}

function construirHistoricoHTML(historico) {
    // Construir el HTML del histórico según la estructura de tus datos
    // Puedes personalizar esto según el formato de tu histórico
    let html = '<ul>';
    historico.forEach(item => {
        // Utiliza moment para formatear la fecha
        const formattedFecha = moment(item.fecha).format('YYYY-MM-DDTHH:mm:ss');

        html += `<li>${formattedFecha} - ${item.estado} - ${item.sucursal}</li>`;
    });
    html += '</ul>';
    return html;
}

  // get the `Filters` plugin, so you can use its API
const filters = hot.getPlugin('Filters');

document.getElementById('limpiarFiltros').addEventListener('click', function () {
  filters.clearConditions();
  filters.filter();
}); 

function getColorClass(minutos) {
    const horas = minutos / 60;
  
    if (horas > 72) {
      return 'rojo';
    } else if (horas >= 48 && horas <= 72) {
      return 'amarillo';
    } else {
      return 'verde';
    }
  }

}

function crearObjetoDatos(filaActualizada) {
  // Aquí puedes construir el objeto de datos con la información necesaria

  // Obtén los valores de las columnas
  const sucursal = filaActualizada[1];
  const estado = filaActualizada[4];
  const cargada = filaActualizada[5];
  const objetivo_traslado = filaActualizada[6];
  const estado_caja = filaActualizada[9];
  const comentarios_mantenimiento = filaActualizada[12];

  // Define las reglas de validación
  const reglaSucursal = /^(Queretaro|Nuevo Laredo|Mexico|Laredo, Texas)$/;
  const reglaEstado = /^(ENTRA|SALE)$/;
  const reglaCargada = /^(Cargada|Descarga|Dedicada|Vacia)$/;
  const reglaObjetivoTraslado = /^(Importacion|Exportacion|N\/A)$/;
  const reglaEstadoCaja = /^(Bueno|Necesita Mantenimiento)$/;
  //const reglaComentarios = /^(Bueno)$/;

  // Verifica si los valores cumplen con las reglas de validación
  if (
    !reglaSucursal.test(sucursal)||
    !reglaEstado.test(estado) ||
    !reglaCargada.test(cargada) ||
    !reglaObjetivoTraslado.test(objetivo_traslado) ||
    !reglaEstadoCaja.test(estado_caja)
  ) {
    // Al menos uno de los valores no cumple con la regla
    Swal.fire({
      icon: 'error',
      title: 'Error de validación',
      text: 'Por favor, ingrese valores válidos en las columnas.',
    });

    return null; // Devuelve null para indicar que los datos no son válidos
  }

  // Si todos los valores son válidos, crea el objeto de datos
  const datos = {
    _id: filaActualizada[0],
    sucursal: sucursal,
    fecha: filaActualizada[7], // Ajusta el índice según la posición de la columna "fecha" en tus datos
    //diferenciaHoras: minutosDiferencia,
    estado: estado,
    cargada: cargada,
    objetivo_traslado: objetivo_traslado,
    estado_caja: estado_caja,
    comentarios_mantenimiento: comentarios_mantenimiento,
  };

  return datos;
}

function usarDatos(datos) {
  // Puedes utilizar los datos como desees en esta función
  console.log("Datos a utilizar:", datos);
  // Realiza operaciones adicionales con los datos aquí
}

function transformarValorCargada(valor) {
  if (valor === "Cargada") {
      return 1;
  } else if (valor === "Descarga") {
      return 2;
  } else if (valor === "Dedicada") {
      return 3;
  } else {
      // Valor no válido, maneja el caso en consecuencia
      return 0;
  }
}

document.getElementById('editar').addEventListener('click', function() {
  console.log('Guardando datos');
  // Obtén los datos de la fila que se editó
  const filaActualizada = hot_global.getDataAtRow(numero_fila);

  // Crea un objeto de datos con la información necesaria
  const datos = crearObjetoDatos(filaActualizada);

if (datos) {
  // Muestra una ventana de confirmación antes de editar
  Swal.fire({
    title: 'Confirmacion',
    text: '¿Estás seguro de editar el registro?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, editar',
    cancelButtonText: 'Cancelar'
}).then((result) => {
    if (result.isConfirmed) {
        // Realiza la transformación de la columna "cargada" a un valor no numérico
        datos.cargada = transformarValorCargada(datos.cargada);

        // Actualiza la columna "fecha" con la nueva fecha
        datos.fecha = moment().format(); // Actualiza la fecha al momento actual

        // Realiza la solicitud POST al servidor
        fetch('https://quintaapp.com.mx:3008/cajas/modificar-registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos), // Convierte los datos a JSON
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Error al guardar los datos');
            }
        })
        .then(data => {
          console.log('Registro guardado exitosamente:', data);
          
          // Muestra una ventana de éxito
          Swal.fire({
              title: 'Editado',
              text: 'El registro ha sido editado correctamente.',
              icon: 'success'
          }).then(() => {
              // Recarga la página después de cerrar la ventana de éxito
              window.location.reload();
          });
      })
      .catch(error => {
          console.error('Error al guardar los datos:', error);
      });
  }
});

} else {
  // Muestra una ventana de error si no se ha realizado ninguna edición
  Swal.fire({
      icon: 'error',
      title: 'Sin cambios',
      text: 'No se ha editado ningun registro',
  });
}
});

document.addEventListener('DOMContentLoaded', function () {

    // Llamar a obtenerMovimientosCajas al cargar la página
    obtenerMovimientosCajas();

    // Obtener el input de comentarios y el radio button 'Necesita Mantenimiento'
    const comentariosDiv = document.getElementById('comentariosDiv');
    const estadoCajaRadioButton = document.querySelector('input[name="estadoCaja2"][value="Necesita Mantenimiento"]');

    // Escuchar el evento de cambio en el radio button 'Necesita Mantenimiento'
    estadoCajaRadioButton.addEventListener('change', function () {
        if (this.checked) {
            comentariosDiv.style.display = 'block'; // Mostrar el input de comentarios
        } else {
            comentariosDiv.style.display = 'none'; // Ocultar el input de comentarios
        }
    });

    const diagnosticoDiv = document.getElementById('diagnosticoDiv');
    estadoCajaRadioButton.addEventListener('change', function () {
      if (this.checked) {
          diagnosticoDiv.style.display = 'block'; // Mostrar select
      } else {
          diagnosticoDiv.style.display = 'none'; 
      }
    });

    const tallerDiv = document.getElementById('tallerDiv');
    estadoCajaRadioButton.addEventListener('change', function () {
      if (this.checked) {
          tallerDiv.style.display = 'block'; // Mostrar select
      } else {
          tallerDiv.style.display = 'none'; 
      }
  });

     // Obtener el select y los radio buttons
     const sucursalSelect = document.getElementById('sucursalSelect');
     const radioButtonsContainer = document.getElementById('radio-buttons3');
 
     // Agregar un controlador de eventos al select
     sucursalSelect.addEventListener('change', function () {
         const selectedOption = sucursalSelect.options[sucursalSelect.selectedIndex].value;
         console.log('Selected Option: ', selectedOption);
 
         // Verificar si se seleccionó 'Nuevo Laredo' y mostrar/ocultar los radio buttons
         if (selectedOption === 'Nuevo Laredo') {
            radioButtonsContainer.classList.remove('ocultar-radio-buttons'); // Muestra los radio buttons
          } else {
              radioButtonsContainer.classList.add('ocultar-radio-buttons'); // Oculta los radio buttons
          }
     });

    document.getElementById('btnEntra').addEventListener('click', function() {
      const parametrosURL = obtenerParametrosURL();

      // Validar si el ID y el número de unidad son nulos
      if (parametrosURL.id === null || parametrosURL.numero_unidad === null) {
        Swal.fire({
            title: 'Error',
            text: 'El ID o el número de unidad no están disponibles. No se puede realizar el registro.',
            icon: 'error',
        });
        return; // Salir de la función
    }

      const select = document.querySelector('select');
      const sucursal = select.value;
      const estadoCaja = document.querySelector('input[name="estadoCaja"]:checked').value; // Obtener el valor del botón de radio seleccionado
      const fecha = moment().format();
  
      // Obtener la fecha de registro de la unidad
      const fechaRegistro = new Date(parametrosURL.fechaRegistro); // Debes agregar 'fechaRegistro' a tus parámetros URL
    
      // Calcular la diferencia en horas entre la fecha actual y la fecha de registro
      const diferenciaHoras = Math.abs((new Date() - fechaRegistro) / 36e5);
    
      // Determinar si la unidad ha sido escaneada o no
      const escaneado = diferenciaHoras <= 72 ? '1' : '0';
  
      const estadoCaja2 = document.querySelector('input[name="estadoCaja2"]:checked').value;

      // Resto del código para obtener datos y enviarlos
      const comentarios = comentariosDiv.style.display === 'block' ? document.getElementById('comentarios').value : ''; // Obtener los comentarios si se muestran

      // Concatenar los comentarios al valor de 'Estado_Caja' si hay comentarios
      const estadoCajaFinal = estadoCaja2 === 'Necesita Mantenimiento' && comentarios ? `Comentarios: ${comentarios}` : estadoCaja2;

      const estadoCaja3 = document.querySelector('input[name="estadoCaja3"]:checked').value;

      const diagnostico = parseInt(document.getElementById('diagnostico').value); // Obtén el valor numérico
  
      let tallerSeleccionado = document.getElementById("select-taller").value;
      if (tallerSeleccionado !== "N/A") {
        iniciarTimerTaller(parametrosURL.numero_unidad, tallerSeleccionado, 'entra');
        return;
      }
      
      const datos = {
          estado: 'ENTRA',
          id_unidad: parametrosURL.id,
          numero_unidad: parametrosURL.numero_unidad,
          sucursal: sucursal,
          fecha: fecha,
          cargada: estadoCaja,
          no_escaneado: escaneado,
          estado_caja: estadoCaja2,
          comentarios_mantenimiento: estadoCajaFinal,
          objetivo_traslado: estadoCaja3,
          diagnostico: diagnostico,
          espacio_taller: tallerSeleccionado,
      };
      enviarDatos('https://quintaapp.com.mx:3008/cajas/guardar-estado', datos, 'entra');
      
  });

  function iniciarTimerTaller(numero_unidad, espacio_taller, tipoRegistro) {

    const mensajeConfirmacion = tipoRegistro === 'entra'
        ? '¿Estás seguro de que deseas registrar esta unidad como ENTRA?'
        : '¿Estás seguro de que deseas registrar esta unidad como SALE?';

    Swal.fire({
        title: 'Confirmación',
        text: mensajeConfirmacion,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: `Sí, registrar como ${tipoRegistro.toUpperCase()}`,
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            // Obtener el valor del diagnóstico desde el input
            const diagnosticoInput = document.getElementById('diagnostico');
            const diagnostico = diagnosticoInput ? parseInt(diagnosticoInput.value) : null;
            // Obtener el ID del número de unidad
            const urlParams = new URLSearchParams(window.location.search);
            const id_unidad = urlParams.get('id');

            // Obtener el valor de estadoCaja2 y estadoCajaFinal
            const estadoCaja2 = document.querySelector('input[name="estadoCaja2"]:checked').value;
            const comentariosDiv = document.getElementById('comentariosDiv');
            const comentarios = comentariosDiv.style.display === 'block' ? document.getElementById('comentarios').value : '';
            const estadoCajaFinal = estadoCaja2 === 'Necesita Mantenimiento' && comentarios ? `Comentarios: ${comentarios}` : estadoCaja2;

            let url = 'https://quintaapp.com.mx:3008/cajas/modificar-taller';
            // Crear un objeto de datos que se enviará en la solicitud POST
            let data = {
                "id_caja": id_unidad, // Agregar el ID de la unidad al objeto de datos
                "numero_unidad": numero_unidad,
                "espacio_taller": espacio_taller,
                "fecha_envio_taller": moment().format('YYYY-MM-DDTHH:mm:ss'),
                "diagnostico": diagnostico, // Agregar el diagnóstico al objeto de datos
                "estado_caja": estadoCaja2, // Agregar estadoCaja2 al objeto de datos
                "comentarios_mantenimiento": estadoCajaFinal, // Agregar estadoCajaFinal al objeto de datos
            };  

            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            }).then(response => {
                if (response.ok) {
                    // La solicitud se realizó con éxito
                    Swal.fire('Registrado', `La unidad ha sido registrada como ${tipoRegistro.toUpperCase()}`, 'success')
                    .then(() => {
                        window.location.reload();
                    });
                } else {
                    // La solicitud falló
                    console.error('Error al modificar el taller');
                }
            }).catch(error => {
                console.error('Error en la solicitud: ' + error);
            });
        }
    });

  }
    
  document.getElementById('btnSale').addEventListener('click', function() {
      const parametrosURL = obtenerParametrosURL();

      // Validar si el ID y el número de unidad son nulos
      if (parametrosURL.id === null || parametrosURL.numero_unidad === null) {
        Swal.fire({
            title: 'Error',
            text: 'El ID o el número de unidad no están disponibles. No se puede realizar el registro.',
            icon: 'error',
        });
        return; // Salir de la función
    }

      const select = document.querySelector('select');
      const sucursal = select.value;
      const estadoCaja = document.querySelector('input[name="estadoCaja"]:checked').value; // Obtener el valor del botón de radio seleccionado
      const fecha = moment().format();
  
      // Obtener la fecha de registro de la unidad
      const fechaRegistro = new Date(parametrosURL.fechaRegistro); // Debes agregar 'fechaRegistro' a tus parámetros URL
      
      // Calcular la diferencia en horas entre la fecha actual y la fecha de registro
      const diferenciaHoras = Math.abs((new Date() - fechaRegistro) / 36e5);
      
      // Determinar si la unidad ha sido escaneada o no
      const escaneado = diferenciaHoras <= 72 ? '1' : '0';
  
      const estadoCaja2 = document.querySelector('input[name="estadoCaja2"]:checked').value;

      // Resto del código para obtener datos y enviarlos
      const comentarios = comentariosDiv.style.display === 'block' ? document.getElementById('comentarios').value : ''; // Obtener los comentarios si se muestran

      // Concatenar los comentarios al valor de 'Estado_Caja' si hay comentarios
      const estadoCajaFinal = estadoCaja2 === 'Necesita Mantenimiento' && comentarios ? `Comentarios: ${comentarios}` : estadoCaja2;

      const estadoCaja3 = document.querySelector('input[name="estadoCaja3"]:checked').value;
  
      const datos = {
          estado: 'SALE',
          id_unidad: parametrosURL.id,
          numero_unidad: parametrosURL.numero_unidad,
          sucursal: sucursal,
          fecha: fecha,
          cargada: estadoCaja,
          no_escaneado: escaneado,
          estado_caja: estadoCaja2,
          comentarios_mantenimiento: estadoCajaFinal,
          objetivo_traslado: estadoCaja3,
      };
      //console.log(datos);
      enviarDatos('https://quintaapp.com.mx:3008/cajas/guardar-estado', datos, 'sale');
  });

  });
