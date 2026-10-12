# backend/tests/integration/test_measurement.py
"""Pruebas de integración de la medición experimental (tesis)."""

from __future__ import annotations


def create_test_case(db, code="TC-001", expected_errors=2):
    from app.services.measurement_service import MeasurementService

    tc = MeasurementService(db).create_test_case(
        code=code,
        deed_type_code="COMPRAVENTA_INMUEBLE",
        title="Caso sintético de prueba",
        inconsistency_types="DPI_INCONSISTENTE",
        expected_errors=expected_errors,
    )
    db.commit()
    return tc


class TestExperimentalReport:
    def test_report_empty(self, client, auth):
        response = client.get("/api/v1/reports/experimental", headers=auth["notario"])
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["cases_evaluated"] == 0
        assert body["traditional_samples"] == 0
        assert body["system_samples"] == 0
        assert body["reduction_percentage"] is None

    def test_report_requires_permission(self, client, seed_data):
        assert client.get("/api/v1/reports/experimental").status_code == 401


class TestTestCases:
    def test_list_test_cases(self, client, db, auth):
        create_test_case(db, code="TC-100")
        response = client.get("/api/v1/measurements/test-cases", headers=auth["notario"])
        assert response.status_code == 200
        assert any(tc["code"] == "TC-100" for tc in response.json())


class TestExecutions:
    def test_create_execution_with_measurement(self, client, db, auth):
        tc = create_test_case(db)
        response = client.post(
            "/api/v1/measurements/executions",
            json={
                "test_case_id": tc.id,
                "method": "SYSTEM",
                "notes": "Medición de prueba",
                "measurement": {
                    "duration_minutes": 55.0,
                    "errors_found": 2,
                    "errors_missed": 0,
                    "corrections": 2,
                },
            },
            headers=auth["notario"],
        )
        assert response.status_code == 200, response.text
        assert response.json()["method"] == "SYSTEM"

    def test_report_reflects_measurements(self, client, db, auth):
        tc = create_test_case(db)
        for method, minutes in (("TRADITIONAL", 240.0), ("SYSTEM", 60.0)):
            client.post(
                "/api/v1/measurements/executions",
                json={
                    "test_case_id": tc.id,
                    "method": method,
                    "measurement": {
                        "duration_minutes": minutes,
                        "errors_found": 2,
                        "errors_missed": 0,
                        "corrections": 1,
                    },
                },
                headers=auth["notario"],
            )
        body = client.get("/api/v1/reports/experimental", headers=auth["notario"]).json()
        assert body["traditional_samples"] == 1
        assert body["system_samples"] == 1
        assert body["traditional_minutes_avg"] == 240.0
        assert body["system_minutes_avg"] == 60.0
        assert body["reduction_percentage"] == 75.0
        assert body["errors_found_total"] == 4

    def test_create_execution_requires_permission(self, client, db, seed_data):
        assert client.post("/api/v1/measurements/executions", json={}).status_code == 401
