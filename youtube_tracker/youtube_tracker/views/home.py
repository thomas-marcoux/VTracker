"""
Views for Home page, Landing page, User page & manual, suggestion box, & SSL Certificate.

"""

# General imports
import os
import requests

# Django imports
from django.contrib.auth.decorators import login_required
from django.http import FileResponse, Http404, JsonResponse
from django.shortcuts import render

# Sub packages
from ..models import Tracker
from youtube_tracker.settings import SEARCH_SUGGESTIONS_KEY
from .wrappers import ajax_get_required


def getLandingPage(request):
    """Render the landing page."""
    return render(request, 'youtube_tracker/landingPage.html')


@login_required
def homePage(request):
    """Render the home page."""
    trackers = []
    query = request.GET.get('q')
    if request.user.is_authenticated:
        trackers = Tracker.objects.filter(tracker_creater=request.user).values('tracker_id', 'tracker_name')\
            .order_by('-created_time')
    return render(request, 'youtube_tracker/home.html', {'trackerList': trackers, 'query': query})


def userGuidePage(request):
    """Render the user guide page."""
    return render(request, 'youtube_tracker/userGuide.html')


def userGuide(_):
    """Serves the PDF user guide."""
    try:
        ytt_directory = 'youtube_tracker'
        file_name = 'youtubetrackers_user_guide_draft3.pdf'
        path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', ytt_directory, 'files', file_name)
        return FileResponse(open(path, 'rb'), content_type='application/pdf')
    except FileNotFoundError:
        raise Http404


def SSL_Certificate(request):
    """Render SSL Certificate page."""
    return render(request, 'youtube_tracker/godaddy.html')


### AJAX Calls


@ajax_get_required
def autoSuggest(request):
    """Return search suggestions for YouTube search boxes."""
    search_term = request.GET.get('term') if request.GET.get('term') else None
    key = SEARCH_SUGGESTIONS_KEY
    headers = {"Ocp-Apim-Subscription-Key": key}
    endpoint = "https://api.bing.microsoft.com/v7.0/suggestions"
    params = {"q": search_term}
    response = requests.get(endpoint, headers=headers, params=params)
    response.raise_for_status()
    search_results = response.json()
    return JsonResponse({"searchResults": search_results})
