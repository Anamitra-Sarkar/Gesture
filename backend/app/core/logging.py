"""
Logging configuration for the application.
"""
import logging
import sys
from pathlib import Path


def setup_logging(debug_mode: bool = False):
    """
    Configure application logging.
    
    Args:
        debug_mode: Enable debug level logging
    """
    log_level = logging.DEBUG if debug_mode else logging.INFO
    
    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Configure format
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(log_dir / "app.log")
        ]
    )
    
    # Set third-party loggers to WARNING
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)
    
    logger = logging.getLogger(__name__)
    logger.info(f"Logging initialized at {'DEBUG' if debug_mode else 'INFO'} level")
    
    return logger
