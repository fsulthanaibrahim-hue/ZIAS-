# zias_backend/zias_backend/celery.py
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'zias_backend.settings')
app = Celery('zias_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()