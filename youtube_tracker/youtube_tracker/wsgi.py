"""
WSGI config for youtube_tracker project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/2.0/howto/deployment/wsgi/
"""
from django.core.wsgi import get_wsgi_application
import os
import sys
import site

site.addsitedir('c:/anaconda3/envs/yttracker/lib/site-packages/')
sys.path.append('C:/__ Work Station/Py_Projects/YouTube_Tracker/youtube_tracker/youtube_tracker')
sys.path.append('C:/__ Work Station/Py_Projects/YouTube_Tracker/youtube_tracker')

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "youtube_tracker.settings")

application = get_wsgi_application()
