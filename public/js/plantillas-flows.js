// Plantillas adicionales de flujos
const flowTemplates = {

    menuPrincipal: {
        name: 'MENU_PRINCIPAL',
        description: 'Menú principal para el bot',
        steps: ['INITIAL', 'AWAITING_CHOICE'],
        options: [
            { number: 1, emoji: '1️⃣', text: 'Servicios', action: 'goToFlow', actionValue: 'MENU_SERVICIOS', step: 'INITIAL' },
            { number: 2, emoji: '2️⃣', text: 'Consultar Estado', action: 'goToFlow', actionValue: 'CONSULTA_ESTADO', step: 'INITIAL' },
            { number: 3, emoji: '3️⃣', text: 'Hablar con Asesor', action: 'sendMessage', actionValue: 'CONTACTAR_ASESOR', step: 'INITIAL' },
            { number: 4, emoji: '4️⃣', text: 'Acerca de Nosotros', action: 'sendMessage', actionValue: 'ACERCA_DE', step: 'INITIAL' }
        ],
        messages: {
            welcome: '¡Hola! 👋 Bienvenido al asistente virtual. ¿En qué puedo ayudarte hoy?',
            CONTACTAR_ASESOR: 'En breve un asesor se comunicará contigo. Por favor, describe tu consulta.',
            ACERCA_DE: 'Somos una empresa dedicada a brindar soluciones eficientes para tu negocio.'
        }
    },
    servicios: {
        name: 'MENU_SERVICIOS',
        description: 'Catálogo de servicios disponibles',
        steps: ['INITIAL', 'AWAITING_CHOICE', 'DETAIL_VIEW'],
        options: [
            { number: 1, emoji: '1️⃣', text: 'Servicio 1', action: 'goToStep', actionValue: 'DETAIL_VIEW', step: 'INITIAL' },
            { number: 2, emoji: '2️⃣', text: 'Servicio 2', action: 'goToStep', actionValue: 'DETAIL_VIEW', step: 'INITIAL' },
            { number: 3, emoji: '3️⃣', text: 'Servicio 3', action: 'goToStep', actionValue: 'DETAIL_VIEW', step: 'INITIAL' },
            { number: 4, emoji: '⬅️', text: 'Regresar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones específicas para el paso DETAIL_VIEW
            { number: 1, emoji: '📝', text: 'Más información', action: 'sendMessage', actionValue: 'INFO_DETALLADA', step: 'DETAIL_VIEW' },
            { number: 2, emoji: '💰', text: 'Ver precios', action: 'sendMessage', actionValue: 'PRECIOS', step: 'DETAIL_VIEW' },
            { number: 3, emoji: '⬅️', text: 'Volver a servicios', action: 'goToStep', actionValue: 'INITIAL', step: 'DETAIL_VIEW' }
        ],
        messages: {
            welcome: '📋 *Nuestros Servicios*\n\nSelecciona una opción para más detalles:',
            DETAIL_VIEW: 'Aquí encontrarás información detallada sobre el servicio seleccionado.',
            INFO_DETALLADA: 'Este servicio incluye características premium como soporte 24/7, actualizaciones automáticas y respaldos semanales.',
            PRECIOS: 'El precio base de este servicio es $XXX mensual. Contamos con diferentes planes según tus necesidades.'
        }
    },
    citas: {
        name: 'AGENDA_CITAS',
        description: 'Sistema de agendado de citas',
        steps: ['INITIAL', 'SELECT_DATE', 'SELECT_TIME', 'CONFIRM_APPOINTMENT'],
        options: [
            // Opciones para el paso INITIAL
            { number: 1, emoji: '📅', text: 'Agendar cita', action: 'goToStep', actionValue: 'SELECT_DATE', step: 'INITIAL' },
            { number: 2, emoji: '🔍', text: 'Ver mis citas', action: 'sendMessage', actionValue: 'MIS_CITAS', step: 'INITIAL' },
            { number: 3, emoji: '⬅️', text: 'Regresar al menú', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para el paso SELECT_DATE
            { number: 1, emoji: '📆', text: 'Hoy', action: 'goToStep', actionValue: 'SELECT_TIME', step: 'SELECT_DATE' },
            { number: 2, emoji: '📆', text: 'Mañana', action: 'goToStep', actionValue: 'SELECT_TIME', step: 'SELECT_DATE' },
            { number: 3, emoji: '📆', text: 'Esta semana', action: 'goToStep', actionValue: 'SELECT_TIME', step: 'SELECT_DATE' },
            { number: 4, emoji: '⬅️', text: 'Cancelar', action: 'goToStep', actionValue: 'INITIAL', step: 'SELECT_DATE' },

            // Opciones para el paso SELECT_TIME
            { number: 1, emoji: '⏰', text: 'Mañana (9-12)', action: 'goToStep', actionValue: 'CONFIRM_APPOINTMENT', step: 'SELECT_TIME' },
            { number: 2, emoji: '⏰', text: 'Tarde (2-5)', action: 'goToStep', actionValue: 'CONFIRM_APPOINTMENT', step: 'SELECT_TIME' },
            { number: 3, emoji: '⏰', text: 'Noche (6-8)', action: 'goToStep', actionValue: 'CONFIRM_APPOINTMENT', step: 'SELECT_TIME' },
            { number: 4, emoji: '⬅️', text: 'Cambiar fecha', action: 'goToStep', actionValue: 'SELECT_DATE', step: 'SELECT_TIME' },

            // Opciones para el paso CONFIRM_APPOINTMENT
            { number: 1, emoji: '✅', text: 'Confirmar Cita', action: 'sendMessage', actionValue: 'CITA_CONFIRMADA', step: 'CONFIRM_APPOINTMENT' },
            { number: 2, emoji: '🗓️', text: 'Cambiar Fecha', action: 'goToStep', actionValue: 'SELECT_DATE', step: 'CONFIRM_APPOINTMENT' },
            { number: 3, emoji: '⏰', text: 'Cambiar Hora', action: 'goToStep', actionValue: 'SELECT_TIME', step: 'CONFIRM_APPOINTMENT' },
            { number: 4, emoji: '❌', text: 'Cancelar', action: 'goToStep', actionValue: 'INITIAL', step: 'CONFIRM_APPOINTMENT' }
        ],
        messages: {
            welcome: '📅 *Agenda de Citas*\n\n¿Qué deseas hacer hoy?',
            SELECT_DATE: 'Por favor selecciona una fecha disponible:',
            SELECT_TIME: 'Has seleccionado: ${date}. Ahora elige una hora:',
            CONFIRM_APPOINTMENT: 'Has seleccionado: ${date} a las ${time}.\n\n¿Deseas confirmar esta cita?',
            CITA_CONFIRMADA: '✅ ¡Tu cita ha sido confirmada!\n\nFecha: ${date}\nHora: ${time}\n\nRecuerda llegar 10 minutos antes.',
            MIS_CITAS: 'Actualmente no tienes citas programadas.'
        }
    },
    consultas: {
        name: 'CONSULTA_ESTADO',
        description: 'Consulta de estado de servicios o pedidos',
        steps: ['INITIAL', 'ENTER_ID', 'SHOW_STATUS'],
        options: [
            // Opciones para el paso INITIAL
            { number: 1, emoji: '🔍', text: 'Consultar estado', action: 'goToStep', actionValue: 'ENTER_ID', step: 'INITIAL' },
            { number: 2, emoji: '📦', text: 'Mis pedidos recientes', action: 'sendMessage', actionValue: 'PEDIDOS_RECIENTES', step: 'INITIAL' },
            { number: 3, emoji: '⬅️', text: 'Regresar al Menú', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para el paso SHOW_STATUS (después de mostrar el estado)
            { number: 1, emoji: '🔄', text: 'Nueva Consulta', action: 'goToStep', actionValue: 'ENTER_ID', step: 'SHOW_STATUS' },
            { number: 2, emoji: '📞', text: 'Contactar Soporte', action: 'sendMessage', actionValue: 'CONTACTAR_SOPORTE', step: 'SHOW_STATUS' },
            { number: 3, emoji: '⬅️', text: 'Regresar al Menú', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'SHOW_STATUS' }
        ],
        messages: {
            welcome: '🔍 *Consulta de Estado*\n\n¿Qué deseas hacer?',
            ENTER_ID: 'Por favor, envía el número de folio o ID de tu servicio:',
            searching: '⏳ Buscando información del folio ${id}...',
            SHOW_STATUS: '📋 *Resultado de la consulta:*\n\nFolio: ${id}\nEstatus: ${status}\nÚltima actualización: ${date}',
            notFound: '❌ No se encontró información para el folio ${id}. Verifica que el número sea correcto.',
            CONTACTAR_SOPORTE: 'Un agente de soporte se comunicará contigo en breve para ayudarte con tu consulta.',
            PEDIDOS_RECIENTES: 'No se encontraron pedidos recientes asociados a tu cuenta.'
        }
    },
    productoCatalogo: {
        name: 'CATALOGO_PRODUCTOS',
        description: 'Catálogo interactivo de productos por categorías',
        steps: ['INITIAL', 'CATEGORIAS', 'PRODUCTOS', 'DETALLE_PRODUCTO', 'AGREGAR_CARRITO'],
        options: [
            // Opciones para el paso INITIAL (Categorías principales)
            { number: 1, emoji: '👕', text: 'Ropa', action: 'goToStep', actionValue: 'PRODUCTOS', step: 'INITIAL' },
            { number: 2, emoji: '👟', text: 'Calzado', action: 'goToStep', actionValue: 'PRODUCTOS', step: 'INITIAL' },
            { number: 3, emoji: '🎮', text: 'Electrónicos', action: 'goToStep', actionValue: 'PRODUCTOS', step: 'INITIAL' },
            { number: 4, emoji: '🏠', text: 'Hogar', action: 'goToStep', actionValue: 'PRODUCTOS', step: 'INITIAL' },
            { number: 5, emoji: '🛒', text: 'Ver Carrito', action: 'goToFlow', actionValue: 'CARRITO_COMPRAS', step: 'INITIAL' },
            { number: 6, emoji: '⬅️', text: 'Regresar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para el paso PRODUCTOS (Lista de productos de una categoría)
            { number: 1, emoji: '📦', text: 'Producto 1', action: 'goToStep', actionValue: 'DETALLE_PRODUCTO', step: 'PRODUCTOS' },
            { number: 2, emoji: '📦', text: 'Producto 2', action: 'goToStep', actionValue: 'DETALLE_PRODUCTO', step: 'PRODUCTOS' },
            { number: 3, emoji: '📦', text: 'Producto 3', action: 'goToStep', actionValue: 'DETALLE_PRODUCTO', step: 'PRODUCTOS' },
            { number: 4, emoji: '🔍', text: 'Buscar', action: 'sendMessage', actionValue: 'BUSCAR_PRODUCTO', step: 'PRODUCTOS' },
            { number: 5, emoji: '⬅️', text: 'Volver a categorías', action: 'goToStep', actionValue: 'INITIAL', step: 'PRODUCTOS' },

            // Opciones para el paso DETALLE_PRODUCTO
            { number: 1, emoji: '🛒', text: 'Añadir al carrito', action: 'goToStep', actionValue: 'AGREGAR_CARRITO', step: 'DETALLE_PRODUCTO' },
            { number: 2, emoji: '💬', text: 'Ver opiniones', action: 'sendMessage', actionValue: 'VER_OPINIONES', step: 'DETALLE_PRODUCTO' },
            { number: 3, emoji: '📝', text: 'Especificaciones', action: 'sendMessage', actionValue: 'ESPECIFICACIONES', step: 'DETALLE_PRODUCTO' },
            { number: 4, emoji: '⬅️', text: 'Volver a productos', action: 'goToStep', actionValue: 'PRODUCTOS', step: 'DETALLE_PRODUCTO' },

            // Opciones para el paso AGREGAR_CARRITO
            { number: 1, emoji: '✅', text: 'Confirmar', action: 'sendMessage', actionValue: 'PRODUCTO_AGREGADO', step: 'AGREGAR_CARRITO' },
            { number: 2, emoji: '🛒', text: 'Ver carrito', action: 'goToFlow', actionValue: 'CARRITO_COMPRAS', step: 'AGREGAR_CARRITO' },
            { number: 3, emoji: '🛍️', text: 'Seguir comprando', action: 'goToStep', actionValue: 'INITIAL', step: 'AGREGAR_CARRITO' }
        ],
        messages: {
            welcome: '🛍️ *Catálogo de Productos*\n\nExplora nuestras categorías:',
            PRODUCTOS: '📦 *Productos en ${categoria}*\n\nSelecciona un producto para ver detalles:',
            DETALLE_PRODUCTO: '📝 *${nombre}*\n\nPrecio: $${precio}\nDescripción: ${descripcion}\n\n¿Deseas agregar este producto al carrito?',
            AGREGAR_CARRITO: '🛒 Selecciona la cantidad y confirma para agregar al carrito:',
            PRODUCTO_AGREGADO: '✅ ¡Producto agregado al carrito exitosamente!',
            VER_OPINIONES: '💬 *Opiniones de los clientes*\n\nCalificación promedio: ⭐⭐⭐⭐⭐ (4.8/5)\n\n👤 Usuario1: "Excelente producto, muy recomendado"\n👤 Usuario2: "Buena calidad y entrega rápida"',
            ESPECIFICACIONES: '📋 *Especificaciones técnicas*\n\n- Material: Premium\n- Dimensiones: 10x15x5 cm\n- Peso: 250g\n- Garantía: 1 año',
            BUSCAR_PRODUCTO: '🔍 Por favor, escribe el nombre o características del producto que buscas:',
            error: '❌ Lo sentimos, ocurrió un error. Inténtalo de nuevo.'
        }
    },

    carritoCompras: {
        name: 'CARRITO_COMPRAS',
        description: 'Gestión del carrito de compras',
        steps: ['INITIAL', 'VER_CARRITO', 'MODIFICAR_CANTIDAD', 'CONFIRMAR_COMPRA', 'PROCESAR_PAGO'],
        options: [
            // Opciones para el paso INITIAL
            { number: 1, emoji: '👀', text: 'Ver mi carrito', action: 'goToStep', actionValue: 'VER_CARRITO', step: 'INITIAL' },
            { number: 2, emoji: '🛍️', text: 'Seguir comprando', action: 'goToFlow', actionValue: 'CATALOGO_PRODUCTOS', step: 'INITIAL' },
            { number: 3, emoji: '⬅️', text: 'Regresar al menú', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para el paso VER_CARRITO
            { number: 1, emoji: '✏️', text: 'Modificar Cantidades', action: 'goToStep', actionValue: 'MODIFICAR_CANTIDAD', step: 'VER_CARRITO' },
            { number: 2, emoji: '🗑️', text: 'Vaciar Carrito', action: 'sendMessage', actionValue: 'VACIAR_CARRITO', step: 'VER_CARRITO' },
            { number: 3, emoji: '💳', text: 'Proceder al Pago', action: 'goToStep', actionValue: 'CONFIRMAR_COMPRA', step: 'VER_CARRITO' },
            { number: 4, emoji: '🛍️', text: 'Seguir Comprando', action: 'goToFlow', actionValue: 'CATALOGO_PRODUCTOS', step: 'VER_CARRITO' },

            // Opciones para el paso MODIFICAR_CANTIDAD
            { number: 1, emoji: '📦', text: 'Producto 1', action: 'sendMessage', actionValue: 'EDITAR_PRODUCTO_1', step: 'MODIFICAR_CANTIDAD' },
            { number: 2, emoji: '📦', text: 'Producto 2', action: 'sendMessage', actionValue: 'EDITAR_PRODUCTO_2', step: 'MODIFICAR_CANTIDAD' },
            { number: 3, emoji: '⬅️', text: 'Volver al carrito', action: 'goToStep', actionValue: 'VER_CARRITO', step: 'MODIFICAR_CANTIDAD' },

            // Opciones para el paso CONFIRMAR_COMPRA
            { number: 1, emoji: '✅', text: 'Confirmar compra', action: 'goToStep', actionValue: 'PROCESAR_PAGO', step: 'CONFIRMAR_COMPRA' },
            { number: 2, emoji: '🛒', text: 'Volver al carrito', action: 'goToStep', actionValue: 'VER_CARRITO', step: 'CONFIRMAR_COMPRA' },
            { number: 3, emoji: '❌', text: 'Cancelar', action: 'goToStep', actionValue: 'INITIAL', step: 'CONFIRMAR_COMPRA' },

            // Opciones para el paso PROCESAR_PAGO
            { number: 1, emoji: '💳', text: 'Tarjeta de crédito', action: 'sendMessage', actionValue: 'PAGO_TARJETA', step: 'PROCESAR_PAGO' },
            { number: 2, emoji: '🏦', text: 'Transferencia', action: 'sendMessage', actionValue: 'PAGO_TRANSFERENCIA', step: 'PROCESAR_PAGO' },
            { number: 3, emoji: '💰', text: 'Efectivo', action: 'sendMessage', actionValue: 'PAGO_EFECTIVO', step: 'PROCESAR_PAGO' },
            { number: 4, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'CONFIRMAR_COMPRA', step: 'PROCESAR_PAGO' }
        ],
        messages: {
            welcome: '🛒 *Tu Carrito de Compras*\n\n¿Qué deseas hacer?',
            VER_CARRITO: '🛒 *Contenido de tu Carrito*\n\n${items}\n\nTotal: $${total}',
            empty: '🛒 Tu carrito está vacío. ¡Agrega productos para comenzar!',
            MODIFICAR_CANTIDAD: '✏️ *Modificar Cantidades*\n\nSelecciona el producto que deseas modificar:',
            EDITAR_PRODUCTO_1: 'Indica la nueva cantidad para Producto 1:',
            EDITAR_PRODUCTO_2: 'Indica la nueva cantidad para Producto 2:',
            VACIAR_CARRITO: '🗑️ Has vaciado tu carrito de compras.',
            CONFIRMAR_COMPRA: '✅ *Confirma tu compra*\n\nTotal a pagar: $${total}\nProductos: ${cantidad}\n\n¿Deseas continuar con el pago?',
            PROCESAR_PAGO: '💳 *Selecciona un método de pago:*',
            PAGO_TARJETA: '💳 Has seleccionado pago con tarjeta. Por favor, completa tu compra a través del siguiente enlace de pago seguro: [Link de pago]',
            PAGO_TRANSFERENCIA: '🏦 Has seleccionado pago por transferencia. Estos son nuestros datos bancarios:\n\nBanco: XXXX\nCuenta: XXXX\nClabe: XXXX\n\nEnvía tu comprobante a nuestro correo.',
            PAGO_EFECTIVO: '💰 Has seleccionado pago en efectivo. Puedes pagar en cualquiera de nuestras sucursales o puntos de pago.',
            pagoExitoso: '✅ ¡Pago procesado exitosamente!\n\nTu número de pedido es: #${orderNumber}\nRecibirás un correo con los detalles de tu compra.'
        }
    },

    atencionCliente: {
        name: 'ATENCION_CLIENTE',
        description: 'Sistema de atención al cliente y FAQs',
        steps: ['INITIAL', 'CATEGORIAS_FAQ', 'PREGUNTAS', 'RESPUESTA', 'SATISFACCION'],
        options: [
            // Opciones para el paso INITIAL
            { number: 1, emoji: '❓', text: 'Preguntas frecuentes', action: 'goToStep', actionValue: 'CATEGORIAS_FAQ', step: 'INITIAL' },
            { number: 2, emoji: '👨‍💼', text: 'Hablar con asesor', action: 'sendMessage', actionValue: 'CONECTAR_ASESOR', step: 'INITIAL' },
            { number: 3, emoji: '📝', text: 'Enviar comentario', action: 'sendMessage', actionValue: 'ENVIAR_COMENTARIO', step: 'INITIAL' },
            { number: 4, emoji: '⬅️', text: 'Regresar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para el paso CATEGORIAS_FAQ
            { number: 1, emoji: '📦', text: 'Pedidos y Entregas', action: 'goToStep', actionValue: 'PREGUNTAS', step: 'CATEGORIAS_FAQ' },
            { number: 2, emoji: '💰', text: 'Pagos y Facturación', action: 'goToStep', actionValue: 'PREGUNTAS', step: 'CATEGORIAS_FAQ' },
            { number: 3, emoji: '🔄', text: 'Devoluciones', action: 'goToStep', actionValue: 'PREGUNTAS', step: 'CATEGORIAS_FAQ' },
            { number: 4, emoji: '🎁', text: 'Promociones', action: 'goToStep', actionValue: 'PREGUNTAS', step: 'CATEGORIAS_FAQ' },
            { number: 5, emoji: '⬅️', text: 'Regresar', action: 'goToStep', actionValue: 'INITIAL', step: 'CATEGORIAS_FAQ' },

            // Opciones para el paso PREGUNTAS (estas variarán según la categoría)
            { number: 1, emoji: '❓', text: '¿Cuánto tarda mi pedido?', action: 'goToStep', actionValue: 'RESPUESTA', step: 'PREGUNTAS' },
            { number: 2, emoji: '❓', text: '¿Cómo rastreo mi envío?', action: 'goToStep', actionValue: 'RESPUESTA', step: 'PREGUNTAS' },
            { number: 3, emoji: '❓', text: '¿Cuál es la política de envío?', action: 'goToStep', actionValue: 'RESPUESTA', step: 'PREGUNTAS' },
            { number: 4, emoji: '⬅️', text: 'Volver a categorías', action: 'goToStep', actionValue: 'CATEGORIAS_FAQ', step: 'PREGUNTAS' },

            // Opciones para el paso RESPUESTA
            { number: 1, emoji: '👍', text: 'Útil', action: 'goToStep', actionValue: 'SATISFACCION', step: 'RESPUESTA' },
            { number: 2, emoji: '👎', text: 'No útil', action: 'goToStep', actionValue: 'SATISFACCION', step: 'RESPUESTA' },
            { number: 3, emoji: '❓', text: 'Otra pregunta', action: 'goToStep', actionValue: 'PREGUNTAS', step: 'RESPUESTA' },
            { number: 4, emoji: '👨‍💼', text: 'Hablar con asesor', action: 'sendMessage', actionValue: 'CONECTAR_ASESOR', step: 'RESPUESTA' },

            // Opciones para el paso SATISFACCION
            { number: 1, emoji: '🔍', text: 'Más preguntas', action: 'goToStep', actionValue: 'CATEGORIAS_FAQ', step: 'SATISFACCION' },
            { number: 2, emoji: '👨‍💼', text: 'Hablar con asesor', action: 'sendMessage', actionValue: 'CONECTAR_ASESOR', step: 'SATISFACCION' },
            { number: 3, emoji: '⬅️', text: 'Volver al inicio', action: 'goToStep', actionValue: 'INITIAL', step: 'SATISFACCION' }
        ],
        messages: {
            welcome: '🙋 *Centro de Atención al Cliente*\n\n¿En qué podemos ayudarte hoy?',
            CATEGORIAS_FAQ: '❓ *Categorías de Preguntas Frecuentes*\n\nSelecciona una categoría:',
            PREGUNTAS: '❓ *Preguntas frecuentes sobre ${categoria}*\n\nSelecciona una pregunta:',
            RESPUESTA: '📝 *${pregunta}*\n\n${respuesta}\n\n¿Esta información te fue útil?',
            SATISFACCION: '📊 Gracias por tu valoración. ¿Hay algo más en lo que podamos ayudarte?',
            CONECTAR_ASESOR: '👨‍💼 Te estamos conectando con un asesor especializado. Por favor, espera un momento.',
            ENVIAR_COMENTARIO: '📝 Por favor, escribe tu comentario o sugerencia:'
        }
    },

    procesoReservacion: {
        name: 'PROCESO_RESERVACION',
        description: 'Sistema completo para reservaciones',
        steps: ['INITIAL', 'SELECCIONAR_SERVICIO', 'SELECCIONAR_FECHA', 'SELECCIONAR_HORA', 'DATOS_CLIENTE', 'CONFIRMAR_RESERVA'],
        options: [
            // Opciones para el paso INITIAL
            { number: 1, emoji: '📅', text: 'Nueva reservación', action: 'goToStep', actionValue: 'SELECCIONAR_SERVICIO', step: 'INITIAL' },
            { number: 2, emoji: '🔍', text: 'Mis reservaciones', action: 'sendMessage', actionValue: 'MIS_RESERVACIONES', step: 'INITIAL' },
            { number: 3, emoji: '❓', text: 'Preguntas frecuentes', action: 'sendMessage', actionValue: 'FAQ_RESERVACIONES', step: 'INITIAL' },
            { number: 4, emoji: '⬅️', text: 'Regresar al menú', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para el paso SELECCIONAR_SERVICIO
            { number: 1, emoji: '💇', text: 'Servicio 1', action: 'goToStep', actionValue: 'SELECCIONAR_FECHA', step: 'SELECCIONAR_SERVICIO' },
            { number: 2, emoji: '💆', text: 'Servicio 2', action: 'goToStep', actionValue: 'SELECCIONAR_FECHA', step: 'SELECCIONAR_SERVICIO' },
            { number: 3, emoji: '💅', text: 'Servicio 3', action: 'goToStep', actionValue: 'SELECCIONAR_FECHA', step: 'SELECCIONAR_SERVICIO' },
            { number: 4, emoji: '⬅️', text: 'Regresar', action: 'goToStep', actionValue: 'INITIAL', step: 'SELECCIONAR_SERVICIO' },

            // Opciones para el paso SELECCIONAR_FECHA
            { number: 1, emoji: '📆', text: 'Hoy', action: 'goToStep', actionValue: 'SELECCIONAR_HORA', step: 'SELECCIONAR_FECHA' },
            { number: 2, emoji: '📆', text: 'Mañana', action: 'goToStep', actionValue: 'SELECCIONAR_HORA', step: 'SELECCIONAR_FECHA' },
            { number: 3, emoji: '📆', text: 'Esta semana', action: 'goToStep', actionValue: 'SELECCIONAR_HORA', step: 'SELECCIONAR_FECHA' },
            { number: 4, emoji: '⬅️', text: 'Cambiar servicio', action: 'goToStep', actionValue: 'SELECCIONAR_SERVICIO', step: 'SELECCIONAR_FECHA' },

            // Opciones para el paso SELECCIONAR_HORA
            { number: 1, emoji: '⏰', text: 'Mañana (9-12)', action: 'goToStep', actionValue: 'DATOS_CLIENTE', step: 'SELECCIONAR_HORA' },
            { number: 2, emoji: '⏰', text: 'Tarde (2-5)', action: 'goToStep', actionValue: 'DATOS_CLIENTE', step: 'SELECCIONAR_HORA' },
            { number: 3, emoji: '⏰', text: 'Noche (6-8)', action: 'goToStep', actionValue: 'DATOS_CLIENTE', step: 'SELECCIONAR_HORA' },
            { number: 4, emoji: '⬅️', text: 'Cambiar fecha', action: 'goToStep', actionValue: 'SELECCIONAR_FECHA', step: 'SELECCIONAR_HORA' },

            // Opciones para el paso CONFIRMAR_RESERVA
            { number: 1, emoji: '✅', text: 'Confirmar Datos', action: 'sendMessage', actionValue: 'RESERVA_EXITOSA', step: 'CONFIRMAR_RESERVA' },
            { number: 2, emoji: '📅', text: 'Cambiar Fecha/Hora', action: 'goToStep', actionValue: 'SELECCIONAR_FECHA', step: 'CONFIRMAR_RESERVA' },
            { number: 3, emoji: '🔄', text: 'Cambiar Servicio', action: 'goToStep', actionValue: 'SELECCIONAR_SERVICIO', step: 'CONFIRMAR_RESERVA' },
            { number: 4, emoji: '❌', text: 'Cancelar Reserva', action: 'goToStep', actionValue: 'INITIAL', step: 'CONFIRMAR_RESERVA' }
        ],
        messages: {
            welcome: '📅 *Sistema de Reservaciones*\n\n¿Qué deseas hacer?',
            SELECCIONAR_SERVICIO: 'Por favor, selecciona el servicio que deseas reservar:',
            servicioSeleccionado: 'Has seleccionado: *${servicio}*\n\nAhora, elige una fecha disponible:',
            SELECCIONAR_FECHA: 'Por favor, selecciona una fecha para tu reserva:',
            fechaSeleccionada: 'Fecha seleccionada: *${fecha}*\n\nPor favor, elige un horario disponible:',
            SELECCIONAR_HORA: 'Selecciona un horario disponible para el ${fecha}:',
            horaSeleccionada: 'Has seleccionado: ${fecha} a las ${hora}.\n\nPor favor, proporciona tus datos de contacto:',
            DATOS_CLIENTE: 'Por favor, envía tu nombre completo:',
            telefonoCliente: 'Gracias, ${nombre}. Ahora, envía tu número telefónico:',
            emailCliente: 'Excelente. Por último, envía tu correo electrónico:',
            CONFIRMAR_RESERVA: '📋 *Resumen de tu Reserva*\n\nServicio: ${servicio}\nFecha: ${fecha}\nHora: ${hora}\nNombre: ${nombre}\nTeléfono: ${telefono}\nEmail: ${email}\n\n¿Los datos son correctos?',
            RESERVA_EXITOSA: '✅ *¡Reserva Confirmada!*\n\nTu código de reserva es: ${codigo}\n\nTe hemos enviado un correo con todos los detalles.\n\nRecuerda llegar 15 minutos antes de tu cita.',
            MIS_RESERVACIONES: 'Actualmente no tienes reservaciones activas.',
            FAQ_RESERVACIONES: '❓ *Preguntas Frecuentes - Reservaciones*\n\n1. ¿Puedo cancelar mi reserva?\nSí, puedes cancelar hasta 24 horas antes sin costo.\n\n2. ¿Qué sucede si llego tarde?\nTenemos una tolerancia de 15 minutos, después de ese tiempo la reserva podría ser cancelada.\n\n3. ¿Cómo puedo reprogramar?\nPuedes reprogramar tu cita hasta 24 horas antes a través de este mismo chat.'
        }
    },

    encuestaSatisfaccion: {
        name: 'ENCUESTA_SATISFACCION',
        description: 'Sistema de encuestas de satisfacción del cliente',
        steps: ['INITIAL', 'PREGUNTA_1', 'PREGUNTA_2', 'PREGUNTA_3', 'PREGUNTA_4', 'COMENTARIOS', 'FINALIZAR'],
        options: [
            // Opciones para el paso INITIAL
            { number: 1, emoji: '📝', text: 'Iniciar encuesta', action: 'goToStep', actionValue: 'PREGUNTA_1', step: 'INITIAL' },
            { number: 2, emoji: '❓', text: 'Sobre la encuesta', action: 'sendMessage', actionValue: 'SOBRE_ENCUESTA', step: 'INITIAL' },
            { number: 3, emoji: '⬅️', text: 'Regresar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para las preguntas (mismo formato para todas)
            // PREGUNTA_1
            { number: 1, emoji: '⭐', text: 'Muy Insatisfecho', action: 'goToStep', actionValue: 'PREGUNTA_2', step: 'PREGUNTA_1' },
            { number: 2, emoji: '⭐⭐', text: 'Insatisfecho', action: 'goToStep', actionValue: 'PREGUNTA_2', step: 'PREGUNTA_1' },
            { number: 3, emoji: '⭐⭐⭐', text: 'Neutral', action: 'goToStep', actionValue: 'PREGUNTA_2', step: 'PREGUNTA_1' },
            { number: 4, emoji: '⭐⭐⭐⭐', text: 'Satisfecho', action: 'goToStep', actionValue: 'PREGUNTA_2', step: 'PREGUNTA_1' },
            { number: 5, emoji: '⭐⭐⭐⭐⭐', text: 'Muy Satisfecho', action: 'goToStep', actionValue: 'PREGUNTA_2', step: 'PREGUNTA_1' },

            // PREGUNTA_2
            { number: 1, emoji: '⭐', text: 'Muy Insatisfecho', action: 'goToStep', actionValue: 'PREGUNTA_3', step: 'PREGUNTA_2' },
            { number: 2, emoji: '⭐⭐', text: 'Insatisfecho', action: 'goToStep', actionValue: 'PREGUNTA_3', step: 'PREGUNTA_2' },
            { number: 3, emoji: '⭐⭐⭐', text: 'Neutral', action: 'goToStep', actionValue: 'PREGUNTA_3', step: 'PREGUNTA_2' },
            { number: 4, emoji: '⭐⭐⭐⭐', text: 'Satisfecho', action: 'goToStep', actionValue: 'PREGUNTA_3', step: 'PREGUNTA_2' },
            { number: 5, emoji: '⭐⭐⭐⭐⭐', text: 'Muy Satisfecho', action: 'goToStep', actionValue: 'PREGUNTA_3', step: 'PREGUNTA_2' },

            // PREGUNTA_3
            { number: 1, emoji: '⭐', text: 'Muy Insatisfecho', action: 'goToStep', actionValue: 'PREGUNTA_4', step: 'PREGUNTA_3' },
            { number: 2, emoji: '⭐⭐', text: 'Insatisfecho', action: 'goToStep', actionValue: 'PREGUNTA_4', step: 'PREGUNTA_3' },
            { number: 3, emoji: '⭐⭐⭐', text: 'Neutral', action: 'goToStep', actionValue: 'PREGUNTA_4', step: 'PREGUNTA_3' },
            { number: 4, emoji: '⭐⭐⭐⭐', text: 'Satisfecho', action: 'goToStep', actionValue: 'PREGUNTA_4', step: 'PREGUNTA_3' },
            { number: 5, emoji: '⭐⭐⭐⭐⭐', text: 'Muy Satisfecho', action: 'goToStep', actionValue: 'PREGUNTA_4', step: 'PREGUNTA_3' },

            // PREGUNTA_4
            { number: 1, emoji: '⭐', text: 'Muy Insatisfecho', action: 'goToStep', actionValue: 'COMENTARIOS', step: 'PREGUNTA_4' },
            { number: 2, emoji: '⭐⭐', text: 'Insatisfecho', action: 'goToStep', actionValue: 'COMENTARIOS', step: 'PREGUNTA_4' },
            { number: 3, emoji: '⭐⭐⭐', text: 'Neutral', action: 'goToStep', actionValue: 'COMENTARIOS', step: 'PREGUNTA_4' },
            { number: 4, emoji: '⭐⭐⭐⭐', text: 'Satisfecho', action: 'goToStep', actionValue: 'COMENTARIOS', step: 'PREGUNTA_4' },
            { number: 5, emoji: '⭐⭐⭐⭐⭐', text: 'Muy Satisfecho', action: 'goToStep', actionValue: 'COMENTARIOS', step: 'PREGUNTA_4' },

            // COMENTARIOS - Solo avanza después de que el usuario escriba algo

            // FINALIZAR
            { number: 1, emoji: '🏠', text: 'Volver al inicio', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'FINALIZAR' },
            { number: 2, emoji: '💬', text: 'Compartir más feedback', action: 'sendMessage', actionValue: 'MAS_FEEDBACK', step: 'FINALIZAR' }
        ],
        messages: {
            welcome: '📊 *Encuesta de Satisfacción*\n\nGracias por participar en nuestra encuesta. Tus respuestas nos ayudan a mejorar.',
            SOBRE_ENCUESTA: 'Esta encuesta te tomará aproximadamente 2 minutos. Tus respuestas son anónimas y nos ayudan a mejorar nuestros servicios.',
            PREGUNTA_1: '1️⃣ ¿Qué tan satisfecho estás con la calidad de nuestros productos/servicios?',
            PREGUNTA_2: '2️⃣ ¿Qué tan satisfecho estás con la atención recibida por nuestro personal?',
            PREGUNTA_3: '3️⃣ ¿Qué tan satisfecho estás con el tiempo de respuesta/entrega?',
            PREGUNTA_4: '4️⃣ ¿Qué tan probable es que recomiendes nuestros servicios a un amigo o familiar?',
            COMENTARIOS: '💬 ¿Tienes algún comentario o sugerencia adicional? Por favor, escríbelo a continuación:',
            FINALIZAR: '🙏 *¡Gracias por completar nuestra encuesta!*\n\nTus comentarios son muy valiosos para nosotros y nos ayudarán a mejorar nuestros servicios.\n\nComo agradecimiento, hemos enviado un cupón de descuento a tu correo electrónico.',
            MAS_FEEDBACK: '📝 Por favor, comparte cualquier comentario adicional que tengas:'
        }
    },

    gestionPagos: {
        name: 'GESTION_PAGOS',
        description: 'Sistema para gestionar pagos y facturas',
        steps: ['INITIAL', 'SELECCIONAR_OPCION', 'CONSULTAR_FACTURAS', 'REALIZAR_PAGO', 'CONFIRMAR_PAGO'],
        options: [
            // Opciones para el paso INITIAL
            { number: 1, emoji: '📃', text: 'Consultar Facturas', action: 'goToStep', actionValue: 'CONSULTAR_FACTURAS', step: 'INITIAL' },
            { number: 2, emoji: '💵', text: 'Realizar Pago', action: 'goToStep', actionValue: 'REALIZAR_PAGO', step: 'INITIAL' },
            { number: 3, emoji: '📤', text: 'Solicitar Factura', action: 'sendMessage', actionValue: 'SOLICITAR_FACTURA', step: 'INITIAL' },
            { number: 4, emoji: '❓', text: 'Dudas sobre Pagos', action: 'goToFlow', actionValue: 'ATENCION_CLIENTE', step: 'INITIAL' },
            { number: 5, emoji: '⬅️', text: 'Regresar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para el paso CONSULTAR_FACTURAS
            { number: 1, emoji: '📄', text: 'Factura #1', action: 'goToStep', actionValue: 'REALIZAR_PAGO', step: 'CONSULTAR_FACTURAS' },
            { number: 2, emoji: '📄', text: 'Factura #2', action: 'goToStep', actionValue: 'REALIZAR_PAGO', step: 'CONSULTAR_FACTURAS' },
            { number: 3, emoji: '📄', text: 'Factura #3', action: 'goToStep', actionValue: 'REALIZAR_PAGO', step: 'CONSULTAR_FACTURAS' },
            { number: 4, emoji: '⬅️', text: 'Regresar', action: 'goToStep', actionValue: 'INITIAL', step: 'CONSULTAR_FACTURAS' },

            // Opciones para el paso REALIZAR_PAGO
            { number: 1, emoji: '💳', text: 'Tarjeta de crédito', action: 'goToStep', actionValue: 'CONFIRMAR_PAGO', step: 'REALIZAR_PAGO' },
            { number: 2, emoji: '🏦', text: 'Transferencia bancaria', action: 'goToStep', actionValue: 'CONFIRMAR_PAGO', step: 'REALIZAR_PAGO' },
            { number: 3, emoji: '💰', text: 'Pago en efectivo', action: 'goToStep', actionValue: 'CONFIRMAR_PAGO', step: 'REALIZAR_PAGO' },
            { number: 4, emoji: '⬅️', text: 'Regresar', action: 'goToStep', actionValue: 'CONSULTAR_FACTURAS', step: 'REALIZAR_PAGO' },

            // Opciones para el paso CONFIRMAR_PAGO
            { number: 1, emoji: '✅', text: 'Confirmar', action: 'sendMessage', actionValue: 'PAGO_EXITOSO', step: 'CONFIRMAR_PAGO' },
            { number: 2, emoji: '❌', text: 'Cancelar', action: 'goToStep', actionValue: 'REALIZAR_PAGO', step: 'CONFIRMAR_PAGO' }
        ],
        messages: {
            welcome: '💰 *Gestión de Pagos y Facturas*\n\n¿Qué deseas hacer hoy?',
            CONSULTAR_FACTURAS: '📃 *Tus Facturas Pendientes*\n\n${facturas}\n\nSelecciona una factura para realizar el pago:',
            sinFacturas: '✅ No tienes facturas pendientes de pago.',
            REALIZAR_PAGO: 'Has seleccionado la factura #${idFactura}\n\nMonto: $${monto}\nFecha de emisión: ${fechaEmision}\nFecha de vencimiento: ${fechaVencimiento}\n\nSelecciona un método de pago:',
            CONFIRMAR_PAGO: '⚠️ ¿Estás seguro de realizar el pago por $${monto}?',
            PAGO_EXITOSO: '✅ *¡Pago Exitoso!*\n\nFactura: #${idFactura}\nMonto: $${monto}\nFecha de pago: ${fechaPago}\nReferencia: ${referencia}\n\nHemos enviado el comprobante a tu correo electrónico.',
            SOLICITAR_FACTURA: '📤 Para solicitar una factura, por favor proporciona tus datos fiscales respondiendo a este mensaje.'
        }
    },

    // Continúo con los demás templates, agregando la propiedad step a cada opción
    // y organizándolas según el paso del flujo al que pertenecen

    // Las plantillas seguirían con el mismo formato para los demás flujos...
    // He incluido las primeras 8 plantillas como muestra. El proceso sería similar para el resto.


    // Continuación de las plantillas de flujos con la propiedad step agregada

    localizadorSucursales: {
        name: 'LOCALIZADOR_SUCURSALES',
        description: 'Localizador de sucursales o puntos de venta',
        steps: ['INITIAL', 'SELECCIONAR_METODO', 'POR_CIUDAD', 'POR_CP', 'UBICACION_ACTUAL', 'DETALLES_SUCURSAL'],
        options: [
            // Opciones para el paso INITIAL
            { number: 1, emoji: '🏙️', text: 'Buscar por Ciudad', action: 'goToStep', actionValue: 'POR_CIUDAD', step: 'INITIAL' },
            { number: 2, emoji: '📮', text: 'Buscar por C.P.', action: 'goToStep', actionValue: 'POR_CP', step: 'INITIAL' },
            { number: 3, emoji: '📍', text: 'Usar mi Ubicación', action: 'goToStep', actionValue: 'UBICACION_ACTUAL', step: 'INITIAL' },
            { number: 4, emoji: '🔝', text: 'Más Cercanas', action: 'sendMessage', actionValue: 'SUCURSALES_CERCANAS', step: 'INITIAL' },
            { number: 5, emoji: '⬅️', text: 'Regresar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para cuando se muestran resultados (después de cada método de búsqueda)
            { number: 1, emoji: '🏬', text: 'Sucursal 1', action: 'goToStep', actionValue: 'DETALLES_SUCURSAL', step: 'POR_CIUDAD' },
            { number: 2, emoji: '🏬', text: 'Sucursal 2', action: 'goToStep', actionValue: 'DETALLES_SUCURSAL', step: 'POR_CIUDAD' },
            { number: 3, emoji: '🏬', text: 'Sucursal 3', action: 'goToStep', actionValue: 'DETALLES_SUCURSAL', step: 'POR_CIUDAD' },
            { number: 4, emoji: '🔄', text: 'Otra búsqueda', action: 'goToStep', actionValue: 'INITIAL', step: 'POR_CIUDAD' },

            // Las mismas opciones para búsqueda por CP
            { number: 1, emoji: '🏬', text: 'Sucursal 1', action: 'goToStep', actionValue: 'DETALLES_SUCURSAL', step: 'POR_CP' },
            { number: 2, emoji: '🏬', text: 'Sucursal 2', action: 'goToStep', actionValue: 'DETALLES_SUCURSAL', step: 'POR_CP' },
            { number: 3, emoji: '🏬', text: 'Sucursal 3', action: 'goToStep', actionValue: 'DETALLES_SUCURSAL', step: 'POR_CP' },
            { number: 4, emoji: '🔄', text: 'Otra búsqueda', action: 'goToStep', actionValue: 'INITIAL', step: 'POR_CP' },

            // Las mismas opciones para búsqueda por ubicación
            { number: 1, emoji: '🏬', text: 'Sucursal 1', action: 'goToStep', actionValue: 'DETALLES_SUCURSAL', step: 'UBICACION_ACTUAL' },
            { number: 2, emoji: '🏬', text: 'Sucursal 2', action: 'goToStep', actionValue: 'DETALLES_SUCURSAL', step: 'UBICACION_ACTUAL' },
            { number: 3, emoji: '🏬', text: 'Sucursal 3', action: 'goToStep', actionValue: 'DETALLES_SUCURSAL', step: 'UBICACION_ACTUAL' },
            { number: 4, emoji: '🔄', text: 'Otra búsqueda', action: 'goToStep', actionValue: 'INITIAL', step: 'UBICACION_ACTUAL' },

            // Opciones para el paso DETALLES_SUCURSAL
            { number: 1, emoji: '🗺️', text: 'Ver en mapa', action: 'sendMessage', actionValue: 'VER_MAPA', step: 'DETALLES_SUCURSAL' },
            { number: 2, emoji: '📞', text: 'Llamar', action: 'sendMessage', actionValue: 'LLAMAR_SUCURSAL', step: 'DETALLES_SUCURSAL' },
            { number: 3, emoji: '📝', text: 'Agendar visita', action: 'goToFlow', actionValue: 'AGENDA_CITAS', step: 'DETALLES_SUCURSAL' },
            { number: 4, emoji: '⬅️', text: 'Regresar a resultados', action: 'goToStep', actionValue: 'INITIAL', step: 'DETALLES_SUCURSAL' }
        ],
        messages: {
            welcome: '🏬 *Localizador de Sucursales*\n\n¿Cómo deseas buscar nuestras sucursales?',
            POR_CIUDAD: '🏙️ Por favor, envía el nombre de la ciudad:',
            POR_CP: '📮 Por favor, envía el código postal:',
            UBICACION_ACTUAL: '📍 Para buscar sucursales cercanas, comparte tu ubicación actual.',
            resultados: '🔍 *Sucursales Encontradas*\n\n${sucursales}\n\nSelecciona una sucursal para ver detalles:',
            sinResultados: '❌ No se encontraron sucursales en esa ubicación. Intenta con otra búsqueda.',
            DETALLES_SUCURSAL: '🏬 *${nombreSucursal}*\n\nDirección: ${direccion}\nTeléfono: ${telefono}\nHorario: ${horario}\nServicios: ${servicios}\n\n📍 [Ver en mapa](${urlMapa})',
            SUCURSALES_CERCANAS: '🔄 Para mostrarte las sucursales más cercanas, necesito tu ubicación actual. Por favor, compártela.',
            VER_MAPA: 'Puedes ver la ubicación en el siguiente enlace: ${urlMapa}',
            LLAMAR_SUCURSAL: 'Puedes llamar directamente al: ${telefono}'
        }
    },

    programaLealtad: {
        name: 'PROGRAMA_LEALTAD',
        description: 'Gestión del programa de lealtad o puntos',
        steps: ['INITIAL', 'CONSULTAR_PUNTOS', 'CANJEAR_PUNTOS', 'BENEFICIOS', 'HISTORIAL'],
        options: [
            // Opciones para el paso INITIAL
            { number: 1, emoji: '🔍', text: 'Consultar Puntos', action: 'goToStep', actionValue: 'CONSULTAR_PUNTOS', step: 'INITIAL' },
            { number: 2, emoji: '🎁', text: 'Canjear Puntos', action: 'goToStep', actionValue: 'CANJEAR_PUNTOS', step: 'INITIAL' },
            { number: 3, emoji: '⭐', text: 'Beneficios', action: 'goToStep', actionValue: 'BENEFICIOS', step: 'INITIAL' },
            { number: 4, emoji: '📜', text: 'Historial', action: 'goToStep', actionValue: 'HISTORIAL', step: 'INITIAL' },
            { number: 5, emoji: '❓', text: 'Preguntas Frecuentes', action: 'sendMessage', actionValue: 'FAQ_LEALTAD', step: 'INITIAL' },
            { number: 6, emoji: '⬅️', text: 'Regresar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para el paso CONSULTAR_PUNTOS
            { number: 1, emoji: '🎁', text: 'Canjear Puntos', action: 'goToStep', actionValue: 'CANJEAR_PUNTOS', step: 'CONSULTAR_PUNTOS' },
            { number: 2, emoji: '⭐', text: 'Ver Beneficios', action: 'goToStep', actionValue: 'BENEFICIOS', step: 'CONSULTAR_PUNTOS' },
            { number: 3, emoji: '⬅️', text: 'Volver al menú', action: 'goToStep', actionValue: 'INITIAL', step: 'CONSULTAR_PUNTOS' },

            // Opciones para el paso CANJEAR_PUNTOS
            { number: 1, emoji: '🎁', text: 'Recompensa 1', action: 'sendMessage', actionValue: 'CANJEAR_RECOMPENSA_1', step: 'CANJEAR_PUNTOS' },
            { number: 2, emoji: '🎁', text: 'Recompensa 2', action: 'sendMessage', actionValue: 'CANJEAR_RECOMPENSA_2', step: 'CANJEAR_PUNTOS' },
            { number: 3, emoji: '🎁', text: 'Recompensa 3', action: 'sendMessage', actionValue: 'CANJEAR_RECOMPENSA_3', step: 'CANJEAR_PUNTOS' },
            { number: 4, emoji: '⬅️', text: 'Volver al menú', action: 'goToStep', actionValue: 'INITIAL', step: 'CANJEAR_PUNTOS' },

            // Opciones para el paso BENEFICIOS
            { number: 1, emoji: '🔍', text: 'Consultar mis puntos', action: 'goToStep', actionValue: 'CONSULTAR_PUNTOS', step: 'BENEFICIOS' },
            { number: 2, emoji: '🎁', text: 'Canjear puntos', action: 'goToStep', actionValue: 'CANJEAR_PUNTOS', step: 'BENEFICIOS' },
            { number: 3, emoji: '⬅️', text: 'Volver al menú', action: 'goToStep', actionValue: 'INITIAL', step: 'BENEFICIOS' },

            // Opciones para el paso HISTORIAL
            { number: 1, emoji: '🔍', text: 'Filtrar por fecha', action: 'sendMessage', actionValue: 'FILTRAR_HISTORIAL', step: 'HISTORIAL' },
            { number: 2, emoji: '📊', text: 'Estadísticas', action: 'sendMessage', actionValue: 'ESTADISTICAS_PUNTOS', step: 'HISTORIAL' },
            { number: 3, emoji: '⬅️', text: 'Volver al menú', action: 'goToStep', actionValue: 'INITIAL', step: 'HISTORIAL' }
        ],
        messages: {
            welcome: '🏆 *Programa de Lealtad*\n\n¡Bienvenido a tu portal de fidelización! ¿Qué deseas hacer hoy?',
            CONSULTAR_PUNTOS: '💯 *Tus Puntos Actuales*\n\nTienes ${puntos} puntos disponibles.\nNivel: ${nivel}\nPuntos para siguiente nivel: ${puntosProximoNivel}',
            CANJEAR_PUNTOS: '🎁 *Catálogo de Recompensas*\n\nPuntos disponibles: ${puntos}\n\n${recompensas}\n\nSelecciona una recompensa para canjear:',
            confirmacionCanje: '⚠️ ¿Estás seguro de canjear ${puntosRecompensa} puntos por "${nombreRecompensa}"?',
            canjeExitoso: '✅ *¡Canje Exitoso!*\n\nHas canjeado ${puntosRecompensa} puntos por "${nombreRecompensa}".\n\nPuntos restantes: ${puntosRestantes}\n\nHemos enviado los detalles a tu correo electrónico.',
            BENEFICIOS: '⭐ *Beneficios por Nivel*\n\n${beneficios}',
            HISTORIAL: '📜 *Historial de Puntos*\n\n${historial}',
            FAQ_LEALTAD: '❓ *Preguntas Frecuentes - Programa de Lealtad*\n\n1️⃣ ¿Cómo acumulo puntos?\nPor cada compra que realices acumulas 1 punto por cada $10 gastados.\n\n2️⃣ ¿Cuándo vencen mis puntos?\nLos puntos tienen una vigencia de 12 meses a partir de su obtención.\n\n3️⃣ ¿Cómo subo de nivel?\nAl acumular cierta cantidad de puntos en un periodo de 6 meses.',
            CANJEAR_RECOMPENSA_1: '⚠️ ¿Estás seguro de canjear 500 puntos por "Descuento de $100"?',
            CANJEAR_RECOMPENSA_2: '⚠️ ¿Estás seguro de canjear 1000 puntos por "Producto gratis"?',
            CANJEAR_RECOMPENSA_3: '⚠️ ¿Estás seguro de canjear 2000 puntos por "Servicio premium"?',
            FILTRAR_HISTORIAL: 'Por favor, indica el rango de fechas que deseas consultar (DD/MM/AAAA - DD/MM/AAAA):',
            ESTADISTICAS_PUNTOS: '📊 *Estadísticas de tus Puntos*\n\nPuntos acumulados este año: ${puntosAnual}\nPromedio mensual: ${promedioMensual}\nMes con más puntos: ${mejorMes}\nPuntos canjeados: ${puntosCanjeados}'
        }
    },

    chatboEducativo: {
        name: 'CHATBOT_EDUCATIVO',
        description: 'Sistema de cursos y aprendizaje interactivo',
        steps: ['INITIAL', 'CATEGORIAS_CURSOS', 'LISTAR_CURSOS', 'DETALLE_CURSO', 'LECCION', 'QUIZ'],
        options: [
            // Opciones para el paso INITIAL
            { number: 1, emoji: '📚', text: 'Explorar Cursos', action: 'goToStep', actionValue: 'CATEGORIAS_CURSOS', step: 'INITIAL' },
            { number: 2, emoji: '🎓', text: 'Mis Cursos', action: 'sendMessage', actionValue: 'MIS_CURSOS', step: 'INITIAL' },
            { number: 3, emoji: '🔍', text: 'Buscar Curso', action: 'sendMessage', actionValue: 'BUSCAR_CURSO', step: 'INITIAL' },
            { number: 4, emoji: '📊', text: 'Mi Progreso', action: 'sendMessage', actionValue: 'MI_PROGRESO', step: 'INITIAL' },
            { number: 5, emoji: '📝', text: 'Certificaciones', action: 'sendMessage', actionValue: 'CERTIFICACIONES', step: 'INITIAL' },
            { number: 6, emoji: '⬅️', text: 'Regresar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para el paso CATEGORIAS_CURSOS
            { number: 1, emoji: '💻', text: 'Tecnología', action: 'goToStep', actionValue: 'LISTAR_CURSOS', step: 'CATEGORIAS_CURSOS' },
            { number: 2, emoji: '💼', text: 'Negocios', action: 'goToStep', actionValue: 'LISTAR_CURSOS', step: 'CATEGORIAS_CURSOS' },
            { number: 3, emoji: '🎨', text: 'Diseño', action: 'goToStep', actionValue: 'LISTAR_CURSOS', step: 'CATEGORIAS_CURSOS' },
            { number: 4, emoji: '🗣️', text: 'Idiomas', action: 'goToStep', actionValue: 'LISTAR_CURSOS', step: 'CATEGORIAS_CURSOS' },
            { number: 5, emoji: '⬅️', text: 'Volver al inicio', action: 'goToStep', actionValue: 'INITIAL', step: 'CATEGORIAS_CURSOS' },

            // Opciones para el paso LISTAR_CURSOS
            { number: 1, emoji: '📘', text: 'Curso 1', action: 'goToStep', actionValue: 'DETALLE_CURSO', step: 'LISTAR_CURSOS' },
            { number: 2, emoji: '📘', text: 'Curso 2', action: 'goToStep', actionValue: 'DETALLE_CURSO', step: 'LISTAR_CURSOS' },
            { number: 3, emoji: '📘', text: 'Curso 3', action: 'goToStep', actionValue: 'DETALLE_CURSO', step: 'LISTAR_CURSOS' },
            { number: 4, emoji: '🔍', text: 'Buscar', action: 'sendMessage', actionValue: 'BUSCAR_CURSO', step: 'LISTAR_CURSOS' },
            { number: 5, emoji: '⬅️', text: 'Volver a categorías', action: 'goToStep', actionValue: 'CATEGORIAS_CURSOS', step: 'LISTAR_CURSOS' },

            // Opciones para el paso DETALLE_CURSO
            { number: 1, emoji: '✅', text: 'Inscribirme', action: 'sendMessage', actionValue: 'INSCRIPCION_CURSO', step: 'DETALLE_CURSO' },
            { number: 2, emoji: '📝', text: 'Ver temario', action: 'sendMessage', actionValue: 'VER_TEMARIO', step: 'DETALLE_CURSO' },
            { number: 3, emoji: '👨‍🏫', text: 'Información del instructor', action: 'sendMessage', actionValue: 'INFO_INSTRUCTOR', step: 'DETALLE_CURSO' },
            { number: 4, emoji: '📖', text: 'Iniciar primera lección', action: 'goToStep', actionValue: 'LECCION', step: 'DETALLE_CURSO' },
            { number: 5, emoji: '⬅️', text: 'Volver a cursos', action: 'goToStep', actionValue: 'LISTAR_CURSOS', step: 'DETALLE_CURSO' },

            // Opciones para el paso LECCION
            { number: 1, emoji: '➡️', text: 'Siguiente lección', action: 'sendMessage', actionValue: 'SIGUIENTE_LECCION', step: 'LECCION' },
            { number: 2, emoji: '⬅️', text: 'Lección anterior', action: 'sendMessage', actionValue: 'LECCION_ANTERIOR', step: 'LECCION' },
            { number: 3, emoji: '❓', text: 'Realizar quiz', action: 'goToStep', actionValue: 'QUIZ', step: 'LECCION' },
            { number: 4, emoji: '📋', text: 'Índice del curso', action: 'goToStep', actionValue: 'DETALLE_CURSO', step: 'LECCION' },

            // Opciones para el paso QUIZ
            { number: 1, emoji: 'A', text: 'Opción A', action: 'sendMessage', actionValue: 'RESPUESTA_A', step: 'QUIZ' },
            { number: 2, emoji: 'B', text: 'Opción B', action: 'sendMessage', actionValue: 'RESPUESTA_B', step: 'QUIZ' },
            { number: 3, emoji: 'C', text: 'Opción C', action: 'sendMessage', actionValue: 'RESPUESTA_C', step: 'QUIZ' },
            { number: 4, emoji: 'D', text: 'Opción D', action: 'sendMessage', actionValue: 'RESPUESTA_D', step: 'QUIZ' },
            { number: 5, emoji: '⬅️', text: 'Volver a la lección', action: 'goToStep', actionValue: 'LECCION', step: 'QUIZ' }
        ],
        messages: {
            welcome: '🎓 *Plataforma Educativa*\n\n¡Bienvenido a tu portal de aprendizaje! ¿Qué deseas hacer hoy?',
            CATEGORIAS_CURSOS: '📚 *Categorías de Cursos*\n\nSelecciona una categoría para explorar:',
            LISTAR_CURSOS: '📖 *Cursos de ${categoria}*\n\n${cursos}\n\nSelecciona un curso para ver detalles:',
            DETALLE_CURSO: '📋 *${nombreCurso}*\n\nDuración: ${duracion}\nNivel: ${nivel}\nInstructor: ${instructor}\n\nDescripción: ${descripcion}\n\nContenido: ${contenido}\n\n¿Deseas inscribirte en este curso?',
            INSCRIPCION_CURSO: '✅ *¡Inscripción Exitosa!*\n\nTe has inscrito correctamente al curso "${nombreCurso}".\n\n¿Deseas comenzar ahora tu primera lección?',
            LECCION: '📝 *Lección ${numeroLeccion}: ${tituloLeccion}*\n\n${contenidoLeccion}\n\n¿Deseas continuar con la siguiente lección o realizar un quiz para evaluar tu aprendizaje?',
            QUIZ: '❓ *Quiz - ${tituloLeccion}*\n\n${pregunta}\n\nSelecciona la respuesta correcta:',
            resultadoQuiz: '📊 *Resultado del Quiz*\n\nRespuestas correctas: ${correctas}/${total}\n\n¡${mensaje}!',
            MIS_CURSOS: '📚 *Mis Cursos*\n\n${cursos}\n\nSelecciona un curso para continuar:',
            BUSCAR_CURSO: '🔍 Por favor, escribe el nombre o palabra clave del curso que deseas buscar:',
            MI_PROGRESO: '📊 *Mi Progreso*\n\n${progreso}',
            CERTIFICACIONES: '🎓 *Mis Certificaciones*\n\n${certificaciones}',
            VER_TEMARIO: '📑 *Temario del curso ${nombreCurso}*\n\n${temario}',
            INFO_INSTRUCTOR: '👨‍🏫 *Información del Instructor*\n\nNombre: ${nombreInstructor}\nEspecialidad: ${especialidad}\nExperiencia: ${experiencia}\n\n${bioInstructor}',
            SIGUIENTE_LECCION: '⏭️ Avanzando a la siguiente lección...',
            LECCION_ANTERIOR: '⏮️ Volviendo a la lección anterior...',
            RESPUESTA_A: '✅ ¡Respuesta correcta! / ❌ Respuesta incorrecta. La respuesta correcta es: ${respuestaCorrecta}',
            RESPUESTA_B: '✅ ¡Respuesta correcta! / ❌ Respuesta incorrecta. La respuesta correcta es: ${respuestaCorrecta}',
            RESPUESTA_C: '✅ ¡Respuesta correcta! / ❌ Respuesta incorrecta. La respuesta correcta es: ${respuestaCorrecta}',
            RESPUESTA_D: '✅ ¡Respuesta correcta! / ❌ Respuesta incorrecta. La respuesta correcta es: ${respuestaCorrecta}'
        }
    },

    gestionCitas: {
        name: 'GESTION_CITAS',
        description: 'Sistema avanzado para gestión de citas',
        steps: ['INITIAL', 'VER_CITAS', 'AGENDAR_CITA', 'SELECCIONAR_ESPECIALISTA', 'SELECCIONAR_FECHA', 'SELECCIONAR_HORA', 'CONFIRMAR_CITA', 'CANCELAR_CITA', 'REPROGRAMAR_CITA'],
        options: [
            // Opciones para el paso INITIAL
            { number: 1, emoji: '📅', text: 'Ver Mis Citas', action: 'goToStep', actionValue: 'VER_CITAS', step: 'INITIAL' },
            { number: 2, emoji: '➕', text: 'Agendar Nueva Cita', action: 'goToStep', actionValue: 'AGENDAR_CITA', step: 'INITIAL' },
            { number: 3, emoji: '🔄', text: 'Reprogramar Cita', action: 'goToStep', actionValue: 'REPROGRAMAR_CITA', step: 'INITIAL' },
            { number: 4, emoji: '❌', text: 'Cancelar Cita', action: 'goToStep', actionValue: 'CANCELAR_CITA', step: 'INITIAL' },
            { number: 5, emoji: '📝', text: 'Historial de Citas', action: 'sendMessage', actionValue: 'HISTORIAL_CITAS', step: 'INITIAL' },
            { number: 6, emoji: '⬅️', text: 'Regresar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para el paso VER_CITAS
            { number: 1, emoji: '1️⃣', text: 'Cita #1', action: 'sendMessage', actionValue: 'DETALLE_CITA_1', step: 'VER_CITAS' },
            { number: 2, emoji: '2️⃣', text: 'Cita #2', action: 'sendMessage', actionValue: 'DETALLE_CITA_2', step: 'VER_CITAS' },
            { number: 3, emoji: '➕', text: 'Nueva Cita', action: 'goToStep', actionValue: 'AGENDAR_CITA', step: 'VER_CITAS' },
            { number: 4, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'VER_CITAS' },

            // Opciones para el paso AGENDAR_CITA
            { number: 1, emoji: '👨‍⚕️', text: 'Consulta Médica', action: 'goToStep', actionValue: 'SELECCIONAR_ESPECIALISTA', step: 'AGENDAR_CITA' },
            { number: 2, emoji: '🦷', text: 'Dental', action: 'goToStep', actionValue: 'SELECCIONAR_ESPECIALISTA', step: 'AGENDAR_CITA' },
            { number: 3, emoji: '💆', text: 'Spa', action: 'goToStep', actionValue: 'SELECCIONAR_ESPECIALISTA', step: 'AGENDAR_CITA' },
            { number: 4, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'AGENDAR_CITA' },

            // Opciones para el paso SELECCIONAR_ESPECIALISTA
            { number: 1, emoji: '👨‍⚕️', text: 'Dr. García', action: 'goToStep', actionValue: 'SELECCIONAR_FECHA', step: 'SELECCIONAR_ESPECIALISTA' },
            { number: 2, emoji: '👩‍⚕️', text: 'Dra. Rodríguez', action: 'goToStep', actionValue: 'SELECCIONAR_FECHA', step: 'SELECCIONAR_ESPECIALISTA' },
            { number: 3, emoji: '👨‍⚕️', text: 'Dr. Pérez', action: 'goToStep', actionValue: 'SELECCIONAR_FECHA', step: 'SELECCIONAR_ESPECIALISTA' },
            { number: 4, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'AGENDAR_CITA', step: 'SELECCIONAR_ESPECIALISTA' },

            // Opciones para el paso SELECCIONAR_FECHA
            { number: 1, emoji: '📅', text: 'Hoy', action: 'goToStep', actionValue: 'SELECCIONAR_HORA', step: 'SELECCIONAR_FECHA' },
            { number: 2, emoji: '📅', text: 'Mañana', action: 'goToStep', actionValue: 'SELECCIONAR_HORA', step: 'SELECCIONAR_FECHA' },
            { number: 3, emoji: '📅', text: 'Esta semana', action: 'goToStep', actionValue: 'SELECCIONAR_HORA', step: 'SELECCIONAR_FECHA' },
            { number: 4, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'SELECCIONAR_ESPECIALISTA', step: 'SELECCIONAR_FECHA' },

            // Opciones para el paso SELECCIONAR_HORA
            { number: 1, emoji: '🕐', text: '9:00', action: 'goToStep', actionValue: 'CONFIRMAR_CITA', step: 'SELECCIONAR_HORA' },
            { number: 2, emoji: '🕑', text: '10:00', action: 'goToStep', actionValue: 'CONFIRMAR_CITA', step: 'SELECCIONAR_HORA' },
            { number: 3, emoji: '🕒', text: '11:00', action: 'goToStep', actionValue: 'CONFIRMAR_CITA', step: 'SELECCIONAR_HORA' },
            { number: 4, emoji: '🕓', text: '12:00', action: 'goToStep', actionValue: 'CONFIRMAR_CITA', step: 'SELECCIONAR_HORA' },
            { number: 5, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'SELECCIONAR_FECHA', step: 'SELECCIONAR_HORA' },

            // Opciones para el paso CONFIRMAR_CITA
            { number: 1, emoji: '✅', text: 'Confirmar', action: 'sendMessage', actionValue: 'CITA_CONFIRMADA', step: 'CONFIRMAR_CITA' },
            { number: 2, emoji: '🕒', text: 'Cambiar hora', action: 'goToStep', actionValue: 'SELECCIONAR_HORA', step: 'CONFIRMAR_CITA' },
            { number: 3, emoji: '📅', text: 'Cambiar fecha', action: 'goToStep', actionValue: 'SELECCIONAR_FECHA', step: 'CONFIRMAR_CITA' },
            { number: 4, emoji: '❌', text: 'Cancelar', action: 'goToStep', actionValue: 'INITIAL', step: 'CONFIRMAR_CITA' },

            // Opciones para el paso CANCELAR_CITA
            { number: 1, emoji: '1️⃣', text: 'Cita #1', action: 'sendMessage', actionValue: 'CONFIRMAR_CANCELACION_1', step: 'CANCELAR_CITA' },
            { number: 2, emoji: '2️⃣', text: 'Cita #2', action: 'sendMessage', actionValue: 'CONFIRMAR_CANCELACION_2', step: 'CANCELAR_CITA' },
            { number: 3, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'CANCELAR_CITA' },

            // Opciones para el paso REPROGRAMAR_CITA
            { number: 1, emoji: '1️⃣', text: 'Cita #1', action: 'goToStep', actionValue: 'SELECCIONAR_FECHA', step: 'REPROGRAMAR_CITA' },
            { number: 2, emoji: '2️⃣', text: 'Cita #2', action: 'goToStep', actionValue: 'SELECCIONAR_FECHA', step: 'REPROGRAMAR_CITA' },
            { number: 3, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'REPROGRAMAR_CITA' }
        ],
        messages: {
            welcome: '📅 *Gestión de Citas*\n\n¡Bienvenido al sistema de gestión de citas! ¿Qué deseas hacer hoy?',
            VER_CITAS: '📋 *Tus Próximas Citas*\n\n${citas}\n\nSelecciona una cita para más opciones:',
            sinCitas: '📭 No tienes citas programadas actualmente.',
            AGENDAR_CITA: '🗓️ *Agendar Nueva Cita*\n\nPor favor, selecciona el tipo de cita:',
            SELECCIONAR_ESPECIALISTA: '👨‍⚕️ *Selecciona un Especialista*\n\n${especialistas}',
            SELECCIONAR_FECHA: '📆 *Selecciona una Fecha*\n\nFechas disponibles para ${especialista}:',
            SELECCIONAR_HORA: '⏰ *Selecciona una Hora*\n\nHorarios disponibles para el ${fecha}:',
            CONFIRMAR_CITA: '📝 *Confirma tu Cita*\n\nEspecialista: ${especialista}\nFecha: ${fecha}\nHora: ${hora}\nTipo: ${tipoCita}\n\n¿Deseas confirmar esta cita?',
            CITA_CONFIRMADA: '✅ *¡Cita Confirmada!*\n\nTu cita ha sido agendada exitosamente.\n\nEspecialista: ${especialista}\nFecha: ${fecha}\nHora: ${hora}\nCódigo de Cita: ${codigoCita}\n\nHemos enviado un recordatorio a tu correo electrónico.',
            CANCELAR_CITA: '❌ *Cancelar Cita*\n\nSelecciona la cita que deseas cancelar:',
            CONFIRMAR_CANCELACION_1: '⚠️ ¿Estás seguro de cancelar la siguiente cita?\n\nEspecialista: Dr. García\nFecha: 15/06/2025\nHora: 10:00',
            CONFIRMAR_CANCELACION_2: '⚠️ ¿Estás seguro de cancelar la siguiente cita?\n\nEspecialista: Dra. Rodríguez\nFecha: 20/06/2025\nHora: 11:30',
            citaCancelada: '🚫 *Cita Cancelada*\n\nTu cita ha sido cancelada exitosamente. Si deseas reagendarla, puedes hacerlo desde el menú principal.',
            REPROGRAMAR_CITA: '🔄 *Reprogramar Cita*\n\nSelecciona la cita que deseas reprogramar:',
            HISTORIAL_CITAS: '📜 *Historial de Citas*\n\n${historial}',
            DETALLE_CITA_1: '📋 *Detalle de Cita #1*\n\nEspecialista: Dr. García\nFecha: 15/06/2025\nHora: 10:00\nTipo: Consulta general\nEstado: Confirmada\n\n¿Qué deseas hacer con esta cita?',
            DETALLE_CITA_2: '📋 *Detalle de Cita #2*\n\nEspecialista: Dra. Rodríguez\nFecha: 20/06/2025\nHora: 11:30\nTipo: Revisión\nEstado: Pendiente\n\n¿Qué deseas hacer con esta cita?'
        }
    },

    ordenesServicio: {
        name: 'ORDENES_SERVICIO',
        description: 'Sistema para gestionar órdenes de servicio técnico',
        steps: ['INITIAL', 'NUEVA_ORDEN', 'TIPO_SERVICIO', 'DESCRIPCION_PROBLEMA', 'DATOS_CONTACTO', 'CONFIRMAR_ORDEN', 'CONSULTAR_ESTADO', 'CALIFICAR_SERVICIO'],
        options: [
            // Opciones para el paso INITIAL
            { number: 1, emoji: '🔧', text: 'Nueva Orden', action: 'goToStep', actionValue: 'NUEVA_ORDEN', step: 'INITIAL' },
            { number: 2, emoji: '🔍', text: 'Consultar Estado', action: 'goToStep', actionValue: 'CONSULTAR_ESTADO', step: 'INITIAL' },
            { number: 3, emoji: '📋', text: 'Mis Órdenes', action: 'sendMessage', actionValue: 'MIS_ORDENES', step: 'INITIAL' },
            { number: 4, emoji: '⭐', text: 'Calificar Servicio', action: 'goToStep', actionValue: 'CALIFICAR_SERVICIO', step: 'INITIAL' },
            { number: 5, emoji: '🔔', text: 'Notificaciones', action: 'sendMessage', actionValue: 'NOTIFICACIONES', step: 'INITIAL' },
            { number: 6, emoji: '⬅️', text: 'Regresar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para el paso NUEVA_ORDEN
            { number: 1, emoji: '🔧', text: 'Reparación', action: 'goToStep', actionValue: 'TIPO_SERVICIO', step: 'NUEVA_ORDEN' },
            { number: 2, emoji: '🔌', text: 'Instalación', action: 'goToStep', actionValue: 'TIPO_SERVICIO', step: 'NUEVA_ORDEN' },
            { number: 3, emoji: '🧹', text: 'Mantenimiento', action: 'goToStep', actionValue: 'TIPO_SERVICIO', step: 'NUEVA_ORDEN' },
            { number: 4, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'NUEVA_ORDEN' },

            // Opciones para el paso TIPO_SERVICIO
            { number: 1, emoji: '🖥️', text: 'Computadora', action: 'goToStep', actionValue: 'DESCRIPCION_PROBLEMA', step: 'TIPO_SERVICIO' },
            { number: 2, emoji: '📱', text: 'Dispositivo Móvil', action: 'goToStep', actionValue: 'DESCRIPCION_PROBLEMA', step: 'TIPO_SERVICIO' },
            { number: 3, emoji: '🏠', text: 'Electrodoméstico', action: 'goToStep', actionValue: 'DESCRIPCION_PROBLEMA', step: 'TIPO_SERVICIO' },
            { number: 4, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'NUEVA_ORDEN', step: 'TIPO_SERVICIO' },

            // DESCRIPCION_PROBLEMA - Espera entrada de texto

            // Opciones para el paso DATOS_CONTACTO
            // Espera entradas de texto secuenciales

            // Opciones para el paso CONFIRMAR_ORDEN
            { number: 1, emoji: '✅', text: 'Confirmar', action: 'sendMessage', actionValue: 'ORDEN_CONFIRMADA', step: 'CONFIRMAR_ORDEN' },
            { number: 2, emoji: '✏️', text: 'Editar datos', action: 'goToStep', actionValue: 'DATOS_CONTACTO', step: 'CONFIRMAR_ORDEN' },
            { number: 3, emoji: '❌', text: 'Cancelar', action: 'goToStep', actionValue: 'INITIAL', step: 'CONFIRMAR_ORDEN' },

            // Opciones para el paso CONSULTAR_ESTADO
            // Primero espera que el usuario introduzca número de orden
            { number: 1, emoji: '🔄', text: 'Actualizar estado', action: 'sendMessage', actionValue: 'ACTUALIZAR_ESTADO', step: 'CONSULTAR_ESTADO' },
            { number: 2, emoji: '📞', text: 'Contactar técnico', action: 'sendMessage', actionValue: 'CONTACTAR_TECNICO', step: 'CONSULTAR_ESTADO' },
            { number: 3, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'CONSULTAR_ESTADO' },

            // Opciones para el paso CALIFICAR_SERVICIO
            { number: 1, emoji: '⭐', text: '1 Estrella', action: 'sendMessage', actionValue: 'CALIFICAR_1', step: 'CALIFICAR_SERVICIO' },
            { number: 2, emoji: '⭐⭐', text: '2 Estrellas', action: 'sendMessage', actionValue: 'CALIFICAR_2', step: 'CALIFICAR_SERVICIO' },
            { number: 3, emoji: '⭐⭐⭐', text: '3 Estrellas', action: 'sendMessage', actionValue: 'CALIFICAR_3', step: 'CALIFICAR_SERVICIO' },
            { number: 4, emoji: '⭐⭐⭐⭐', text: '4 Estrellas', action: 'sendMessage', actionValue: 'CALIFICAR_4', step: 'CALIFICAR_SERVICIO' },
            { number: 5, emoji: '⭐⭐⭐⭐⭐', text: '5 Estrellas', action: 'sendMessage', actionValue: 'CALIFICAR_5', step: 'CALIFICAR_SERVICIO' },
            { number: 6, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'CALIFICAR_SERVICIO' }
        ],
        messages: {
            welcome: '🔧 *Gestión de Órdenes de Servicio*\n\n¡Bienvenido al sistema de órdenes de servicio técnico! ¿Qué deseas hacer hoy?',
            NUEVA_ORDEN: '📝 *Nueva Orden de Servicio*\n\nPor favor, selecciona el tipo de servicio que necesitas:',
            TIPO_SERVICIO: '🔧 *Tipos de Servicio*\n\n${tiposServicio}\n\nSelecciona el tipo de servicio:',
            DESCRIPCION_PROBLEMA: '📋 Por favor, describe detalladamente el problema que estás experimentando:',
            DATOS_CONTACTO: '📞 Necesitamos algunos datos para contactarte.\n\nPor favor, proporciona tu nombre completo:',
            direccion: 'Gracias, ${nombre}. Ahora, proporciona la dirección donde se realizará el servicio:',
            telefono: 'Perfecto. Por último, proporciona un número telefónico de contacto:',
            CONFIRMAR_ORDEN: '📋 *Resumen de tu Orden*\n\nTipo de Servicio: ${tipoServicio}\nProblema: ${descripcion}\nNombre: ${nombre}\nDirección: ${direccion}\nTeléfono: ${telefono}\n\n¿Los datos son correctos?',
            ORDEN_CONFIRMADA: '✅ *¡Orden Creada Exitosamente!*\n\nTu número de orden es: #${numeroOrden}\n\nUn técnico se pondrá en contacto contigo en las próximas 24 horas para coordinar la visita.\n\nPuedes consultar el estado de tu orden en cualquier momento desde el menú principal.',
            CONSULTAR_ESTADO: '🔍 *Consultar Estado de Orden*\n\nPor favor, ingresa el número de orden que deseas consultar:',
            estadoOrden: '📋 *Estado de Orden #${numeroOrden}*\n\nEstado: ${estado}\nFecha de Creación: ${fechaCreacion}\nTécnico Asignado: ${tecnico}\nFecha Estimada: ${fechaEstimada}\n\nÚltima Actualización: ${ultimaActualizacion}\n\nNotas: ${notas}',
            CALIFICAR_SERVICIO: '⭐ *Calificar Servicio*\n\nPor favor, selecciona la orden que deseas calificar:',
            formularioCalificacion: '📊 *Calificación de Servicio*\n\nOrden: #${numeroOrden}\nTécnico: ${tecnico}\n\nPor favor, califica del 1 al 5 (siendo 5 excelente) los siguientes aspectos:',
            calificacionExitosa: '✅ *¡Gracias por tu Calificación!*\n\nTu opinión es muy importante para nosotros y nos ayuda a mejorar nuestros servicios.',
            MIS_ORDENES: '📋 *Mis Órdenes de Servicio*\n\n${ordenes}\n\nSelecciona una orden para ver detalles:',
            NOTIFICACIONES: '🔔 *Notificaciones*\n\n${notificaciones}',
            ACTUALIZAR_ESTADO: '🔄 Consultando la última actualización de tu orden...',
            CONTACTAR_TECNICO: '📞 Enviando solicitud de contacto al técnico asignado...',
            CALIFICAR_1: '⭐ Has calificado con 1 estrella. ¿Podrías decirnos qué aspectos podríamos mejorar?',
            CALIFICAR_2: '⭐⭐ Has calificado con 2 estrellas. ¿Podrías decirnos qué aspectos podríamos mejorar?',
            CALIFICAR_3: '⭐⭐⭐ Has calificado con 3 estrellas. Gracias por tu valoración.',
            CALIFICAR_4: '⭐⭐⭐⭐ Has calificado con 4 estrellas. ¡Gracias por tu valoración positiva!',
            CALIFICAR_5: '⭐⭐⭐⭐⭐ ¡Has calificado con 5 estrellas! Muchas gracias por tu valoración excelente.'
        }
    },

    // Continuación final de las plantillas de flujos con la propiedad step agregada

    campañasPromo: {
        name: 'CAMPANAS_PROMOCIONALES',
        description: 'Sistema para gestionar campañas promocionales',
        steps: ['INITIAL', 'VER_PROMOCIONES', 'DETALLE_PROMOCION', 'APLICAR_CUPON', 'COMPARTIR_PROMOCION', 'SUSCRIPCION'],
        options: [
            // Opciones para el paso INITIAL
            { number: 1, emoji: '🏷️', text: 'Promociones Activas', action: 'goToStep', actionValue: 'VER_PROMOCIONES', step: 'INITIAL' },
            { number: 2, emoji: '🎟️', text: 'Aplicar Cupón', action: 'goToStep', actionValue: 'APLICAR_CUPON', step: 'INITIAL' },
            { number: 3, emoji: '🔔', text: 'Suscribirme a Ofertas', action: 'goToStep', actionValue: 'SUSCRIPCION', step: 'INITIAL' },
            { number: 4, emoji: '📱', text: 'Compartir Promoción', action: 'goToStep', actionValue: 'COMPARTIR_PROMOCION', step: 'INITIAL' },
            { number: 5, emoji: '🎁', text: 'Mis Cupones', action: 'sendMessage', actionValue: 'MIS_CUPONES', step: 'INITIAL' },
            { number: 6, emoji: '⬅️', text: 'Regresar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para el paso VER_PROMOCIONES
            { number: 1, emoji: '🎁', text: 'Promoción 1', action: 'goToStep', actionValue: 'DETALLE_PROMOCION', step: 'VER_PROMOCIONES' },
            { number: 2, emoji: '🎁', text: 'Promoción 2', action: 'goToStep', actionValue: 'DETALLE_PROMOCION', step: 'VER_PROMOCIONES' },
            { number: 3, emoji: '🎁', text: 'Promoción 3', action: 'goToStep', actionValue: 'DETALLE_PROMOCION', step: 'VER_PROMOCIONES' },
            { number: 4, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'VER_PROMOCIONES' },

            // Opciones para el paso DETALLE_PROMOCION
            { number: 1, emoji: '✅', text: 'Aplicar ahora', action: 'sendMessage', actionValue: 'APLICAR_PROMOCION', step: 'DETALLE_PROMOCION' },
            { number: 2, emoji: '📱', text: 'Compartir', action: 'goToStep', actionValue: 'COMPARTIR_PROMOCION', step: 'DETALLE_PROMOCION' },
            { number: 3, emoji: '⬅️', text: 'Volver a promociones', action: 'goToStep', actionValue: 'VER_PROMOCIONES', step: 'DETALLE_PROMOCION' },

            // APLICAR_CUPON - Espera entrada de texto
            { number: 1, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'APLICAR_CUPON' },

            // Opciones para el paso COMPARTIR_PROMOCION
            { number: 1, emoji: '📱', text: 'WhatsApp', action: 'sendMessage', actionValue: 'COMPARTIR_WHATSAPP', step: 'COMPARTIR_PROMOCION' },
            { number: 2, emoji: '📧', text: 'Email', action: 'sendMessage', actionValue: 'COMPARTIR_EMAIL', step: 'COMPARTIR_PROMOCION' },
            { number: 3, emoji: '🔗', text: 'Copiar enlace', action: 'sendMessage', actionValue: 'COMPARTIR_ENLACE', step: 'COMPARTIR_PROMOCION' },
            { number: 4, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'COMPARTIR_PROMOCION' },

            // SUSCRIPCION - Espera entrada de texto (email)
            { number: 1, emoji: '⬅️', text: 'Cancelar', action: 'goToStep', actionValue: 'INITIAL', step: 'SUSCRIPCION' }
        ],
        messages: {
            welcome: '🏷️ *Campañas Promocionales*\n\n¡Descubre todas nuestras promociones y ofertas especiales!',
            VER_PROMOCIONES: '🎁 *Promociones Activas*\n\n${promociones}\n\nSelecciona una promoción para ver detalles:',
            DETALLE_PROMOCION: '📋 *${nombrePromocion}*\n\nDescripción: ${descripcion}\nDescuento: ${descuento}\nVigencia: ${vigencia}\nCódigo: ${codigo}\n\n${restricciones}\n\n¿Deseas aplicar esta promoción ahora?',
            APLICAR_CUPON: '🎟️ *Aplicar Cupón*\n\nIngresa el código de cupón que deseas aplicar:',
            cuponAplicado: '✅ *¡Cupón Aplicado Exitosamente!*\n\nCupón: ${codigo}\nDescuento: ${descuento}\n\nEl descuento se aplicará automáticamente en tu próxima compra.',
            cuponInvalido: '❌ El cupón ingresado no es válido o ha expirado. Por favor, verifica el código e intenta nuevamente.',
            COMPARTIR_PROMOCION: '📱 *Compartir Promoción*\n\nSelecciona cómo deseas compartir esta promoción:',
            APLICAR_PROMOCION: '✅ ¡Promoción aplicada exitosamente! El descuento se verá reflejado en tu próxima compra.',
            COMPARTIR_WHATSAPP: '📱 Compartiendo por WhatsApp...',
            COMPARTIR_EMAIL: '📧 Ingresa el email al que deseas enviar esta promoción:',
            COMPARTIR_ENLACE: '🔗 Link copiado al portapapeles. ¡Compártelo con quien quieras!',
            SUSCRIPCION: '🔔 *Suscripción a Promociones*\n\nPara recibir notificaciones sobre nuevas promociones, proporciona tu correo electrónico:',
            confirmacionSuscripcion: '✅ *¡Suscripción Exitosa!*\n\nAhora recibirás notificaciones sobre nuestras mejores ofertas y promociones exclusivas.\n\nPuedes cancelar tu suscripción en cualquier momento.',
            MIS_CUPONES: '🎟️ *Mis Cupones*\n\n${cupones}\n\nSelecciona un cupón para aplicarlo:'
        }
    },

    gestionReclamaciones: {
        name: 'GESTION_RECLAMACIONES',
        description: 'Sistema para gestionar quejas y reclamaciones',
        steps: ['INITIAL', 'TIPO_RECLAMACION', 'DATOS_PEDIDO', 'DESCRIPCION_PROBLEMA', 'EVIDENCIAS', 'CONFIRMAR_RECLAMACION', 'SEGUIMIENTO'],
        options: [
            // Opciones para el paso INITIAL
            { number: 1, emoji: '📝', text: 'Nueva Reclamación', action: 'goToStep', actionValue: 'TIPO_RECLAMACION', step: 'INITIAL' },
            { number: 2, emoji: '🔍', text: 'Seguimiento', action: 'goToStep', actionValue: 'SEGUIMIENTO', step: 'INITIAL' },
            { number: 3, emoji: '📋', text: 'Mis Reclamaciones', action: 'sendMessage', actionValue: 'MIS_RECLAMACIONES', step: 'INITIAL' },
            { number: 4, emoji: '❓', text: 'Preguntas Frecuentes', action: 'sendMessage', actionValue: 'FAQ_RECLAMACIONES', step: 'INITIAL' },
            { number: 5, emoji: '👨‍💼', text: 'Hablar con Agente', action: 'sendMessage', actionValue: 'HABLAR_AGENTE', step: 'INITIAL' },
            { number: 6, emoji: '⬅️', text: 'Regresar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para el paso TIPO_RECLAMACION
            { number: 1, emoji: '📦', text: 'Producto defectuoso', action: 'goToStep', actionValue: 'DATOS_PEDIDO', step: 'TIPO_RECLAMACION' },
            { number: 2, emoji: '🚚', text: 'Problema de entrega', action: 'goToStep', actionValue: 'DATOS_PEDIDO', step: 'TIPO_RECLAMACION' },
            { number: 3, emoji: '💰', text: 'Cobro incorrecto', action: 'goToStep', actionValue: 'DATOS_PEDIDO', step: 'TIPO_RECLAMACION' },
            { number: 4, emoji: '👨‍💼', text: 'Mala atención', action: 'goToStep', actionValue: 'DATOS_PEDIDO', step: 'TIPO_RECLAMACION' },
            { number: 5, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'TIPO_RECLAMACION' },

            // DATOS_PEDIDO - Espera entrada de texto

            // DESCRIPCION_PROBLEMA - Espera entrada de texto

            // EVIDENCIAS - Espera imágenes o mensaje "continuar"

            // Opciones para el paso CONFIRMAR_RECLAMACION
            { number: 1, emoji: '✅', text: 'Confirmar', action: 'sendMessage', actionValue: 'RECLAMACION_CONFIRMADA', step: 'CONFIRMAR_RECLAMACION' },
            { number: 2, emoji: '✏️', text: 'Editar descripción', action: 'goToStep', actionValue: 'DESCRIPCION_PROBLEMA', step: 'CONFIRMAR_RECLAMACION' },
            { number: 3, emoji: '❌', text: 'Cancelar', action: 'goToStep', actionValue: 'INITIAL', step: 'CONFIRMAR_RECLAMACION' },

            // SEGUIMIENTO - Espera entrada de texto (número de caso)
            { number: 1, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'SEGUIMIENTO' }
        ],
        messages: {
            welcome: '📢 *Gestión de Reclamaciones*\n\n¡Bienvenido al sistema de gestión de quejas y reclamaciones! Tu opinión es importante para nosotros.',
            TIPO_RECLAMACION: '📋 *Tipo de Reclamación*\n\nPor favor, selecciona el tipo de reclamación:',
            DATOS_PEDIDO: '🔍 *Datos del Pedido*\n\nPor favor, proporciona el número de pedido o factura relacionado con tu reclamación:',
            DESCRIPCION_PROBLEMA: '📝 Por favor, describe detalladamente el problema o situación que deseas reportar:',
            EVIDENCIAS: '📷 *Evidencias*\n\nSi tienes fotos o documentos que respalden tu reclamación, por favor envíalos ahora.\n\nSi no tienes evidencias, escribe "continuar".',
            CONFIRMAR_RECLAMACION: '📋 *Resumen de Reclamación*\n\nTipo: ${tipoReclamacion}\nNúmero de Pedido: ${numeroPedido}\nDescripción: ${descripcion}\nEvidencias: ${evidencias}\n\n¿Los datos son correctos?',
            RECLAMACION_CONFIRMADA: '✅ *¡Reclamación Registrada!*\n\nTu número de caso es: #${numeroCaso}\n\nUn representante revisará tu caso y te contactará en un plazo máximo de 48 horas hábiles.\n\nPuedes dar seguimiento a tu reclamación desde el menú principal.',
            SEGUIMIENTO: '🔍 *Seguimiento de Reclamación*\n\nPor favor, ingresa el número de caso que deseas consultar:',
            estadoReclamacion: '📋 *Estado de Caso #${numeroCaso}*\n\nEstado: ${estado}\nFecha de Creación: ${fechaCreacion}\nAgente Asignado: ${agente}\nÚltima Actualización: ${ultimaActualizacion}\n\nComentarios: ${comentarios}',
            MIS_RECLAMACIONES: '📋 *Mis Reclamaciones*\n\n${reclamaciones}\n\nSelecciona una reclamación para ver detalles:',
            FAQ_RECLAMACIONES: '❓ *Preguntas Frecuentes - Reclamaciones*\n\n1️⃣ ¿Cuál es el tiempo de respuesta para mi reclamación?\nNormalmente revisamos y respondemos a las reclamaciones en un plazo de 24-48 horas hábiles.\n\n2️⃣ ¿Qué debo hacer si no recibo respuesta?\nSi han pasado más de 48 horas hábiles, puedes contactar directamente con nuestro servicio de atención al cliente.\n\n3️⃣ ¿Cómo puedo cancelar una reclamación?\nPuedes solicitar la cancelación respondiendo al correo de confirmación que recibiste o contactando con atención al cliente.',
            HABLAR_AGENTE: '👨‍💼 Te estamos conectando con un agente especializado en reclamaciones. Por favor, espera un momento.'
        }
    },

    encuestasOpinion: {
        name: 'ENCUESTAS_OPINION',
        description: 'Sistema para realizar encuestas de opinión personalizadas',
        steps: ['INITIAL', 'SELECCIONAR_ENCUESTA', 'INSTRUCCIONES', 'PREGUNTA_1', 'PREGUNTA_2', 'PREGUNTA_3', 'PREGUNTA_4', 'PREGUNTA_5', 'FINALIZAR'],
        options: [
            // Opciones para el paso INITIAL
            { number: 1, emoji: '📋', text: 'Encuestas Disponibles', action: 'goToStep', actionValue: 'SELECCIONAR_ENCUESTA', step: 'INITIAL' },
            { number: 2, emoji: '🏆', text: 'Mis Recompensas', action: 'sendMessage', actionValue: 'MIS_RECOMPENSAS', step: 'INITIAL' },
            { number: 3, emoji: '📊', text: 'Encuestas Completadas', action: 'sendMessage', actionValue: 'ENCUESTAS_COMPLETADAS', step: 'INITIAL' },
            { number: 4, emoji: '❓', text: 'Sobre las Encuestas', action: 'sendMessage', actionValue: 'SOBRE_ENCUESTAS', step: 'INITIAL' },
            { number: 5, emoji: '⬅️', text: 'Regresar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para el paso SELECCIONAR_ENCUESTA
            { number: 1, emoji: '📝', text: 'Encuesta de Satisfacción', action: 'goToStep', actionValue: 'INSTRUCCIONES', step: 'SELECCIONAR_ENCUESTA' },
            { number: 2, emoji: '📝', text: 'Encuesta de Producto', action: 'goToStep', actionValue: 'INSTRUCCIONES', step: 'SELECCIONAR_ENCUESTA' },
            { number: 3, emoji: '📝', text: 'Encuesta de Servicio', action: 'goToStep', actionValue: 'INSTRUCCIONES', step: 'SELECCIONAR_ENCUESTA' },
            { number: 4, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'SELECCIONAR_ENCUESTA' },

            // Opciones para el paso INSTRUCCIONES
            { number: 1, emoji: '▶️', text: 'Comenzar', action: 'goToStep', actionValue: 'PREGUNTA_1', step: 'INSTRUCCIONES' },
            { number: 2, emoji: '❌', text: 'Cancelar', action: 'goToStep', actionValue: 'INITIAL', step: 'INSTRUCCIONES' },

            // Opciones para cada pregunta (usando opciones genéricas)
            // PREGUNTA_1
            { number: 1, emoji: 'A', text: 'Opción A', action: 'goToStep', actionValue: 'PREGUNTA_2', step: 'PREGUNTA_1' },
            { number: 2, emoji: 'B', text: 'Opción B', action: 'goToStep', actionValue: 'PREGUNTA_2', step: 'PREGUNTA_1' },
            { number: 3, emoji: 'C', text: 'Opción C', action: 'goToStep', actionValue: 'PREGUNTA_2', step: 'PREGUNTA_1' },
            { number: 4, emoji: 'D', text: 'Opción D', action: 'goToStep', actionValue: 'PREGUNTA_2', step: 'PREGUNTA_1' },

            // PREGUNTA_2
            { number: 1, emoji: 'A', text: 'Opción A', action: 'goToStep', actionValue: 'PREGUNTA_3', step: 'PREGUNTA_2' },
            { number: 2, emoji: 'B', text: 'Opción B', action: 'goToStep', actionValue: 'PREGUNTA_3', step: 'PREGUNTA_2' },
            { number: 3, emoji: 'C', text: 'Opción C', action: 'goToStep', actionValue: 'PREGUNTA_3', step: 'PREGUNTA_2' },
            { number: 4, emoji: 'D', text: 'Opción D', action: 'goToStep', actionValue: 'PREGUNTA_3', step: 'PREGUNTA_2' },

            // PREGUNTA_3
            { number: 1, emoji: 'A', text: 'Opción A', action: 'goToStep', actionValue: 'PREGUNTA_4', step: 'PREGUNTA_3' },
            { number: 2, emoji: 'B', text: 'Opción B', action: 'goToStep', actionValue: 'PREGUNTA_4', step: 'PREGUNTA_3' },
            { number: 3, emoji: 'C', text: 'Opción C', action: 'goToStep', actionValue: 'PREGUNTA_4', step: 'PREGUNTA_3' },
            { number: 4, emoji: 'D', text: 'Opción D', action: 'goToStep', actionValue: 'PREGUNTA_4', step: 'PREGUNTA_3' },

            // PREGUNTA_4
            { number: 1, emoji: 'A', text: 'Opción A', action: 'goToStep', actionValue: 'PREGUNTA_5', step: 'PREGUNTA_4' },
            { number: 2, emoji: 'B', text: 'Opción B', action: 'goToStep', actionValue: 'PREGUNTA_5', step: 'PREGUNTA_4' },
            { number: 3, emoji: 'C', text: 'Opción C', action: 'goToStep', actionValue: 'PREGUNTA_5', step: 'PREGUNTA_4' },
            { number: 4, emoji: 'D', text: 'Opción D', action: 'goToStep', actionValue: 'PREGUNTA_5', step: 'PREGUNTA_4' },

            // PREGUNTA_5
            { number: 1, emoji: 'A', text: 'Opción A', action: 'goToStep', actionValue: 'FINALIZAR', step: 'PREGUNTA_5' },
            { number: 2, emoji: 'B', text: 'Opción B', action: 'goToStep', actionValue: 'FINALIZAR', step: 'PREGUNTA_5' },
            { number: 3, emoji: 'C', text: 'Opción C', action: 'goToStep', actionValue: 'FINALIZAR', step: 'PREGUNTA_5' },
            { number: 4, emoji: 'D', text: 'Opción D', action: 'goToStep', actionValue: 'FINALIZAR', step: 'PREGUNTA_5' },

            // Opciones para el paso FINALIZAR
            { number: 1, emoji: '🏠', text: 'Volver al inicio', action: 'goToStep', actionValue: 'INITIAL', step: 'FINALIZAR' },
            { number: 2, emoji: '📋', text: 'Otra encuesta', action: 'goToStep', actionValue: 'SELECCIONAR_ENCUESTA', step: 'FINALIZAR' }
        ],
        messages: {
            welcome: '📊 *Encuestas de Opinión*\n\n¡Tu opinión es valiosa! Completa encuestas y gana recompensas.',
            SELECCIONAR_ENCUESTA: '📋 *Encuestas Disponibles*\n\n${encuestas}\n\nSelecciona una encuesta para comenzar:',
            INSTRUCCIONES: '📝 *${tituloEncuesta}*\n\nDuración estimada: ${duracion} minutos\nRecompensa: ${recompensa}\n\n${instrucciones}\n\n¿Estás listo para comenzar?',
            PREGUNTA_1: '❓ *Pregunta 1/5*\n\n${pregunta}',
            PREGUNTA_2: '❓ *Pregunta 2/5*\n\n${pregunta}',
            PREGUNTA_3: '❓ *Pregunta 3/5*\n\n${pregunta}',
            PREGUNTA_4: '❓ *Pregunta 4/5*\n\n${pregunta}',
            PREGUNTA_5: '❓ *Pregunta 5/5*\n\n${pregunta}',
            opcionesRespuesta: '📊 Selecciona una opción:\n\n${opciones}',
            respuestaAbierta: '✏️ Por favor, escribe tu respuesta:',
            FINALIZAR: '🎉 *¡Encuesta Completada!*\n\n¡Gracias por completar la encuesta "${tituloEncuesta}"!\n\nHas ganado: ${recompensa}\n\nTus respuestas nos ayudarán a mejorar nuestros productos y servicios.',
            MIS_RECOMPENSAS: '🏆 *Mis Recompensas*\n\nPuntos acumulados: ${puntos}\n\n${recompensas}\n\nSelecciona una recompensa para canjear:',
            ENCUESTAS_COMPLETADAS: '📊 *Encuestas Completadas*\n\n${encuestas}',
            SOBRE_ENCUESTAS: '❓ *Sobre Nuestras Encuestas*\n\nNuestro programa de encuestas te permite ganar puntos y recompensas por compartir tu opinión sobre nuestros productos y servicios.\n\nCada encuesta completada te otorga puntos que puedes canjear por descuentos, productos o servicios exclusivos.\n\nTu privacidad es importante para nosotros: tus respuestas son anónimas y solo se utilizan con fines estadísticos.'
        }
    },

    contactoSoporte: {
        name: 'CONTACTO_SOPORTE',
        description: 'Sistema completo de contacto con soporte técnico',
        steps: ['INITIAL', 'SELECCIONAR_AREA', 'SELECCIONAR_TEMA', 'DESCRIPCION_PROBLEMA', 'METODO_CONTACTO', 'DATOS_CONTACTO', 'CONFIRMAR_SOLICITUD'],
        options: [
            // Opciones para el paso INITIAL / SELECCIONAR_AREA
            { number: 1, emoji: '🔧', text: 'Soporte Técnico', action: 'goToStep', actionValue: 'SELECCIONAR_TEMA', step: 'INITIAL' },
            { number: 2, emoji: '💳', text: 'Facturación', action: 'goToStep', actionValue: 'SELECCIONAR_TEMA', step: 'INITIAL' },
            { number: 3, emoji: '📦', text: 'Pedidos', action: 'goToStep', actionValue: 'SELECCIONAR_TEMA', step: 'INITIAL' },
            { number: 4, emoji: '📱', text: 'App/Sitio Web', action: 'goToStep', actionValue: 'SELECCIONAR_TEMA', step: 'INITIAL' },
            { number: 5, emoji: '👨‍💼', text: 'Chat con Agente', action: 'sendMessage', actionValue: 'CHAT_AGENTE', step: 'INITIAL' },
            { number: 6, emoji: '⬅️', text: 'Regresar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para el paso SELECCIONAR_TEMA (para Soporte Técnico)
            { number: 1, emoji: '💻', text: 'Problemas de software', action: 'goToStep', actionValue: 'DESCRIPCION_PROBLEMA', step: 'SELECCIONAR_TEMA' },
            { number: 2, emoji: '🖨️', text: 'Problemas de hardware', action: 'goToStep', actionValue: 'DESCRIPCION_PROBLEMA', step: 'SELECCIONAR_TEMA' },
            { number: 3, emoji: '🔒', text: 'Problemas de acceso', action: 'goToStep', actionValue: 'DESCRIPCION_PROBLEMA', step: 'SELECCIONAR_TEMA' },
            { number: 4, emoji: '❓', text: 'Otro', action: 'goToStep', actionValue: 'DESCRIPCION_PROBLEMA', step: 'SELECCIONAR_TEMA' },
            { number: 5, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'SELECCIONAR_TEMA' },

            // DESCRIPCION_PROBLEMA - Espera entrada de texto

            // Opciones para el paso METODO_CONTACTO
            { number: 1, emoji: '📞', text: 'Teléfono', action: 'goToStep', actionValue: 'DATOS_CONTACTO', step: 'METODO_CONTACTO' },
            { number: 2, emoji: '📧', text: 'Email', action: 'goToStep', actionValue: 'DATOS_CONTACTO', step: 'METODO_CONTACTO' },
            { number: 3, emoji: '💬', text: 'WhatsApp', action: 'goToStep', actionValue: 'DATOS_CONTACTO', step: 'METODO_CONTACTO' },
            { number: 4, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'DESCRIPCION_PROBLEMA', step: 'METODO_CONTACTO' },

            // DATOS_CONTACTO - Espera entrada de texto

            // Opciones para el paso CONFIRMAR_SOLICITUD
            { number: 1, emoji: '✅', text: 'Confirmar', action: 'sendMessage', actionValue: 'SOLICITUD_CONFIRMADA', step: 'CONFIRMAR_SOLICITUD' },
            { number: 2, emoji: '✏️', text: 'Editar', action: 'goToStep', actionValue: 'DESCRIPCION_PROBLEMA', step: 'CONFIRMAR_SOLICITUD' },
            { number: 3, emoji: '❌', text: 'Cancelar', action: 'goToStep', actionValue: 'INITIAL', step: 'CONFIRMAR_SOLICITUD' }
        ],
        messages: {
            welcome: '🛠️ *Contacto con Soporte*\n\n¡Bienvenido al centro de soporte! ¿En qué área necesitas ayuda?',
            SELECCIONAR_TEMA: '📋 *${area} - Temas Disponibles*\n\nPor favor, selecciona un tema específico:',
            DESCRIPCION_PROBLEMA: '📝 Por favor, describe detalladamente el problema que estás experimentando:',
            METODO_CONTACTO: '📞 *Método de Contacto*\n\n¿Cómo prefieres que te contactemos?',
            DATOS_CONTACTO: '📋 *Datos de Contacto*\n\nPor favor, proporciona tu ${datoSolicitado}:',
            CONFIRMAR_SOLICITUD: '📋 *Resumen de Solicitud*\n\nÁrea: ${area}\nTema: ${tema}\nDescripción: ${descripcion}\nMétodo de contacto: ${metodoContacto}\nDatos: ${datosContacto}\n\n¿Los datos son correctos?',
            SOLICITUD_CONFIRMADA: '✅ *¡Solicitud Registrada!*\n\nTu número de ticket es: #${numeroTicket}\n\nUn agente de soporte se pondrá en contacto contigo a través de ${metodoContacto} en un plazo máximo de ${tiempoRespuesta}.\n\nGracias por tu paciencia.',
            CHAT_AGENTE: '👨‍💼 Te estamos conectando con un agente de soporte. Por favor, espera un momento mientras un agente disponible se une a la conversación.'
        }
    },

    tutorialOnboarding: {
        name: 'TUTORIAL_ONBOARDING',
        description: 'Sistema de tutorial y onboarding para nuevos usuarios',
        steps: ['INITIAL', 'BIENVENIDA', 'PASO_1', 'PASO_2', 'PASO_3', 'PASO_4', 'FINALIZAR'],
        options: [
            // Opciones para el paso INITIAL
            { number: 1, emoji: '▶️', text: 'Iniciar tutorial', action: 'goToStep', actionValue: 'BIENVENIDA', step: 'INITIAL' },
            { number: 2, emoji: '❓', text: 'Preguntas Frecuentes', action: 'sendMessage', actionValue: 'FAQ_TUTORIAL', step: 'INITIAL' },
            { number: 3, emoji: '⬅️', text: 'Regresar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para los pasos del tutorial
            // BIENVENIDA
            { number: 1, emoji: '▶️', text: 'Continuar', action: 'goToStep', actionValue: 'PASO_1', step: 'BIENVENIDA' },
            { number: 2, emoji: '⏩', text: 'Saltar Tutorial', action: 'goToStep', actionValue: 'FINALIZAR', step: 'BIENVENIDA' },

            // PASO_1
            { number: 1, emoji: '▶️', text: 'Continuar', action: 'goToStep', actionValue: 'PASO_2', step: 'PASO_1' },
            { number: 2, emoji: '⏪', text: 'Anterior', action: 'goToStep', actionValue: 'BIENVENIDA', step: 'PASO_1' },
            { number: 3, emoji: '⏩', text: 'Saltar Tutorial', action: 'goToStep', actionValue: 'FINALIZAR', step: 'PASO_1' },

            // PASO_2
            { number: 1, emoji: '▶️', text: 'Continuar', action: 'goToStep', actionValue: 'PASO_3', step: 'PASO_2' },
            { number: 2, emoji: '⏪', text: 'Anterior', action: 'goToStep', actionValue: 'PASO_1', step: 'PASO_2' },
            { number: 3, emoji: '⏩', text: 'Saltar Tutorial', action: 'goToStep', actionValue: 'FINALIZAR', step: 'PASO_2' },

            // PASO_3
            { number: 1, emoji: '▶️', text: 'Continuar', action: 'goToStep', actionValue: 'PASO_4', step: 'PASO_3' },
            { number: 2, emoji: '⏪', text: 'Anterior', action: 'goToStep', actionValue: 'PASO_2', step: 'PASO_3' },
            { number: 3, emoji: '⏩', text: 'Saltar Tutorial', action: 'goToStep', actionValue: 'FINALIZAR', step: 'PASO_3' },

            // PASO_4
            { number: 1, emoji: '▶️', text: 'Continuar', action: 'goToStep', actionValue: 'FINALIZAR', step: 'PASO_4' },
            { number: 2, emoji: '⏪', text: 'Anterior', action: 'goToStep', actionValue: 'PASO_3', step: 'PASO_4' },

            // FINALIZAR
            { number: 1, emoji: '🏠', text: 'Ir al menú principal', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'FINALIZAR' },
            { number: 2, emoji: '📖', text: 'Ver pasos de nuevo', action: 'sendMessage', actionValue: 'VER_PASOS', step: 'FINALIZAR' },
            { number: 3, emoji: '❓', text: 'Preguntas frecuentes', action: 'sendMessage', actionValue: 'FAQ_TUTORIAL', step: 'FINALIZAR' }
        ],
        messages: {
            welcome: '👋 *Tutorial y Onboarding*\n\n¡Bienvenido al tutorial para nuevos usuarios! Te guiaremos paso a paso para que conozcas todas las funcionalidades de nuestra plataforma.',
            BIENVENIDA: '🚀 *¡Comencemos!*\n\n${nombreProducto} es una plataforma que te permite ${descripcionBreve}.\n\nEn este tutorial, aprenderás a utilizar todas sus funcionalidades principales.\n\nPulsa "Continuar" para empezar.',
            PASO_1: '1️⃣ *${tituloPaso1}*\n\n${descripcionPaso1}\n\n${imagen1}\n\nPulsa "Continuar" para ir al siguiente paso.',
            PASO_2: '2️⃣ *${tituloPaso2}*\n\n${descripcionPaso2}\n\n${imagen2}\n\nPulsa "Continuar" para ir al siguiente paso.',
            PASO_3: '3️⃣ *${tituloPaso3}*\n\n${descripcionPaso3}\n\n${imagen3}\n\nPulsa "Continuar" para ir al siguiente paso.',
            PASO_4: '4️⃣ *${tituloPaso4}*\n\n${descripcionPaso4}\n\n${imagen4}\n\nPulsa "Continuar" para finalizar el tutorial.',
            FINALIZAR: '🎉 *¡Felicidades!*\n\nHas completado el tutorial de ${nombreProducto}.\n\nAhora estás listo para aprovechar al máximo todas las funcionalidades de nuestra plataforma.\n\n¿Qué deseas hacer ahora?',
            VER_PASOS: '📑 *Índice del Tutorial*\n\n1️⃣ ${tituloPaso1}\n2️⃣ ${tituloPaso2}\n3️⃣ ${tituloPaso3}\n4️⃣ ${tituloPaso4}\n\nSelecciona el paso al que deseas ir:',
            FAQ_TUTORIAL: '❓ *Preguntas Frecuentes*\n\n1️⃣ ¿Puedo volver a ver este tutorial más adelante?\nSí, puedes acceder al tutorial en cualquier momento desde el menú de ayuda.\n\n2️⃣ ¿Hay versiones avanzadas del tutorial?\nSí, contamos con tutoriales avanzados para cada funcionalidad específica.\n\n3️⃣ ¿Cómo puedo obtener más ayuda?\nPuedes contactar a nuestro equipo de soporte a través del chat o correo electrónico.'
        }
    },

    administracionUsuarios: {
        name: 'ADMINISTRACION_USUARIOS',
        description: 'Sistema para administración de usuarios y perfiles',
        steps: ['INITIAL', 'VER_PERFIL', 'EDITAR_PERFIL', 'CAMBIAR_CONTRASEÑA', 'PREFERENCIAS', 'PRIVACIDAD', 'VERIFICACION'],
        options: [
            // Opciones para el paso INITIAL
            { number: 1, emoji: '👤', text: 'Mi Perfil', action: 'goToStep', actionValue: 'VER_PERFIL', step: 'INITIAL' },
            { number: 2, emoji: '✏️', text: 'Editar Perfil', action: 'goToStep', actionValue: 'EDITAR_PERFIL', step: 'INITIAL' },
            { number: 3, emoji: '🔐', text: 'Cambiar Contraseña', action: 'goToStep', actionValue: 'CAMBIAR_CONTRASEÑA', step: 'INITIAL' },
            { number: 4, emoji: '⚙️', text: 'Preferencias', action: 'goToStep', actionValue: 'PREFERENCIAS', step: 'INITIAL' },
            { number: 5, emoji: '🔒', text: 'Privacidad', action: 'goToStep', actionValue: 'PRIVACIDAD', step: 'INITIAL' },
            { number: 6, emoji: '⬅️', text: 'Regresar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para el paso VER_PERFIL
            { number: 1, emoji: '✏️', text: 'Editar perfil', action: 'goToStep', actionValue: 'EDITAR_PERFIL', step: 'VER_PERFIL' },
            { number: 2, emoji: '🔐', text: 'Verificar cuenta', action: 'goToStep', actionValue: 'VERIFICACION', step: 'VER_PERFIL' },
            { number: 3, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'VER_PERFIL' },

            // Opciones para el paso EDITAR_PERFIL
            { number: 1, emoji: '👤', text: 'Cambiar nombre', action: 'sendMessage', actionValue: 'EDITAR_NOMBRE', step: 'EDITAR_PERFIL' },
            { number: 2, emoji: '📧', text: 'Cambiar email', action: 'sendMessage', actionValue: 'EDITAR_EMAIL', step: 'EDITAR_PERFIL' },
            { number: 3, emoji: '📱', text: 'Cambiar teléfono', action: 'sendMessage', actionValue: 'EDITAR_TELEFONO', step: 'EDITAR_PERFIL' },
            { number: 4, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'EDITAR_PERFIL' },

            // Opciones para el paso CAMBIAR_CONTRASEÑA
            // Espera entradas secuenciales de texto
            { number: 1, emoji: '⬅️', text: 'Cancelar', action: 'goToStep', actionValue: 'INITIAL', step: 'CAMBIAR_CONTRASEÑA' },

            // Opciones para el paso PREFERENCIAS
            { number: 1, emoji: '📧', text: 'Notificaciones email', action: 'sendMessage', actionValue: 'TOGGLE_EMAIL', step: 'PREFERENCIAS' },
            { number: 2, emoji: '🔔', text: 'Notificaciones push', action: 'sendMessage', actionValue: 'TOGGLE_PUSH', step: 'PREFERENCIAS' },
            { number: 3, emoji: '🌐', text: 'Cambiar idioma', action: 'sendMessage', actionValue: 'CAMBIAR_IDIOMA', step: 'PREFERENCIAS' },
            { number: 4, emoji: '⏰', text: 'Zona horaria', action: 'sendMessage', actionValue: 'CAMBIAR_ZONA', step: 'PREFERENCIAS' },
            { number: 5, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'PREFERENCIAS' },

            // Opciones para el paso PRIVACIDAD
            { number: 1, emoji: '👁️', text: 'Visibilidad de perfil', action: 'sendMessage', actionValue: 'CAMBIAR_VISIBILIDAD', step: 'PRIVACIDAD' },
            { number: 2, emoji: '📊', text: 'Compartir datos', action: 'sendMessage', actionValue: 'TOGGLE_COMPARTIR', step: 'PRIVACIDAD' },
            { number: 3, emoji: '📜', text: 'Historial', action: 'sendMessage', actionValue: 'TOGGLE_HISTORIAL', step: 'PRIVACIDAD' },
            { number: 4, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'PRIVACIDAD' },

            // Opciones para el paso VERIFICACION
            { number: 1, emoji: '📧', text: 'Email', action: 'sendMessage', actionValue: 'VERIFICAR_EMAIL', step: 'VERIFICACION' },
            { number: 2, emoji: '📱', text: 'SMS', action: 'sendMessage', actionValue: 'VERIFICAR_SMS', step: 'VERIFICACION' },
            { number: 3, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'VERIFICACION' }
        ],
        messages: {
            welcome: '👤 *Administración de Usuario*\n\n¡Bienvenido al centro de administración de tu perfil! ¿Qué deseas hacer hoy?',
            VER_PERFIL: '📋 *Tu Perfil*\n\nNombre: ${nombre}\nEmail: ${email}\nTeléfono: ${telefono}\nFecha de registro: ${fechaRegistro}\nÚltimo acceso: ${ultimoAcceso}\n\nEstado de verificación: ${estadoVerificacion}',
            EDITAR_PERFIL: '✏️ *Editar Perfil*\n\nSelecciona el campo que deseas modificar:',
            EDITAR_NOMBRE: '📝 Por favor, ingresa tu nuevo nombre:',
            EDITAR_EMAIL: '📝 Por favor, ingresa tu nuevo email:',
            EDITAR_TELEFONO: '📝 Por favor, ingresa tu nuevo número telefónico:',
            confirmarEdicion: '⚠️ ¿Estás seguro de cambiar tu ${campo} de "${valorAnterior}" a "${valorNuevo}"?',
            edicionExitosa: '✅ *¡Cambio Exitoso!*\n\nTu ${campo} ha sido actualizado correctamente.',
            CAMBIAR_CONTRASEÑA: '🔐 *Cambiar Contraseña*\n\nPor favor, ingresa tu contraseña actual:',
            nuevaContraseña: 'Ahora, ingresa tu nueva contraseña:',
            confirmarContraseña: 'Por favor, confirma tu nueva contraseña:',
            contraseñaCambiada: '✅ *¡Contraseña Actualizada!*\n\nTu contraseña ha sido cambiada exitosamente. Por seguridad, deberás iniciar sesión nuevamente en todos tus dispositivos.',
            PREFERENCIAS: '⚙️ *Preferencias*\n\nNotificaciones por email: ${notificacionesEmail}\nNotificaciones push: ${notificacionesPush}\nIdioma: ${idioma}\nZona horaria: ${zonaHoraria}\n\nSelecciona una opción para modificar:',
            TOGGLE_EMAIL: '✅ Notificaciones por email ${estado}.',
            TOGGLE_PUSH: '✅ Notificaciones push ${estado}.',
            CAMBIAR_IDIOMA: '🌐 Selecciona tu idioma preferido:',
            CAMBIAR_ZONA: '⏰ Selecciona tu zona horaria:',
            cambioPreferencia: '✅ Preferencia de ${preferencia} actualizada a "${valor}".',
            PRIVACIDAD: '🔒 *Configuración de Privacidad*\n\nVisibilidad de perfil: ${visibilidadPerfil}\nCompartir datos para mejoras: ${compartirDatos}\nHistorial de actividad: ${historialActividad}\n\nSelecciona una opción para modificar:',
            CAMBIAR_VISIBILIDAD: '👁️ Selecciona la visibilidad de tu perfil:',
            TOGGLE_COMPARTIR: '📊 Compartir datos para mejoras ${estado}.',
            TOGGLE_HISTORIAL: '📜 Historial de actividad ${estado}.',
            VERIFICACION: '🔐 *Verificación de Cuenta*\n\nEstado actual: ${estadoVerificacion}\n\nSelecciona el método de verificación:',
            VERIFICAR_EMAIL: '📧 Enviando código de verificación a tu email...',
            VERIFICAR_SMS: '📱 Enviando código de verificación a tu teléfono por SMS...'
        }
    },

    planificadorEventos: {
        name: 'PLANIFICADOR_EVENTOS',
        description: 'Sistema para planificación y gestión de eventos',
        steps: ['INITIAL', 'CREAR_EVENTO', 'TIPO_EVENTO', 'DETALLES_EVENTO', 'INVITADOS', 'CONFIRMACION', 'MIS_EVENTOS', 'DETALLES_EVENTO_CREADO'],
        options: [
            // Opciones para el paso INITIAL
            { number: 1, emoji: '➕', text: 'Crear Evento', action: 'goToStep', actionValue: 'CREAR_EVENTO', step: 'INITIAL' },
            { number: 2, emoji: '📅', text: 'Mis Eventos', action: 'goToStep', actionValue: 'MIS_EVENTOS', step: 'INITIAL' },
            { number: 3, emoji: '📨', text: 'Invitaciones', action: 'sendMessage', actionValue: 'MIS_INVITACIONES', step: 'INITIAL' },
            { number: 4, emoji: '🔍', text: 'Buscar Evento', action: 'sendMessage', actionValue: 'BUSCAR_EVENTO', step: 'INITIAL' },
            { number: 5, emoji: '📝', text: 'Plantillas', action: 'sendMessage', actionValue: 'PLANTILLAS_EVENTO', step: 'INITIAL' },
            { number: 6, emoji: '⬅️', text: 'Regresar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL', step: 'INITIAL' },

            // Opciones para el paso CREAR_EVENTO
            { number: 1, emoji: '🎂', text: 'Fiesta', action: 'goToStep', actionValue: 'TIPO_EVENTO', step: 'CREAR_EVENTO' },
            { number: 2, emoji: '👔', text: 'Reunión', action: 'goToStep', actionValue: 'TIPO_EVENTO', step: 'CREAR_EVENTO' },
            { number: 3, emoji: '🏆', text: 'Evento Deportivo', action: 'goToStep', actionValue: 'TIPO_EVENTO', step: 'CREAR_EVENTO' },
            { number: 4, emoji: '🎭', text: 'Evento Cultural', action: 'goToStep', actionValue: 'TIPO_EVENTO', step: 'CREAR_EVENTO' },
            { number: 5, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'CREAR_EVENTO' },

            // Opciones para el paso TIPO_EVENTO
            // Este paso mostrará opciones específicas según el tipo seleccionado
            { number: 1, emoji: '▶️', text: 'Continuar', action: 'goToStep', actionValue: 'DETALLES_EVENTO', step: 'TIPO_EVENTO' },
            { number: 2, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'CREAR_EVENTO', step: 'TIPO_EVENTO' },

            // DETALLES_EVENTO - Espera entradas secuenciales de texto

            // Opciones para el paso INVITADOS
            { number: 1, emoji: '✅', text: 'Sí', action: 'sendMessage', actionValue: 'AGREGAR_INVITADOS', step: 'INVITADOS' },
            { number: 2, emoji: '❌', text: 'No', action: 'goToStep', actionValue: 'CONFIRMACION', step: 'INVITADOS' },

            // Opciones para el paso CONFIRMACION
            { number: 1, emoji: '✅', text: 'Confirmar', action: 'sendMessage', actionValue: 'EVENTO_CREADO', step: 'CONFIRMACION' },
            { number: 2, emoji: '✏️', text: 'Editar detalles', action: 'goToStep', actionValue: 'DETALLES_EVENTO', step: 'CONFIRMACION' },
            { number: 3, emoji: '👥', text: 'Editar invitados', action: 'goToStep', actionValue: 'INVITADOS', step: 'CONFIRMACION' },
            { number: 4, emoji: '❌', text: 'Cancelar', action: 'goToStep', actionValue: 'INITIAL', step: 'CONFIRMACION' },

            // Opciones para el paso MIS_EVENTOS
            { number: 1, emoji: '📅', text: 'Evento 1', action: 'goToStep', actionValue: 'DETALLES_EVENTO_CREADO', step: 'MIS_EVENTOS' },
            { number: 2, emoji: '📅', text: 'Evento 2', action: 'goToStep', actionValue: 'DETALLES_EVENTO_CREADO', step: 'MIS_EVENTOS' },
            { number: 3, emoji: '➕', text: 'Crear nuevo evento', action: 'goToStep', actionValue: 'CREAR_EVENTO', step: 'MIS_EVENTOS' },
            { number: 4, emoji: '⬅️', text: 'Volver', action: 'goToStep', actionValue: 'INITIAL', step: 'MIS_EVENTOS' },

            // Opciones para el paso DETALLES_EVENTO_CREADO
            { number: 1, emoji: '✏️', text: 'Editar evento', action: 'goToStep', actionValue: 'DETALLES_EVENTO', step: 'DETALLES_EVENTO_CREADO' },
            { number: 2, emoji: '📨', text: 'Invitar más personas', action: 'sendMessage', actionValue: 'INVITAR_MAS', step: 'DETALLES_EVENTO_CREADO' },
            { number: 3, emoji: '❌', text: 'Cancelar evento', action: 'sendMessage', actionValue: 'CANCELAR_EVENTO', step: 'DETALLES_EVENTO_CREADO' },
            { number: 4, emoji: '⬅️', text: 'Volver a mis eventos', action: 'goToStep', actionValue: 'MIS_EVENTOS', step: 'DETALLES_EVENTO_CREADO' }
        ],
        messages: {
            welcome: '📅 *Planificador de Eventos*\n\n¡Bienvenido al sistema de planificación y gestión de eventos! ¿Qué deseas hacer hoy?',
            CREAR_EVENTO: '➕ *Crear Nuevo Evento*\n\nPor favor, selecciona el tipo de evento:',
            TIPO_EVENTO: '📋 *Tipos de Eventos*\n\n${tiposEvento}\n\nSelecciona el tipo de evento:',
            DETALLES_EVENTO: '📝 *Detalles del Evento*\n\nPor favor, proporciona el nombre del evento:',
            fechaEvento: 'Ahora, indica la fecha del evento (DD/MM/AAAA):',
            horaEvento: 'Indica la hora de inicio del evento (HH:MM):',
            duracionEvento: 'Indica la duración aproximada del evento (en horas):',
            ubicacionEvento: 'Indica la ubicación del evento:',
            descripcionEvento: 'Por último, proporciona una breve descripción del evento:',
            INVITADOS: '👥 *Invitados*\n\n¿Deseas agregar invitados a tu evento?',
            AGREGAR_INVITADOS: 'Por favor, proporciona los correos electrónicos de los invitados (separados por coma):',
            CONFIRMACION: '📋 *Resumen del Evento*\n\nNombre: ${nombreEvento}\nTipo: ${tipoEvento}\nFecha: ${fechaEvento}\nHora: ${horaEvento}\nDuración: ${duracionEvento} horas\nUbicación: ${ubicacionEvento}\nDescripción: ${descripcionEvento}\nInvitados: ${cantidadInvitados}\n\n¿Los datos son correctos?',
            EVENTO_CREADO: '✅ *¡Evento Creado Exitosamente!*\n\nTu evento "${nombreEvento}" ha sido creado y las invitaciones han sido enviadas a los invitados.\n\nCódigo del evento: ${codigoEvento}\n\nPuedes gestionar tu evento desde "Mis Eventos" en el menú principal.',
            MIS_EVENTOS: '📅 *Mis Eventos*\n\n${eventos}\n\nSelecciona un evento para ver detalles:',
            DETALLES_EVENTO_CREADO: '📋 *${nombreEvento}*\n\nFecha: ${fechaEvento}\nHora: ${horaEvento}\nUbicación: ${ubicacionEvento}\nDescripción: ${descripcionEvento}\n\nInvitados: ${invitados}\n\nConfirmados: ${confirmados}/${totalInvitados}',
            MIS_INVITACIONES: '📨 *Mis Invitaciones*\n\n${invitaciones}\n\nSelecciona una invitación para responder:',
            BUSCAR_EVENTO: '🔍 Por favor, ingresa el código o nombre del evento que deseas buscar:',
            PLANTILLAS_EVENTO: '📝 *Plantillas de Eventos*\n\n${plantillas}\n\nSelecciona una plantilla para crear un evento rápidamente:',
            INVITAR_MAS: 'Por favor, proporciona los correos electrónicos de las personas adicionales que deseas invitar (separados por coma):',
            CANCELAR_EVENTO: '⚠️ ¿Estás seguro de que deseas cancelar este evento? Esta acción no se puede deshacer.'
        }
    },

};
