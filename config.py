"""Block registry, colours and constants for Viamed newsletter builder."""

COLORS = {
    "cyan": "#00b2e3",
    "dark_blue": "#003a5d",
    "button": "#37474a",
    "dark_block": "#3f4a4f",
    "light_blue": "#d6eff9",
    "grey": "#efefef",
    "text_grey": "#555555",
    "bg": "#f2f2f2",
    "white": "#ffffff",
}

CONTAINER_WIDTH = 600

DEFAULT_FONT = {
    "font_name": "",
    "font_url": "",
}

DEFAULT_HEADER = {
    "preheader_text": "VIAMED AL DÍA · La salud nos conecta",
    "banner_image_url": "https://www.viamedsalud.com/wp-content/uploads/2026/02/banner-1-portada.jpg",
    "banner_alt": "Viamed al Día · La salud nos conecta",
}

DEFAULT_FOOTER = {
    "logo_url": "https://www.viamedsalud.com/wp-content/uploads/2024/05/logo-viamed_newsletter.png",
    "logo_link": "https://www.viamedsalud.com/",
    "social_links": [
        {
            "platform": "youtube",
            "url": "https://www.youtube.com/channel/UCbHkTIBhmd9VlrkSbk0BO3A",
            "icon_url": "https://www.viamedsalud.com/wp-content/uploads/2026/02/youtube-blanco.png",
        },
        {
            "platform": "instagram",
            "url": "https://www.instagram.com/viamedsalud/?hl=es",
            "icon_url": "https://www.viamedsalud.com/wp-content/uploads/2026/02/insta-blanco.png",
        },
        {
            "platform": "tiktok",
            "url": "https://www.tiktok.com/@viamedsalud?lang=es",
            "icon_url": "https://www.viamedsalud.com/wp-content/uploads/2026/02/tiktok-blanco.png",
        },
        {
            "platform": "linkedin",
            "url": "https://www.linkedin.com/company/grupo-viamed-salud",
            "icon_url": "https://www.viamedsalud.com/wp-content/uploads/2026/02/linkedin-blanco.png",
        },
    ],
    "unsubscribe_url": "https://www.viamedsalud.com/politica-de-privacidad/formulario-de-baja/",
    "unsubscribe_pretext": "No responda a este mensaje.",
    "unsubscribe_text": "haz clic aquí",
    "unsubscribe_label": "Para darte de baja de la recepción de esta newsletter",
}

