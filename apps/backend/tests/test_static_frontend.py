"""Static frontend serving contract tests.

The React panel cutover keeps the installed runtime shape as ``frontend/dist``.
These tests use a temporary Vite-like build artifact so they exercise Flask's
packaged static behavior without requiring Node, Docker, or a Minecraft server.
"""
from __future__ import annotations

import shutil
from pathlib import Path


def _write_panel_dist(path: Path) -> Path:
    """Create a minimal hashed-asset SPA build artifact."""
    assets = path / "assets"
    assets.mkdir(parents=True)
    (path / "index.html").write_text(
        "\n".join(
            [
                "<!doctype html>",
                '<html lang="en">',
                "  <head>",
                '    <meta charset="UTF-8" />',
                '    <script type="module" src="/assets/index-Demo123.js"></script>',
                "  </head>",
                '  <body><div id="root">Fabricator Panel</div></body>',
                "</html>",
            ]
        ),
        encoding="utf-8",
    )
    asset = assets / "index-Demo123.js"
    asset.write_text("window.__FABRICATOR_PANEL_SMOKE__ = true;\n", encoding="utf-8")
    return asset


def _create_static_app(tmp_path, tmp_servers_root, monkeypatch):
    """Create the Flask app against a temp packaged ``frontend/dist``."""
    import backend.server.registry as registry_mod
    registry_mod.reset_for_tests()

    import backend.core.app as app_module

    monkeypatch.setattr(app_module, "get_base_path", lambda: str(tmp_path))
    app = app_module.create_app()
    app.config["TESTING"] = True
    return app


def test_unknown_non_api_route_falls_back_to_index_html(
    tmp_path, tmp_servers_root, monkeypatch
):
    dist = tmp_path / "frontend" / "dist"
    _write_panel_dist(dist)

    app = _create_static_app(tmp_path, tmp_servers_root, monkeypatch)
    response = app.test_client().get("/not-a-real-client-route")

    assert response.status_code == 200
    assert response.content_type.startswith("text/html")
    assert b"Fabricator Panel" in response.data


def test_deep_panel_link_falls_back_to_index_html(
    tmp_path, tmp_servers_root, monkeypatch
):
    dist = tmp_path / "frontend" / "dist"
    _write_panel_dist(dist)

    app = _create_static_app(tmp_path, tmp_servers_root, monkeypatch)
    response = app.test_client().get("/server/demo/files")

    assert response.status_code == 200
    assert response.content_type.startswith("text/html")
    assert b"Fabricator Panel" in response.data


def test_unknown_api_route_does_not_fall_back_to_index_html(
    tmp_path, tmp_servers_root, monkeypatch
):
    dist = tmp_path / "frontend" / "dist"
    _write_panel_dist(dist)

    app = _create_static_app(tmp_path, tmp_servers_root, monkeypatch)
    response = app.test_client().get("/api/nope")

    assert response.status_code == 404
    assert response.is_json
    assert response.get_json() == {
        "error": "endpoint not found",
        "path": "/api/nope",
    }


def test_hashed_dist_asset_is_served_from_packaged_frontend(
    tmp_path, tmp_servers_root, monkeypatch
):
    dist = tmp_path / "frontend" / "dist"
    asset = _write_panel_dist(dist)

    app = _create_static_app(tmp_path, tmp_servers_root, monkeypatch)
    response = app.test_client().get(f"/assets/{asset.name}")

    assert response.status_code == 200
    assert response.content_type.startswith("text/javascript")
    assert b"__FABRICATOR_PANEL_SMOKE__" in response.data


def test_packaged_panel_dist_smoke_via_frontend_dist_shape(
    tmp_path, tmp_servers_root, monkeypatch
):
    """Exercise a panel build artifact copied into the legacy package path."""
    panel_dist = tmp_path / "apps" / "panel" / "dist"
    _write_panel_dist(panel_dist)

    packaged_dist = tmp_path / "frontend" / "dist"
    shutil.copytree(panel_dist, packaged_dist)

    app = _create_static_app(tmp_path, tmp_servers_root, monkeypatch)
    client = app.test_client()

    index_response = client.get("/server/demo/files")
    asset_response = client.get("/assets/index-Demo123.js")

    assert index_response.status_code == 200
    assert b"Fabricator Panel" in index_response.data
    assert asset_response.status_code == 200
    assert b"__FABRICATOR_PANEL_SMOKE__" in asset_response.data
