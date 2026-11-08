
from datetime import date
from decimal import Decimal
import unicodedata

from flask import (
    Blueprint,
    jsonify,
    request,
    current_app,
    flash,
    get_flashed_messages
)

from mysql.connector import Error

from db import obtener_conexion
from precios import calcular_precio_pizza


ventas_bp = Blueprint(
    "ventas",
    __name__,
    url_prefix="/api/pizzeria/ventas"
)


DIAS = [
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
    "domingo"
]

NOMBRES_DIAS = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo"
]

MESES = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre"
]

NOMBRES_MESES = [
    nombre.capitalize() for nombre in MESES
]


def normalizar(texto):
    if not isinstance(texto, str):
        return ""

    texto = unicodedata.normalize(
        "NFD",
        texto.strip().lower()
    )

    return "".join(
        letra for letra in texto
        if unicodedata.category(letra) != "Mn"
    )


def preparar_venta(venta):
    venta["fecha_pedido"] = venta[
        "fecha_pedido"
    ].isoformat()

    venta["total"] = float(venta["total"])

    return venta


def cerrar_conexion(cursor, conexion):
    if cursor is not None:
        cursor.close()

    if conexion is not None and conexion.is_connected():
        conexion.close()


# ==========================================
# 1. CONSULTAR TODAS LAS VENTAS
# ==========================================

@ventas_bp.route("", methods=["GET"])
def obtener_ventas():

    conexion = None
    cursor = None

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                idventa,
                nombre_cliente,
                direccion,
                telefono,
                fecha_pedido,
                total
            FROM ventas
            ORDER BY idventa DESC
        """)

        ventas = [
            preparar_venta(venta)
            for venta in cursor.fetchall()
        ]

        return jsonify({
            "exito": True,
            "ventas": ventas
        }), 200

    except Error:
        current_app.logger.exception(
            "Error al consultar ventas"
        )

        return jsonify({
            "exito": False,
            "mensaje": "No se pudieron consultar las ventas"
        }), 500

    finally:
        cerrar_conexion(cursor, conexion)


# ==========================================
# 2. REGISTRAR PEDIDO
# ==========================================

@ventas_bp.route("", methods=["POST"])
def registrar_venta():

    datos = request.get_json(silent=True)

    if not isinstance(datos, dict):
        return jsonify({
            "exito": False,
            "mensaje": "Debes enviar datos JSON"
        }), 400

    # Validar datos del cliente
    limites = {
        "nombre_cliente": 120,
        "direccion": 255,
        "telefono": 25
    }

    cliente = {}

    for campo, limite in limites.items():

        valor = datos.get(campo)

        if not isinstance(valor, str) or not valor.strip():
            return jsonify({
                "exito": False,
                "mensaje": f"El campo {campo} es obligatorio"
            }), 400

        valor = valor.strip()

        if len(valor) > limite:
            return jsonify({
                "exito": False,
                "mensaje": f"El campo {campo} es demasiado largo"
            }), 400

        cliente[campo] = valor

    # Validar fecha
    try:
        fecha_pedido = date.fromisoformat(
            datos.get("fecha_pedido", "")
        )
    except (TypeError, ValueError):
        return jsonify({
            "exito": False,
            "mensaje": "La fecha debe tener formato AAAA-MM-DD"
        }), 400

    # Validar pizzas
    pizzas = datos.get("pizzas")

    if not isinstance(pizzas, list) or not pizzas:
        return jsonify({
            "exito": False,
            "mensaje": "Agrega al menos una pizza"
        }), 400

    detalles = []

    try:
        for pizza in pizzas:

            if not isinstance(pizza, dict):
                raise ValueError(
                    "Los datos de una pizza son incorrectos"
                )

            detalle = calcular_precio_pizza(
                pizza.get("tamano"),
                pizza.get("ingredientes", []),
                pizza.get("cantidad")
            )

            detalles.append(detalle)

    except ValueError as error:
        return jsonify({
            "exito": False,
            "mensaje": str(error)
        }), 400

    # Recalcular total desde Flask
    total = sum(
        detalle["subtotal"]
        for detalle in detalles
    )

    conexion = None
    cursor = None

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        # Guardar venta principal
        cursor.execute("""
            INSERT INTO ventas (
                nombre_cliente,
                direccion,
                telefono,
                fecha_pedido,
                total
            )
            VALUES (%s, %s, %s, %s, %s)
        """, (
            cliente["nombre_cliente"],
            cliente["direccion"],
            cliente["telefono"],
            fecha_pedido,
            total
        ))

        idventa = cursor.lastrowid

        # Guardar pizzas de la venta
        for detalle in detalles:

            ingredientes_texto = ", ".join(
                detalle["ingredientes"]
            )

            cursor.execute("""
                INSERT INTO detalle_ventas (
                    idventa,
                    tamano,
                    ingredientes,
                    cantidad,
                    precio_unitario,
                    subtotal
                )
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                idventa,
                detalle["tamano"],
                ingredientes_texto,
                detalle["cantidad"],
                detalle["precio_unitario"],
                detalle["subtotal"]
            ))

        conexion.commit()

        # Mensaje Flash requerido por el examen
        flash(
            f"Pedido #{idventa} registrado correctamente. "
            f"Total a pagar: ${total:.2f}",
            "success"
        )

        mensajes_flash = get_flashed_messages(
            with_categories=True
        )

        mensaje = mensajes_flash[-1][1]

        return jsonify({
            "exito": True,
            "mensaje": mensaje,
            "idventa": idventa,
            "total": total,
            "detalle": detalles
        }), 201

    except Error:
        if conexion is not None and conexion.is_connected():
            conexion.rollback()

        current_app.logger.exception(
            "Error al registrar el pedido"
        )

        return jsonify({
            "exito": False,
            "mensaje": "No se pudo guardar el pedido"
        }), 500

    finally:
        cerrar_conexion(cursor, conexion)


