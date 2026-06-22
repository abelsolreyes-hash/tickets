import jwt
import datetime
from functools import wraps
from flask import request, jsonify, current_app, g
from models import User


def generar_token(usuario):
    expiracion = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
        hours=current_app.config["JWT_EXPIRATION_HOURS"]
    )
    payload = {
        "user_id": usuario.id,
        "email": usuario.email,
        "rol": usuario.rol,
        "exp": expiracion,
    }
    token = jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")
    return token


def token_requerido(f):
    @wraps(f)
    def decorado(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Token requerido"}), 401

        try:
            payload = jwt.decode(
                token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
            )
            g.usuario = User.query.get(payload["user_id"])
            if not g.usuario:
                return jsonify({"error": "Usuario no encontrado"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token invalido"}), 401

        return f(*args, **kwargs)

    return decorado


def admin_requerido(f):
    @wraps(f)
    @token_requerido
    def decorado(*args, **kwargs):
        if g.usuario.rol != "admin":
            return jsonify({"error": "Se requieren permisos de administrador"}), 403
        return f(*args, **kwargs)

    return decorado
