import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from a2wsgi import ASGIMiddleware
from main import app

# This is the entry point for Hostinger's Passenger server
application = ASGIMiddleware(app)