# ==========================================
# 3. REPORTES AGRUPADOS POR DIA O MES
# ==========================================

@ventas_bp.route("/reportes", methods=["GET"])
def obtener_reportes():

    tipo = request.args.get(
        "tipo", "dia"
    ).strip().lower()

    if tipo not in ("dia", "mes"):
        return jsonify({
            "exito": False,
            "mensaje": "El tipo debe ser dia o mes"
        }), 400

    conexion = None
    cursor = None

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        if tipo == "dia":

            cursor.execute("""
                SELECT
                    WEEKDAY(fecha_pedido) AS numero,
                    COUNT(*) AS cantidad_pedidos,
                    SUM(total) AS total_ventas
                FROM ventas
                GROUP BY WEEKDAY(fecha_pedido)
                ORDER BY numero
            """)

        else:

            cursor.execute("""
                SELECT
                    MONTH(fecha_pedido) AS numero,
                    COUNT(*) AS cantidad_pedidos,
                    SUM(total) AS total_ventas
                FROM ventas
                GROUP BY MONTH(fecha_pedido)
                ORDER BY numero
            """)

        resultados = cursor.fetchall()
        reportes = []

        for fila in resultados:

            numero = int(fila["numero"])

            nombre = (
                NOMBRES_DIAS[numero]
                if tipo == "dia"
                else NOMBRES_MESES[numero - 1]
            )

            reportes.append({
                "nombre": nombre,
                "cantidad_pedidos": int(
                    fila["cantidad_pedidos"]
                ),
                "total_ventas": float(
                    fila["total_ventas"]
                )
            })

        return jsonify({
            "exito": True,
            "tipo": tipo,
            "reportes": reportes
        }), 200

    except Error:
        current_app.logger.exception(
            "Error al consultar reportes"
        )

        return jsonify({
            "exito": False,
            "mensaje": "No se pudieron consultar los reportes"
        }), 500

    finally:
        cerrar_conexion(cursor, conexion)


