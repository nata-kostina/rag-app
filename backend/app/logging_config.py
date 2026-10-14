import logging
import sys

import colorlog


def setup_logging():
    logging.getLogger("uvicorn.access").disabled = True

    log_colors = {
        "DEBUG": "cyan",
        "INFO": "bold_green",
        "WARNING": "bold_yellow",
        "ERROR": "bold_red",
        "CRITICAL": "bold_purple",
    }

    formatter = colorlog.ColoredFormatter(
        "%(log_color)s%(asctime)s | %(levelname)-8s%(reset)s | %(cyan)s%(name)-18s%(reset)s - %(message)s",
        datefmt="%H:%M:%S",
        log_colors=log_colors,
    )

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.handlers = [console_handler]

    for lib in ["httpx", "openai", "httpcore", "sqlalchemy.engine"]:
        lib_logger = logging.getLogger(lib)
        lib_logger.setLevel(logging.INFO)

    return logging.getLogger("app")


logger = logging.getLogger("app")
