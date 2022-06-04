"""
Render, utilities, and REST API functions for the Trackers & Tracker Details pages.

"""

# General imports
import logging

# Django imports
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.db.models import Q
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, get_object_or_404
from django.template.loader import render_to_string

# Sub packages
from ..models import Tracker, TrackerRelationship
from .channel import addChannelEntry
from .queryUtils import getChannelIDs, getTrackerDetails, getTrackerRelationshipObjects, getTrackingNumbers, getVideoIDs
from .video import addVideoEntry
from .youtubeUtils import contentIsChannel, contentIsVideo
from .wrappers import ajax_post_required


logger = logging.getLogger(__name__)


### Renders


@login_required
def eventsList(request):
   
    return render(request, 'youtube_tracker/events.html')

@login_required
def eventsDetails(request):
    """Render the given event's details page."""
    
    return render(request, 'youtube_tracker/eventDetails.html')