# ==========================================
# 4. BUSCAR VENTAS POR DIA O MES ESPECIFICO
# ==========================================

@ventas_bp.route("/reportes/consulta", methods=["GET"])
def consultar_periodo():

    tipo = request.args.get(
        "tipo", "dia"
    ).strip().lower()

    nombre = normalizar(
        request.args.get("nombre", "")
    )

    if tipo == "dia":

        if nombre not in DIAS:
            return jsonify({
                "exito": False,
                "mensaje": "Selecciona un día válido"
            }), 400

        numero = DIAS.index(nombre)

        condicion = "WEEKDAY(fecha_pedido) = %s"

        nombre_mostrar = NOMBRES_DIAS[numero]

    elif tipo == "mes":

        if nombre not in MESES:
            return jsonify({
                "exito": False,
                "mensaje": "Selecciona un mes válido"
            }), 400

        numero = MESES.index(nombre) + 1

        condicion = "MONTH(fecha_pedido) = %s"

        nombre_mostrar = NOMBRES_MESES[numero - 1]

    else:
        return jsonify({
            "exito": False,
            "mensaje": "El tipo debe ser dia o mes"
        }), 400

    conexion = None
    cursor = None

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        # La condición proviene de opciones fijas,
        # nunca de texto SQL introducido por el usuario.
        consulta = f"""
            SELECT
                idventa,
                nombre_cliente,
                direccion,
                telefono,
                fecha_pedido,
                total
            FROM ventas
            WHERE {condicion}
            ORDER BY fecha_pedido DESC, idventa DESC
        """

        cursor.execute(consulta, (numero,))

        ventas = cursor.fetchall()

        total_acumulado = sum(
            (
                venta["total"]
                for venta in ventas
            ),
            Decimal("0.00")
        )

        ventas = [
            preparar_venta(venta)
            for venta in ventas
        ]

        return jsonify({
            "exito": True,
            "tipo": tipo,
            "nombre": nombre_mostrar,
            "cantidad_pedidos": len(ventas),
            "total_acumulado": float(total_acumulado),
            "ventas": ventas
        }), 200

    except Error:
        current_app.logger.exception(
            "Error al consultar ventas por periodo"
        )

        return jsonify({
            "exito": False,
            "mensaje": "No se pudo realizar la consulta"
        }), 500

    finally:
        cerrar_conexion(cursor, conexion)


# ==========================================
# 5. CONSULTAR DETALLES DE UNA VENTA
# ==========================================

@ventas_bp.route("/<int:idventa>", methods=["GET"])
def obtener_detalle_venta(idventa):

    conexion = None
    cursor = None

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                idventa,
                nombre_cliente,
                direccion,
                telefono,
                fecha_pedido,
                total
            FROM ventas
            WHERE idventa = %s
        """, (idventa,))

        venta = cursor.fetchone()

        if venta is None:
            return jsonify({
                "exito": False,
                "mensaje": "No se encontró la venta"
            }), 404

        cursor.execute("""
            SELECT
                iddetalle,
                idventa,
                tamano,
                ingredientes,
                cantidad,
                precio_unitario,
                subtotal
            FROM detalle_ventas
            WHERE idventa = %s
            ORDER BY iddetalle
        """, (idventa,))

        detalles = cursor.fetchall()

        preparar_venta(venta)

        for detalle in detalles:

            detalle["precio_unitario"] = float(
                detalle["precio_unitario"]
            )

            detalle["subtotal"] = float(
                detalle["subtotal"]
            )

        return jsonify({
            "exito": True,
            "venta": venta,
            "detalles": detalles
        }), 200

    except Error:
        current_app.logger.exception(
            "Error al consultar detalle de venta"
        )

        return jsonify({
            "exito": False,
            "mensaje": "No se pudo consultar el detalle"
        }), 500

    finally:
        cerrar_conexion(cursor, conexion)
