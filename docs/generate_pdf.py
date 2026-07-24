#!/usr/bin/env python3
"""Genera el PDF de la guía para el cliente desde el HTML."""

from pathlib import Path

HTML_PATH = Path(__file__).parent / "guia-cliente-atv.html"
PDF_PATH = Path(__file__).parent / "Guia-ATV-Landing-Dashboard-Meta.pdf"


def main():
    from playwright.sync_api import sync_playwright

    html_uri = HTML_PATH.resolve().as_uri()

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(html_uri, wait_until="networkidle")
        page.pdf(
            path=str(PDF_PATH),
            format="A4",
            print_background=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
        )
        browser.close()

    print(f"PDF generado: {PDF_PATH}")


if __name__ == "__main__":
    main()
