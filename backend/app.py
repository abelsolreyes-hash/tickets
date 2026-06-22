import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config
from models import db, User
from routes.auth import auth_bp
from routes.tickets import tickets_bp
from routes.users import users_bp
from routes.dashboard import dashboard_bp


def crear_admin_si_no_existe():
    admin = User.query.filter_by(email="admin@sistema.local").first()
    if not admin:
        admin = User(
            nombre="Administrador",
            email="admin@sistema.local",
            rol="admin",
            area="Informatica",
        )
        admin.set_password("admin123")
        db.session.add(admin)
        db.session.commit()
        print("Admin creado: admin@sistema.local / admin123")


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    origins = os.environ.get("CORS_ORIGINS", "http://localhost:5000,http://127.0.0.1:5000").split(",")
    CORS(app, resources={r"/api/*": {"origins": origins}})

    db.init_app(app)

    with app.app_context():
        db.create_all()
        crear_admin_si_no_existe()

    app.register_blueprint(auth_bp)
    app.register_blueprint(tickets_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(dashboard_bp)

    frontend_dist = None
    if getattr(sys, "frozen", False):
        frontend_dist = os.path.join(sys._MEIPASS, "frontend")
    for posible in [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "src"),
        os.path.join(os.getcwd(), "frontend", "src"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend"),
    ]:
        if os.path.isdir(posible):
            frontend_dist = posible
            break
    if frontend_dist and os.path.isdir(frontend_dist):
        @app.route("/", defaults={"path": ""})
        @app.route("/<path:path>")
        def servir_frontend(path):
            if path and os.path.isfile(os.path.join(frontend_dist, path)):
                return send_from_directory(frontend_dist, path)
            return send_from_directory(frontend_dist, "index.html")

    return app


def get_local_ip():
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.1)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    ip = get_local_ip()
    print(f"=== SISTEMA DE TICKETS - INFORMATICA ===")
    print(f"Local:    http://localhost:{port}")
    print(f"Red:      http://{ip}:{port}")
    print(f"==========================================")
    app.run(host="0.0.0.0", port=port, debug=False)
