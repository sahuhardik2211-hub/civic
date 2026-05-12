import os
import sys
from pathlib import Path

from django.core.wsgi import get_wsgi_application


BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / 'backend'

sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'municipal_project.settings')

app = get_wsgi_application()

