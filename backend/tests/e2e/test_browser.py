# backend/tests/e2e/test_browser.py
"""Pruebas E2E de navegador real (opcionales).

Se ejecutan sólo cuando la variable de entorno ``E2E_BASE_URL`` apunta a una
instancia en ejecución del frontend (por ejemplo ``http://localhost:5173``) y
``playwright`` está instalado. En caso contrario se omiten, de modo que
``pytest tests/e2e`` siga siendo verde sin navegador.
"""

from __future__ import annotations

import os

import pytest

pytestmark = [pytest.mark.e2e, pytest.mark.playwright]

BASE_URL = os.getenv("E2E_BASE_URL")
DEMO_USER = os.getenv("E2E_DEMO_USER", "notario.demo")
DEMO_PASSWORD = os.getenv("E2E_DEMO_PASSWORD", "Notario123!")


@pytest.fixture()
def page():
    if not BASE_URL:
        pytest.skip("E2E_BASE_URL no está definido: se omiten las pruebas de navegador.")
    sync_api = pytest.importorskip("playwright.sync_api", reason="playwright no instalado")
    with sync_api.sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(base_url=BASE_URL)
        page = context.new_page()
        try:
            yield page
        finally:
            context.close()
            browser.close()


def test_login_page_renders(page):
    page.goto("/login")
    page.wait_for_load_state("networkidle")
    assert page.locator("input").count() >= 2


def test_demo_user_can_log_in(page):
    page.goto("/login")
    page.get_by_label("Usuario").fill(DEMO_USER)
    page.get_by_label("Contraseña").fill(DEMO_PASSWORD)
    page.get_by_role("button", name="Entrar").click()
    page.wait_for_url(lambda url: "/login" not in url, timeout=15000)
    assert "/login" not in page.url
