import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Asegurar que backend esté en el path de Python
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from main import app  # noqa: E402

client = TestClient(app)


def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "supabase"


@pytest.mark.parametrize(
    "email,password,expected_role",
    [
        ("admin@it-seobiseu.local", "Admin123!", "ADMINISTRADOR"),
        ("supervisor@it-seobiseu.local", "Supervisor123!", "SUPERVISOR"),
        ("tecnico@it-seobiseu.local", "Tecnico123!", "TECNICO"),
        ("cliente@it-seobiseu.local", "Cliente123!", "CLIENTE"),
    ],
)
def test_login_all_roles(email, password, expected_role):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["correo"] == email
    assert data["user"]["rol"] == expected_role


def test_login_invalid_credentials():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@it-seobiseu.local", "password": "WrongPassword!"},
    )
    assert response.status_code == 401


def test_protected_routes_require_auth():
    response = client.get("/api/v1/clientes")
    assert response.status_code == 401


def test_list_clients_authenticated():
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@it-seobiseu.local", "password": "Admin123!"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/clientes", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3


def test_telemetry_summary_authenticated():
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "supervisor@it-seobiseu.local", "password": "Supervisor123!"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/telemetria/resumen", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "tickets_abiertos" in data
    assert "ordenes_activas" in data
    assert "stock_critico" in data
    assert "clientes_activos" in data
