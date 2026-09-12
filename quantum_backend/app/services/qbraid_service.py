from app.config import settings


def get_qbraid_status():
    configured = bool(settings.qbraid_api_key)

    return {
        "configured": configured,
        "message": (
            "qBraid credentials configured on backend."
            if configured
            else "QBRAID_API_KEY is not configured."
        ),
    }
