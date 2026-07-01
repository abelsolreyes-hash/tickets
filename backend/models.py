from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    rol = db.Column(db.String(20), nullable=False, default="user")  # user | admin
    area = db.Column(db.String(100), nullable=False, default="General")
    creado_en = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    tickets = db.relationship("Ticket", backref="usuario", lazy=True, foreign_keys="Ticket.usuario_id")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "email": self.email,
            "rol": self.rol,
            "area": self.area,
            "creado_en": self.creado_en.isoformat() if self.creado_en else None,
        }


class Ticket(db.Model):
    __tablename__ = "tickets"

    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    estado = db.Column(
        db.String(20), nullable=False, default="abierto"
    )  # abierto | en_progreso | resuelto | cerrado
    solicitante_nombre = db.Column(db.String(200), nullable=False)
    area_origen = db.Column(db.String(100), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    asignado_a = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    creado_en = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    actualizado_en = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    historial = db.relationship("TicketHistory", backref="ticket", lazy=True)
    asignado = db.relationship(
        "User", foreign_keys=[asignado_a], lazy=True, overlaps="tickets,usuario"
    )

    def to_dict(self):
        asig = self.asignado
        return {
            "id": self.id,
            "titulo": self.titulo,
            "descripcion": self.descripcion,
            "estado": self.estado,
            "solicitante_nombre": self.solicitante_nombre,
            "area_origen": self.area_origen,
            "usuario_id": self.usuario_id,
            "usuario_nombre": self.usuario.nombre if self.usuario else None,
            "asignado_a": self.asignado_a,
            "asignado_nombre": asig.nombre if asig else None,
            "creado_en": self.creado_en.isoformat() if self.creado_en else None,
            "actualizado_en": self.actualizado_en.isoformat()
            if self.actualizado_en
            else None,
        }


class TicketHistory(db.Model):
    __tablename__ = "ticket_history"

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("tickets.id"), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    cambio = db.Column(db.String(50), nullable=False)  # creado | cambio_estado | comentario
    comentario = db.Column(db.Text, nullable=True)
    creado_en = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    usuario = db.relationship("User", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "ticket_id": self.ticket_id,
            "usuario_id": self.usuario_id,
            "usuario_nombre": self.usuario.nombre if self.usuario else None,
            "cambio": self.cambio,
            "comentario": self.comentario,
            "creado_en": self.creado_en.isoformat() if self.creado_en else None,
        }
