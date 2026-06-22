from flask import Blueprint, jsonify
from sqlalchemy import func
from models import db, Ticket, TicketHistory, User
from services.auth_service import admin_requerido
from datetime import datetime, timedelta, timezone

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.route("/resumen", methods=["GET"])
@admin_requerido
def resumen():
    total_tickets = Ticket.query.count()
    abiertos = Ticket.query.filter_by(estado="abierto").count()
    en_progreso = Ticket.query.filter_by(estado="en_progreso").count()
    resueltos = Ticket.query.filter_by(estado="resuelto").count()
    total_usuarios = User.query.count()

    return jsonify({
        "total_tickets": total_tickets,
        "abiertos": abiertos,
        "en_progreso": en_progreso,
        "resueltos": resueltos,
        "total_usuarios": total_usuarios,
    })


@dashboard_bp.route("/por-area", methods=["GET"])
@admin_requerido
def por_area():
    resultados = (
        db.session.query(Ticket.area_origen, func.count(Ticket.id))
        .group_by(Ticket.area_origen)
        .all()
    )
    return jsonify({"areas": {area: count for area, count in resultados}})


@dashboard_bp.route("/por-estado", methods=["GET"])
@admin_requerido
def por_estado():
    resultados = (
        db.session.query(Ticket.estado, func.count(Ticket.id))
        .group_by(Ticket.estado)
        .all()
    )
    return jsonify({"estados": {estado: count for estado, count in resultados}})


@dashboard_bp.route("/tickets-ultimos-7-dias", methods=["GET"])
@admin_requerido
def tickets_ultimos_7_dias():
    hace_7_dias = datetime.now(timezone.utc) - timedelta(days=7)
    resultados = (
        db.session.query(
            func.date(Ticket.creado_en), func.count(Ticket.id)
        )
        .filter(Ticket.creado_en >= hace_7_dias)
        .group_by(func.date(Ticket.creado_en))
        .order_by(func.date(Ticket.creado_en))
        .all()
    )
    return jsonify({"por_dia": {str(fecha): count for fecha, count in resultados}})


@dashboard_bp.route("/tiempo-medio-resolucion", methods=["GET"])
@admin_requerido
def tiempo_medio_resolucion():
    tickets_resueltos = (
        Ticket.query.filter(Ticket.estado.in_(["resuelto", "cerrado"]))
        .all()
    )
    tiempos = []
    for t in tickets_resueltos:
        for h in t.historial:
            if h.cambio == "cambio_estado" and h.comentario and "resuelto" in h.comentario.lower():
                creado = t.creado_en
                resuelto = h.creado_en
                if creado and resuelto:
                    diff_horas = (resuelto - creado).total_seconds() / 3600
                    tiempos.append(diff_horas)
                break

    promedio = sum(tiempos) / len(tiempos) if tiempos else 0
    return jsonify({
        "tiempo_medio_horas": round(promedio, 2),
        "tickets_resueltos": len(tiempos),
    })
