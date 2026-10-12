# backend/tests/integration/test_imports.py
"""Pruebas de integración del módulo de importación (CSV/XLSX)."""

from __future__ import annotations

CSV_CONTENT = (
    "nombres,apellidos,dpi,nit,correo,telefono\n"
    "Juan,Pérez,1234567890101,12345678-9,juan.perez@example.local,55551234\n"
    "Ana,López,1234567890102,87654321-0,ana.lopez@example.local,55555678\n"
).encode()

MAPPING = {
    "nombres": "nombres",
    "apellidos": "apellidos",
    "dpi": "dpi",
    "nit": "nit",
    "correo": "correo",
    "telefono": "telefono",
}


def upload(
    client,
    headers,
    content=CSV_CONTENT,
    filename="clientes.csv",
    mime="text/csv",
    target_module="clients",
):
    return client.post(
        "/api/v1/imports",
        files={"file": (filename, content, mime)},
        params={"target_module": target_module},
        headers=headers,
    )


class TestImportUpload:
    def test_upload_csv_creates_job(self, client, auth):
        response = upload(client, auth["notario"])
        assert response.status_code == 201, response.text
        body = response.json()
        assert body["file_type"] == "CSV"
        assert body["status"] == "PENDIENTE"
        assert body["target_module"] == "clients"

    def test_upload_rejects_extension(self, client, auth):
        response = upload(
            client, auth["notario"], content=b"contenido", filename="notas.txt", mime="text/plain"
        )
        assert response.status_code == 400

    def test_upload_rejects_empty_file(self, client, auth):
        response = upload(client, auth["notario"], content=b"")
        assert response.status_code == 400

    def test_upload_requires_permission(self, client, auth):
        # ADMINISTRACION no tiene documents.create.
        response = upload(client, auth["adminfin"])
        assert response.status_code == 403


class TestImportFlow:
    def _job(self, client, auth) -> dict:
        return upload(client, auth["notario"]).json()

    def test_preview_detects_columns(self, client, auth):
        job = self._job(client, auth)
        response = client.post(f"/api/v1/imports/{job['id']}/preview", headers=auth["notario"])
        assert response.status_code == 200, response.text
        body = response.json()
        assert set(body["columns"]) == {"nombres", "apellidos", "dpi", "nit", "correo", "telefono"}
        assert len(body["preview_rows"]) == 2

    def test_process_and_rows(self, client, auth):
        job = self._job(client, auth)
        response = client.post(
            f"/api/v1/imports/{job['id']}/process",
            json={"mapping": MAPPING},
            headers=auth["notario"],
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["total_rows"] == 2
        assert body["valid_rows"] == 2
        assert body["error_rows"] == 0
        assert body["status"] == "REVISANDO"

        rows = client.get(f"/api/v1/imports/{job['id']}/rows", headers=auth["notario"]).json()
        assert len(rows) == 2
        assert all(row["status"] == "OK" for row in rows)
        assert rows[0]["mapped_data"]["nombres"] == "Juan"

    def test_process_marks_invalid_rows(self, client, auth):
        content = ("nombres,apellidos\nJuan,Pérez\n,López\n").encode()
        job = upload(client, auth["notario"], content=content).json()
        response = client.post(
            f"/api/v1/imports/{job['id']}/process",
            json={"mapping": {"nombres": "nombres", "apellidos": "apellidos"}},
            headers=auth["notario"],
        )
        assert response.status_code == 200
        body = response.json()
        assert body["valid_rows"] == 1
        assert body["error_rows"] == 1

        rows = client.get(f"/api/v1/imports/{job['id']}/rows", headers=auth["notario"]).json()
        invalid = next(r for r in rows if r["status"] == "ERROR")
        assert invalid["errors"][0]["tipo_error"] == "REQUIRED"

    def test_confirm_persists_clients(self, client, db, auth):
        job = self._job(client, auth)
        client.post(
            f"/api/v1/imports/{job['id']}/process",
            json={"mapping": MAPPING},
            headers=auth["notario"],
        )
        response = client.post(f"/api/v1/imports/{job['id']}/confirm", headers=auth["notario"])
        assert response.status_code == 200, response.text
        assert response.json()["status"] == "COMPLETADO"

        from app.models.client import Client, Person

        assert db.query(Client).count() == 2
        person = db.query(Person).filter(Person.nombres == "Juan").first()
        assert person is not None
        assert person.dpi == "1234567890101"

    def test_confirm_before_process_is_rejected(self, client, auth):
        job = self._job(client, auth)
        response = client.post(f"/api/v1/imports/{job['id']}/confirm", headers=auth["notario"])
        assert response.status_code == 400

    def test_list_imports(self, client, auth):
        self._job(client, auth)
        response = client.get("/api/v1/imports", headers=auth["notario"])
        assert response.status_code == 200
        assert len(response.json()) >= 1

    def test_get_not_found(self, client, auth):
        assert client.get("/api/v1/imports/nope", headers=auth["notario"]).status_code == 404
