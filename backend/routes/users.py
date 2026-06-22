from flask import Blueprint, request, jsonify
from models import db, User
from services.auth_service import admin_requerido

users_bp = Blueprint("users", __name__, url_prefix="/api/users")


@users_bp.route("", methods=["GET"])
@admin_requerido
def listar_usuarios():
    usuarios = User.query.order_by(User.nombre).all()
    return jsonify({"usuarios": [u.to_dict() for u in usuarios]})


@users_bp.route("/<int:user_id>", methods=["GET"])
@admin_requerido
def obtener_usuario(user_id):
    usuario = User.query.get_or_404(user_id)
    return jsonify({"usuario": usuario.to_dict()})


@users_bp.route("/<int:user_id>", methods=["PATCH"])
@admin_requerido
def actualizar_usuario(user_id):
    usuario = User.query.get_or_404(user_id)
    data = request.get_json()
    if not data:
        return jsonify({"error": "Datos requeridos"}), 400

    if "nombre" in data:
        usuario.nombre = data["nombre"].strip()
    if "area" in data:
        usuario.area = data["area"].strip()
    if "rol" in data:
        if data["rol"] not in ("user", "admin"):
            return jsonify({"error": "Rol invalido"}), 400
        usuario.rol = data["rol"]
    if "password" in data and data["password"]:
        usuario.set_password(data["password"])

    db.session.commit()
    return jsonify({"usuario": usuario.to_dict()})


@users_bp.route("/<int:user_id>", methods=["DELETE"])
@admin_requerido
def eliminar_usuario(user_id):
    usuario = User.query.get_or_404(user_id)
    if usuario.rol == "admin":
        admins = User.query.filter_by(rol="admin").count()
        if admins <= 1:
            return jsonify({"error": "No puedes eliminar al unico administrador"}), 400
    db.session.delete(usuario)
    db.session.commit()
    return jsonify({"mensaje": "Usuario eliminado"})
