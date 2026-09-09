"""Minimal Flask app for the hardened-image demo."""
import os

from flask import Flask, jsonify

app = Flask(__name__)


@app.get("/healthz")
def healthz():
    return jsonify(status="ok"), 200


@app.get("/")
def index():
    return jsonify(host=os.uname().nodename, msg="hardened container demo")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
