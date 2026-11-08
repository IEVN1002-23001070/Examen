
import unicodedata


# Precios base de cada tamaño de pizza
PRECIOS_TAMANOS = {
    "chica": 40,
    "mediana": 80,
    "grande": 120
}

# Precio de cada ingrediente adicional
PRECIO_INGREDIENTE = 10

# Ingredientes disponibles
INGREDIENTES_VALIDOS = {
    "jamon": "Jamón",
    "pina": "Piña",
    "champinones": "Champiñones"
}


def normalizar_texto(texto):
    """Convierte el texto a minúsculas y elimina acentos."""
    texto = texto.strip().lower()

    texto = unicodedata.normalize("NFD", texto)

    return "".join(
        letra for letra in texto
        if unicodedata.category(letra) != "Mn"
    )


def calcular_precio_pizza(tamano, ingredientes, cantidad):
    """
    Calcula el precio unitario y subtotal de las pizzas.
    """

    # Validar tamaño
    if not isinstance(tamano, str):
        raise ValueError("El tamaño debe ser un texto.")

    tamano = normalizar_texto(tamano)

    if tamano not in PRECIOS_TAMANOS:
        raise ValueError("Tamaño de pizza no válido.")

    # Validar ingredientes
    if not isinstance(ingredientes, list):
        raise ValueError(
            "Los ingredientes deben enviarse en una lista."
        )

    ingredientes_seleccionados = []
    claves_seleccionadas = set()

    for ingrediente in ingredientes:

        if not isinstance(ingrediente, str):
            raise ValueError("Ingrediente no válido.")

        clave = normalizar_texto(ingrediente)

        if clave not in INGREDIENTES_VALIDOS:
            raise ValueError(
                f"Ingrediente no permitido: {ingrediente}"
            )

        # Evitar cobrar dos veces el mismo ingrediente
        if clave not in claves_seleccionadas:
            claves_seleccionadas.add(clave)
            ingredientes_seleccionados.append(
                INGREDIENTES_VALIDOS[clave]
            )

    # Validar cantidad
    if isinstance(cantidad, bool) or not isinstance(cantidad, int):
        raise ValueError("La cantidad debe ser un número entero.")

    if cantidad <= 0:
        raise ValueError("La cantidad debe ser mayor que cero.")

    # Calcular precios
    precio_base = PRECIOS_TAMANOS[tamano]

    costo_ingredientes = (
        len(ingredientes_seleccionados) * PRECIO_INGREDIENTE
    )

    precio_unitario = precio_base + costo_ingredientes

    subtotal = precio_unitario * cantidad

    return {
        "tamano": tamano,
        "ingredientes": ingredientes_seleccionados,
        "cantidad": cantidad,
        "precio_unitario": precio_unitario,
        "subtotal": subtotal
    }
