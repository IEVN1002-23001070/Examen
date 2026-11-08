
from flask import Flask, jsonify
from flask_cors import CORS
from mysql.connector import Error
from blueprints.ventas.routes import ventas_bp


from config import Config
from db import obtener_conexion



app = Flask(__name__)

app.register_blueprint(ventas_bp)

app.config["SECRET_KEY"] = Config.SECRET_KEY

# Permitir conexiones desde nuestro futuro Angular


CORS(app, resources={
    r"/api/.*": {
        "origins": [
            "http://localhost:4200",
            "http://127.0.0.1:4200",
            "http://localhost:4201",
            "http://127.0.0.1:4201"
        ]
    }
})




@app.route("/api/pizzeria/estado", methods=["GET"])
def estado_pizzeria():

    return jsonify({
        "exito": True,
        "mensaje": "API de la Pizzeria funcionando correctamente"
    })



@app.route("/api/pizzeria/conexion", methods=["GET"])
def probar_conexion():

    conexion = None
    cursor = None

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute("SHOW TABLES")

        tablas = [fila[0] for fila in cursor.fetchall()]

        return jsonify({
            "exito": True,
            "mensaje": "Conexion con MySQL exitosa",
            "base_datos": Config.MYSQL_DATABASE,
            "tablas": tablas
        })

    except Error as error:

        app.logger.error("Error MySQL: %s", error)

        return jsonify({
            "exito": False,
            "mensaje": "No se pudo conectar con MySQL"
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        if conexion is not None and conexion.is_connected():
            conexion.close()


if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5001,
        debug=True
    )
