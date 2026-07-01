from flask import Blueprint, request, jsonify, g
from models import db, User
from services.auth_service import generar_token, token_requerido

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Datos requeridos"}), 400

    email = data.get("email", "").strip().lower()
    if not email or not data.get("password") or not data.get("nombre"):
        return jsonify({"error": "nombre, email y password son requeridos"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "El email ya esta registrado"}), 409

    area = data.get("area", "General").strip()

    usuario = User(
        nombre=data["nombre"].strip(),
        email=email,
        rol=data.get("rol", "user"),
        area=area,
    )
    usuario.set_password(data["password"])
    db.session.add(usuario)
    db.session.commit()

    token = generar_token(usuario)
    return jsonify({"token": token, "usuario": usuario.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Datos requeridos"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    usuario = User.query.filter_by(email=email).first()
    if not usuario or not usuario.check_password(password):
        return jsonify({"error": "Credenciales invalidas"}), 401

    token = generar_token(usuario)
    return jsonify({"token": token, "usuario": usuario.to_dict()})


@auth_bp.route("/me", methods=["GET"])
@token_requerido
def perfil():
    return jsonify({"usuario": g.usuario.to_dict()})
