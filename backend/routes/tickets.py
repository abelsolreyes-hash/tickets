from flask import Blueprint, request, jsonify, g, current_app
from models import db, Ticket, TicketHistory, User
from services.auth_service import token_requerido, admin_requerido
from services.email_service import notificar_creacion_ticket, notificar_cambio_estado

tickets_bp = Blueprint("tickets", __name__, url_prefix="/api/tickets")


@tickets_bp.route("", methods=["GET"])
@token_requerido
def listar_tickets():
    pagina = request.args.get("pagina", 1, type=int)
    por_pagina = request.args.get("por_pagina", 20, type=int)
    estado = request.args.get("estado")
    area = request.args.get("area")

    query = Ticket.query

    if g.usuario.rol != "admin":
        query = query.filter_by(area_origen=g.usuario.area)

    if estado:
        query = query.filter_by(estado=estado)
    if area:
        query = query.filter_by(area_origen=area)

    query = query.order_by(Ticket.creado_en.desc())
    tickets = query.paginate(page=pagina, per_page=por_pagina, error_out=False)

    return jsonify({
        "tickets": [t.to_dict() for t in tickets.items],
        "total": tickets.total,
        "pagina": tickets.page,
        "total_paginas": tickets.pages,
    })


@tickets_bp.route("/<int:ticket_id>", methods=["GET"])
@token_requerido
def obtener_ticket(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)

    if g.usuario.rol != "admin" and ticket.area_origen != g.usuario.area:
        return jsonify({"error": "No autorizado"}), 403

    return jsonify({
        "ticket": ticket.to_dict(),
        "historial": [h.to_dict() for h in ticket.historial],
    })


@tickets_bp.route("", methods=["POST"])
@token_requerido
def crear_ticket():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Datos requeridos"}), 400

    titulo = data.get("titulo", "").strip()
    descripcion = data.get("descripcion", "").strip()
    solicitante_nombre = data.get("solicitante_nombre", "").strip()
    if not titulo or not descripcion or not solicitante_nombre:
        return jsonify({"error": "titulo, descripcion y solicitante_nombre son requeridos"}), 400

    area_origen = data.get("area_origen", g.usuario.area).strip()
    if g.usuario.rol != "admin":
        area_origen = g.usuario.area

    ticket = Ticket(
        titulo=titulo,
        descripcion=descripcion,
        solicitante_nombre=solicitante_nombre,
        area_origen=area_origen,
        usuario_id=g.usuario.id,
    )
    db.session.add(ticket)
    db.session.flush()

    historial = TicketHistory(
        ticket_id=ticket.id,
        usuario_id=g.usuario.id,
        cambio="creado",
        comentario="Ticket creado",
    )
    db.session.add(historial)
    db.session.commit()

    mail_config = current_app.config
    notificar_creacion_ticket(ticket, g.usuario, mail_config)

    return jsonify({"ticket": ticket.to_dict()}), 201


@tickets_bp.route("/<int:ticket_id>/estado", methods=["PATCH"])
@admin_requerido
def cambiar_estado(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    data = request.get_json()
    if not data or "estado" not in data:
        return jsonify({"error": "estado requerido"}), 400

    estado_valido = ["abierto", "en_progreso", "resuelto", "cerrado"]
    if data["estado"] not in estado_valido:
        return jsonify({"error": f"Estado invalido. Validos: {', '.join(estado_valido)}"}), 400

    ticket.estado = data["estado"]
    comentario = data.get("comentario", "").strip()

    historial = TicketHistory(
        ticket_id=ticket.id,
        usuario_id=g.usuario.id,
        cambio="cambio_estado",
        comentario=comentario or f"Estado cambiado a: {data['estado']}",
    )
    db.session.add(historial)
    db.session.commit()

    mail_config = current_app.config
    notificar_cambio_estado(ticket, comentario, ticket.usuario, mail_config)

    return jsonify({"ticket": ticket.to_dict()})


@tickets_bp.route("/<int:ticket_id>/asignar", methods=["PATCH"])
@admin_requerido
def asignar_ticket(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    data = request.get_json()
    if not data or "asignado_a" not in data:
        return jsonify({"error": "asignado_a requerido"}), 400

    if data["asignado_a"] is not None:
        tecnico = User.query.get(data["asignado_a"])
        if not tecnico or tecnico.rol != "admin":
            return jsonify({"error": "Tecnico no valido"}), 400

    ticket.asignado_a = data["asignado_a"]

    historial = TicketHistory(
        ticket_id=ticket.id,
        usuario_id=g.usuario.id,
        cambio="asignado",
        comentario=f"Ticket asignado a: {tecnico.nombre if data['asignado_a'] else 'Sin asignar'}",
    )
    db.session.add(historial)
    db.session.commit()

    return jsonify({"ticket": ticket.to_dict()})


@tickets_bp.route("/<int:ticket_id>/comentarios", methods=["POST"])
@token_requerido
def agregar_comentario(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)

    if g.usuario.rol != "admin" and ticket.area_origen != g.usuario.area:
        return jsonify({"error": "No autorizado"}), 403

    data = request.get_json()
    if not data or not data.get("comentario", "").strip():
        return jsonify({"error": "comentario requerido"}), 400

    historial = TicketHistory(
        ticket_id=ticket.id,
        usuario_id=g.usuario.id,
        cambio="comentario",
        comentario=data["comentario"].strip(),
    )
    db.session.add(historial)
    db.session.commit()

    return jsonify({"historial": historial.to_dict()}), 201