# Each block type: template path, human label, and default data for new blocks
BLOCK_TYPES = {
    "titulo_seccion": {
        "label": "Título de sección",
        "template": "email/blocks/titulo_seccion.html",
        "defaults": {
            "title": "Título de sección",
            "color": COLORS["cyan"],
        },
        "fields": [
            {"name": "title", "label": "Título", "type": "text"},
            {"name": "color", "label": "Color", "type": "color"},
        ],
    },
    "imagen_izq_texto_dcha": {
        "label": "Imagen izquierda + Texto derecha",
        "template": "email/blocks/imagen_izq_texto_dcha.html",
        "defaults": {
            "image_url": "",
            "image_alt": "Noticia",
            "title": "Título de la noticia",
            "description": "Descripción de la noticia.",
            "button_text": "Leer más",
            "button_url": "#",
        },
        "fields": [
            {"name": "image_url", "label": "URL de imagen", "type": "text"},
            {"name": "image_alt", "label": "Alt de imagen", "type": "text"},
            {"name": "title", "label": "Título", "type": "text"},
            {"name": "description", "label": "Descripción", "type": "richtext"},
            {"name": "button_text", "label": "Texto del botón", "type": "text"},
            {"name": "button_url", "label": "URL del botón", "type": "text"},
        ],
    },
    "texto_izq_imagen_dcha": {
        "label": "Texto izquierda + Imagen derecha",
        "template": "email/blocks/texto_izq_imagen_dcha.html",
        "defaults": {
            "image_url": "",
            "image_alt": "Noticia",
            "title": "Título de la noticia",
            "description": "Descripción de la noticia.",
            "button_text": "Leer más",
            "button_url": "#",
        },
        "fields": [
            {"name": "image_url", "label": "URL de imagen", "type": "text"},
            {"name": "image_alt", "label": "Alt de imagen", "type": "text"},
            {"name": "title", "label": "Título", "type": "text"},
            {"name": "description", "label": "Descripción", "type": "richtext"},
            {"name": "button_text", "label": "Texto del botón", "type": "text"},
            {"name": "button_url", "label": "URL del botón", "type": "text"},
        ],
    },
    "grid_2_columnas": {
        "label": "Grid 2 columnas",
        "template": "email/blocks/grid_2_columnas.html",
        "defaults": {
            "card_left_image_url": "",
            "card_left_image_alt": "Card izquierda",
            "card_left_title": "Título card izquierda",
            "card_left_description": "Descripción card izquierda.",
            "card_left_button_text": "Leer más",
            "card_left_button_url": "#",
            "card_right_image_url": "",
            "card_right_image_alt": "Card derecha",
            "card_right_title": "Título card derecha",
            "card_right_description": "Descripción card derecha.",
            "card_right_button_text": "Leer más",
            "card_right_button_url": "#",
        },
        "fields": [
            {"name": "card_left_image_url", "label": "Imagen izquierda URL", "type": "text"},
            {"name": "card_left_image_alt", "label": "Alt imagen izquierda", "type": "text"},
            {"name": "card_left_title", "label": "Título izquierda", "type": "text"},
            {"name": "card_left_description", "label": "Descripción izquierda", "type": "richtext"},
            {"name": "card_left_button_text", "label": "Botón izquierda texto", "type": "text"},
            {"name": "card_left_button_url", "label": "Botón izquierda URL", "type": "text"},
            {"name": "card_right_image_url", "label": "Imagen derecha URL", "type": "text"},
            {"name": "card_right_image_alt", "label": "Alt imagen derecha", "type": "text"},
            {"name": "card_right_title", "label": "Título derecha", "type": "text"},
            {"name": "card_right_description", "label": "Descripción derecha", "type": "richtext"},
            {"name": "card_right_button_text", "label": "Botón derecha texto", "type": "text"},
            {"name": "card_right_button_url", "label": "Botón derecha URL", "type": "text"},
        ],
    },
    "separador_imagen": {
        "label": "Separador (imagen)",
        "template": "email/blocks/separador_imagen.html",
        "defaults": {
            "image_url": "",
            "image_alt": "Separador",
        },
        "fields": [
            {"name": "image_url", "label": "URL de imagen", "type": "text"},
            {"name": "image_alt", "label": "Alt de imagen", "type": "text"},
        ],
    },
    "bloque_grande_oscuro": {
        "label": "Bloque grande oscuro",
        "template": "email/blocks/bloque_grande_oscuro.html",
        "defaults": {
            "image_url": "",
            "image_alt": "Imagen",
            "title": "Título",
            "description": "Descripción",
            "button_text": "Leer más",
            "button_url": "#",
        },
        "fields": [
            {"name": "image_url", "label": "URL de imagen", "type": "text"},
            {"name": "image_alt", "label": "Alt de imagen", "type": "text"},
            {"name": "title", "label": "Título (color cyan)", "type": "text"},
            {"name": "description", "label": "Descripción (color blanco)", "type": "richtext"},
            {"name": "button_text", "label": "Texto del botón", "type": "text"},
            {"name": "button_url", "label": "URL del botón", "type": "text"},
        ],
    },
    "contenedor_celeste": {
        "label": "Contenedor celeste (mini-noticias)",
        "template": "email/blocks/contenedor_celeste.html",
        "defaults": {
            "items": [
                {
                    "text_html": "Texto de la noticia con <strong>negrita</strong>",
                    "image_url": "",
                    "image_alt": "Imagen",
                    "button_text": "Leer más",
                    "button_url": "#",
                }
            ],
        },
        "fields": [
            {
                "name": "items",
                "label": "Mini-noticias",
                "type": "sub_items",
                "item_fields": [
                    {"name": "text_html", "label": "Texto (acepta HTML)", "type": "textarea"},
                    {"name": "image_url", "label": "URL de imagen", "type": "text"},
                    {"name": "image_alt", "label": "Alt de imagen", "type": "text"},
                    {"name": "button_text", "label": "Texto del botón", "type": "text"},
                    {"name": "button_url", "label": "URL del botón", "type": "text"},
                ],
            }
        ],
    },
}

# Ordered list for the UI dropdown
BLOCK_TYPE_ORDER = [
    "titulo_seccion",
    "imagen_izq_texto_dcha",
    "texto_izq_imagen_dcha",
    "grid_2_columnas",
    "separador_imagen",
    "bloque_grande_oscuro",
    "contenedor_celeste",
]
