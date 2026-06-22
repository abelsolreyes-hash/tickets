import os
import io
from datetime import datetime, date
from flask import Blueprint, request, send_file
from sqlalchemy import func
from services.auth_service import admin_requerido
from models import db, Ticket
from fpdf import FPDF

reportes_bp = Blueprint("reportes", __name__, url_prefix="/api/reportes")


def _ruta_logo():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ruta = os.path.join(base, "frontend", "src", "img", "logo-odapas.png")
    if os.path.isfile(ruta):
        return ruta
    ruta2 = os.path.join(base, "..", "frontend", "src", "img", "logo-odapas.png")
    if os.path.isfile(ruta2):
        return ruta2
    return None


@reportes_bp.route("/actividad-diaria", methods=["GET"])
@admin_requerido
def actividad_diaria():
    fecha_str = request.args.get("fecha")
    if fecha_str:
        try:
            fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
        except ValueError:
            return {"error": "Formato de fecha invalido. Use YYYY-MM-DD"}, 400
    else:
        fecha = date.today()

    tickets = (
        Ticket.query.filter(db.func.date(Ticket.creado_en) == fecha)
        .order_by(Ticket.creado_en)
        .all()
    )

    total = len(tickets)
    abiertos = sum(1 for t in tickets if t.estado == "abierto")
    en_progreso = sum(1 for t in tickets if t.estado == "en_progreso")
    resueltos = sum(1 for t in tickets if t.estado == "resuelto")
    cerrados = sum(1 for t in tickets if t.estado == "cerrado")

    pdf = FPDF()
    pdf.add_page()

    logo = _ruta_logo()
    if logo:
        pdf.image(logo, x=10, y=8, w=30)

    pdf.set_font("Helvetica", "B", 16)
    pdf.ln(15)
    pdf.cell(0, 10, f"Reporte Diario de Tickets", ln=True, align="C")
    pdf.set_font("Helvetica", "", 12)
    pdf.cell(0, 8, fecha.strftime("%d/%m/%Y"), ln=True, align="C")
    pdf.ln(5)

    pdf.set_font("Helvetica", "B", 11)
    pdf.set_fill_color(37, 99, 235)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(37, 8, "Total", 1, align="C", fill=True)
    pdf.cell(37, 8, "Abiertos", 1, align="C", fill=True)
    pdf.cell(42, 8, "En Progreso", 1, align="C", fill=True)
    pdf.cell(37, 8, "Resueltos", 1, align="C", fill=True)
    pdf.cell(37, 8, "Cerrados", 1, align="C", fill=True)
    pdf.ln()

    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(37, 8, str(total), 1, align="C")
    pdf.cell(37, 8, str(abiertos), 1, align="C")
    pdf.cell(42, 8, str(en_progreso), 1, align="C")
    pdf.cell(37, 8, str(resueltos), 1, align="C")
    pdf.cell(37, 8, str(cerrados), 1, align="C")
    pdf.ln(10)

    if not tickets:
        pdf.set_font("Helvetica", "", 11)
        pdf.cell(0, 10, "No se registraron tickets en esta fecha.", ln=True)
    else:
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_fill_color(37, 99, 235)
        pdf.set_text_color(255, 255, 255)
        col_w = [10, 50, 40, 30, 25, 35]
        headers = ["ID", "Titulo", "Solicitante", "Area", "Estado", "Asignado"]
        for i, h in enumerate(headers):
            pdf.cell(col_w[i], 7, h, 1, align="C", fill=True)
        pdf.ln()

        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(0, 0, 0)
        for t in tickets:
            asignado = t.asignado.nombre if t.asignado else "-"
            estado = t.estado.replace("_", " ")
            pdf.cell(col_w[0], 6, f"#{t.id}", 1, align="C")
            titulo = t.titulo[:48] + "..." if len(t.titulo) > 48 else t.titulo
            pdf.cell(col_w[1], 6, titulo, 1)
            pdf.cell(col_w[2], 6, t.solicitante_nombre[:38] + "..." if len(t.solicitante_nombre) > 38 else t.solicitante_nombre, 1)
            pdf.cell(col_w[3], 6, t.area_origen[:28] + "..." if len(t.area_origen) > 28 else t.area_origen, 1)
            pdf.cell(col_w[4], 6, estado, 1, align="C")
            pdf.cell(col_w[5], 6, asignado[:33] + "..." if len(asignado) > 33 else asignado, 1)
            pdf.ln()

    pdf.ln(5)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(128, 128, 128)
    pdf.cell(0, 5, f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}", ln=True)

    buf = io.BytesIO(bytes(pdf.output(dest="S")))
    buf.seek(0)
    return send_file(
        buf,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"reporte_diario_{fecha}.pdf",
    )
