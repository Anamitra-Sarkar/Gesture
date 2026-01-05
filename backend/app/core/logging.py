"""
Logging configuration for the application.
"""
import logging
import sys
from pathlib import Path


class LifecycleLogger:
    """Logger with lifecycle-aware formatting for startup/readiness/shutdown phases."""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
    
    def startup(self, message: str):
        """Log a startup phase message."""
        self.logger.info(f"[STARTUP] {message}")
    
    def readiness(self, message: str):
        """Log a readiness phase message."""
        self.logger.info(f"[READY] {message}")
    
    def shutdown(self, message: str):
        """Log a shutdown phase message."""
        self.logger.info(f"[SHUTDOWN] {message}")
    
    def info(self, message: str):
        """Log an info message."""
        self.logger.info(message)
    
    def warning(self, message: str):
        """Log a warning message."""
        self.logger.warning(message)
    
    def error(self, message: str, exc_info=False):
        """Log an error message."""
        self.logger.error(message, exc_info=exc_info)
    
    def debug(self, message: str):
        """Log a debug message."""
        self.logger.debug(message)


def setup_logging(debug_mode: bool = False):
    """
    Configure application logging with clear lifecycle phases.
    
    Args:
        debug_mode: Enable debug level logging
    """
    log_level = logging.DEBUG if debug_mode else logging.INFO
    
    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Configure format with more detailed context
    log_format = "%(asctime)s | %(levelname)-8s | %(name)-30s | %(message)s"
    
    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(log_dir / "app.log")
        ]
    )
    
    # Set third-party loggers to WARNING to reduce noise
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)
    
    logger = LifecycleLogger(__name__)
    logger.startup(f"Logging initialized at {'DEBUG' if debug_mode else 'INFO'} level")
    
    return logger
