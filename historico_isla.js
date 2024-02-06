document.addEventListener("DOMContentLoaded", function() {

    let hot_global;
    
      // Obtener el valor del parámetro "id" de la URL
      function obtenerTallerDesdeURL() {
          const parametrosURL = new URLSearchParams(window.location.search);
          const espacio_taller = parametrosURL.get('espacio_taller');
          const numero_unidad = parametrosURL.get('numero_unidad');
          //const no_unidad = document.getElementById('no_unidad');
          //no_unidad.innerHTML = numero_unidad;
          return { espacio_taller, numero_unidad };
      }
  
      console.log(obtenerTallerDesdeURL());
  
      // Utilizar la función para obtener el valor de idUnidad
      /*const noTaller = obtenerTallerDesdeURL();
      const taller = noTaller.espacio_taller;
  
      console.log('No. Taller:', taller);*/

        // Obtener el elemento select
        const selectIsla = document.getElementById("select_isla");
        
        // Agregar event listener para detectar cambios en la selección
        selectIsla.addEventListener("change", function() {
        const numeroIsla = selectIsla.value; // Obtener el valor seleccionado

        // Llamar a la función para obtener y cargar los datos del taller seleccionado
        obtenerHisotricoPorIsla(numeroIsla);
        });
  
      //Solcitiud GET para obtener los datos y llenar la tabla Handsontable
      function obtenerHisotricoPorIsla(numeroIsla) {
          fetch('https://quintaapp.com.mx:3008/hisotrico-timer-x-taller/' + numeroIsla)
            .then(response => {
              if (!response.ok) {
                throw new Error('Error en la solicitud');
              }
              return response.json();
            })
            .then(data => {
              // Procesar los datos de historico taller
              console.log('Datos historico taller:', data);
  
              hot.loadData(data);
              
            })
            .catch(error => {
              console.error('Error:', error);
            });
      }
  
      // Obtener el elemento HTML donde se inicializará la tabla
      const container = document.getElementById("tabla_isla");
  
      // Configuración de las columnas
      const columns = [
          { data: 'numero_caja', title: 'Numero Unidad' },
          { data: 'fecha_finalizado', title: 'Fecha de Finalizacion' },
          { data: 'horas_diagnostico', title: 'Tiempo Estimado' },
          { data: 'cumplimiento', title: 'Logrado' },
          { data: 'horas_sobra_adicionales', title: 'Tiempo Sobrante' },
          //{ data: 'pausas', title: 'Pausas' },
          { data: 'total_min_pausado', title: 'Tiempo de pausa' },
          //{ data: 'motivo', title: 'Motivo' },
          // Agrega más columnas según sea necesario
      ];
  
      // Configuración de Handsontable
      const hot = new Handsontable(container, {
          data: [], // Sin datos inicialmente
          columns: columns,
          //colHeaders: true, // Mostrar encabezados de columna
          rowHeaders: true, // Mostrar encabezados de fila
          stretchH: 'all', // Estirar las columnas para ajustarse al ancho del contenedor
          //colWidths: [100, 100, 130, 100, 140, 80, 140, 130],
          //height: 300, // Altura de la tabla
          filters: true, // Habilita los filtros
          dropdownMenu: ['filter_by_condition', 'filter_by_value', 'filter_action_bar'], // Tipo de filtro
          licenseKey: 'non-commercial-and-evaluation',
          // Puedes agregar más opciones según tus necesidades
  
          cells: function (row, col, prop) {
            const cellProperties = {};
  
            if (col === columns.findIndex(col => col.data === 'cumplimiento')) {
              cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
  
                if (value === 'true') {
                  td.style.color = 'green';//Si es true, texto verde
                  td.innerHTML = 'Si se cumplio';
                } else if (value === 'false') {
                  td.style.color = 'red';//Si es false, texto rojo
                  td.innerHTML = 'No se cumplio';
                }
              };
            } else if (col === columns.findIndex(col => col.data === 'horas_sobra_adicionales')) {
              cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
                const horas = Math.floor(value);// Obtener la parte entera de las horas
                //const minutos = Math.round((value % 1) * 60); // Obtener los minutos
  
                td.innerHTML = `${horas} hora(s)`;
                //td.className = getColorClass(value); // Aplicar la clase de estilo
              };
            } else if (col === columns.findIndex(col => col.data === 'total_min_pausado')) {
                cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
                  const horas = Math.floor(value / 60);
                  const minutos = Math.floor(value % 60);
  
                  td.innerHTML = `${horas} hora(s) ${minutos} minuto(s)`;
                  //td.className = getColorClass(value); // Aplicar la clase de estilo
              };
            }
  
            return cellProperties;
          },
  
          
      
      
    });
  
    hot_global = hot;
  
    // Llamar a la función para obtener y cargar los datos
    obtenerHisotricoPorIsla();
  
  });