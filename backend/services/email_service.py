import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading


def enviar_email_async(asunto, destino, cuerpo_html, mail_config):
    def _enviar(cfg):
        if not cfg["MAIL_USERNAME"] or not cfg["MAIL_PASSWORD"]:
            return

        msg = MIMEMultipart("alternative")
        msg["Subject"] = asunto
        msg["From"] = cfg["MAIL_FROM"]
        msg["To"] = destino

        parte_html = MIMEText(cuerpo_html, "html")
        msg.attach(parte_html)

        try:
            with smtplib.SMTP(cfg["MAIL_SERVER"], cfg["MAIL_PORT"]) as server:
                server.starttls()
                server.login(cfg["MAIL_USERNAME"], cfg["MAIL_PASSWORD"])
                server.sendmail(cfg["MAIL_FROM"], destino, msg.as_string())
        except Exception as e:
            print(f"Error enviando email a {destino}: {e}")

    hilo = threading.Thread(target=_enviar, args=(mail_config,), daemon=True)
    hilo.start()


def notificar_creacion_ticket(ticket, usuario, mail_config):
    asunto = f"[Ticket #{ticket.id}] {ticket.titulo}"
    cuerpo = f"""
    <h2>Ticket Creado</h2>
    <p><strong>ID:</strong> #{ticket.id}</p>
    <p><strong>Titulo:</strong> {ticket.titulo}</p>
    <p><strong>Descripcion:</strong> {ticket.descripcion}</p>
    <p><strong>Area Origen:</strong> {ticket.area_origen}</p>
    <p><strong>Estado:</strong> {ticket.estado}</p>
    <hr>
    <p>Tu ticket ha sido registrado. Pronto recibiras respuesta del area de Informatica.</p>
    """
    enviar_email_async(asunto, usuario.email, cuerpo, mail_config)


def notificar_cambio_estado(ticket, comentario, usuario, mail_config):
    asunto = f"[Ticket #{ticket.id}] Estado actualizado: {ticket.estado}"
    cuerpo = f"""
    <h2>Actualizacion de Ticket #{ticket.id}</h2>
    <p><strong>Titulo:</strong> {ticket.titulo}</p>
    <p><strong>Nuevo Estado:</strong> {ticket.estado}</p>
    <p><strong>Comentario:</strong> {comentario or "Sin comentario"}</p>
    <hr>
    <p>Puedes revisar el estado de tu ticket en el sistema.</p>
    """
    enviar_email_async(asunto, usuario.email, cuerpo, mail_config)
