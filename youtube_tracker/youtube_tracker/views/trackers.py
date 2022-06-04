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
def trackerList(request):
    """Render the user's trackers page."""
    trackers = Tracker.objects.filter(Q(is_public=True) | Q(tracker_creater=request.user)) \
        .values('tracker_name', 'tracker_id', 'tracker_description', 'is_public')
    for tracker in trackers:
        tracker_id = tracker['tracker_id']
        tracker['video_count'] = getTrackerRelationshipObjects(tracker_id, 'video').count()
        tracker['channel_count'] = getTrackerRelationshipObjects(tracker_id, 'channel').count()
    return render(request, 'youtube_tracker/trackers.html',
                  {"trackerList": trackers, "trackerCount": trackers.count(), "user": request.user})


@login_required
def trackerDetails(request, tracker_id):
    """Render the given tracker's details page."""
    tracker_details = getTrackerDetails(request, tracker_id)
    video_ids = getVideoIDs(tracker_id)
    channel_ids = getChannelIDs(tracker_id, sort_by=None)
    tracker_details['videos_count'] = len(video_ids)
    tracker_details['channels_count'] = len(channel_ids)
    trackers_list = Tracker.objects.filter(tracker_creater=request.user)\
        .values('tracker_id', 'tracker_name').order_by('-created_time')
    return render(request, 'youtube_tracker/trackerDetails.html',
                  {"trackerDetails": tracker_details, "trackerList": trackers_list})


### AJAX Calls


@ajax_post_required
def addTracker(request):
    """Return response to Tracker creation requests. Add a new tracker to the database. If specified, return a rendered card of the new tracker with the response."""
    response = {'error': True}
    try:
        tracker = Tracker.objects.create(
            tracker_name=request.POST.get('trackerName', None),
            tracker_description=request.POST.get('trackerDesc', None),
            tracker_creater=request.user,
        )
        response['trackerId'] = tracker.tracker_id
        tracker.full_clean()
        response['error'] = False
        if request.POST.get('return_card'):
            data = {'tracker_id': tracker.tracker_id, 'tracker_name': tracker.tracker_name,
                    'tracker_description': tracker.tracker_description, 'channel_count': 0, 'video_count': 0}
            response['render'] = render_to_string('youtube_tracker/tracker_card.html', {'tracker': data})
    except ValidationError as e:
        response['message'] = e.messages
    except IntegrityError as e:
        response['message'] = e.args[1]
    except ValueError:
        response['message'] = "You must be logged in before creating a tracker. Try refreshing the page."
    return JsonResponse(response)


@ajax_post_required
def trackerDeleteByName(request):
    """Delete given tracker."""
    tracker_name = request.POST.get("tracker_name")
    if tracker_name is None:
        return JsonResponse({'status': 'false', 'message': 'Missing tracker name.'}, status=500)
    tracker_instance = get_object_or_404(Tracker, tracker_name=tracker_name, tracker_creater=request.user)
    if tracker_instance:
        getTrackerRelationshipObjects(tracker_instance).delete()
        tracker_instance.delete()
    return HttpResponse("ok")


@ajax_post_required
def trackerContentDelete(request):
    """Delete given object from tracker."""
    tracker_id = request.POST.get('tracker_id')
    content_id = request.POST.get('content_id')
    TrackerRelationship.objects.filter(tracker_id=tracker_id, content_id=content_id).delete()
    return HttpResponse("ok")


@ajax_post_required
def trackerRename(request):
    """Not yet implemented - Rename a tracker and return the appropriate Http Response"""
    data = {'error': True, 'message': "Unexpected error."}
    tracker_id = request.POST.get("tracker_id")
    if tracker_id is None:
        return JsonResponse({'status': 'false', 'message': 'Missing tracker ID.'}, status=500)
    tracker_instance = get_object_or_404(Tracker, tracker_id=tracker_id)
    new_name = request.POST.get("new_name")
    if new_name is not None:
        try:
            tracker_instance.tracker_name = new_name
            tracker_instance.save()
            tracker_instance.full_clean()
            data['error'] = False
        except ValidationError as e:
            data['message'] = e.message
        except IntegrityError as e:
            data['message'] = e.args[1]
    return JsonResponse(data)


@ajax_post_required
def clickedOnTracker(request):
    """Return response to switching content's tracker membership. Creates or delete a tracker relationship entry for given content and tracker(s). 'adding' parameters shows whether to activate or deactivate the relationship."""
    tracker = Tracker.objects.get(tracker_id=request.POST.get('trackerId', None))
    adding = request.POST.get('adding') == 'true'
    content_ids = request.POST.getlist('contentIds[]') \
        if request.POST.getlist('contentIds[]') else request.POST.getlist('contentId')
    try:
        for content_id in content_ids:
            handleTrackerRelationship(request, tracker, content_id, adding)
    except Exception as e:
        return JsonResponse({'status': 'false', 'message': e.args[0]}, status=500)
    return HttpResponse("ok")


@ajax_post_required
def queryTrackerRelationship(request):
    """Return relationship status for each tracker for the given content item(s). Also include the number of trackers tracking the content (for the user and globally)."""
    data = {}
    tracker_relationships = {}
    content_id = request.POST.get('contentId')
    if request.POST.getlist('trackerIds[]'):
        tracker_ids = request.POST.getlist('trackerIds[]')
        for trackerId in tracker_ids:
            result = TrackerRelationship.objects.filter(
                tracker=trackerId,
                content_id=content_id,
            )
            tracker_relationships[trackerId] = False
            for relationship in result:
                if relationship.tracker.tracker_creater == request.user:
                    tracker_relationships[trackerId] = True
    content_ids = []
    if request.POST.getlist('contentIds[]'):
        content_ids = request.POST.getlist('contentIds[]')
    data['trackerRelationships'] = tracker_relationships
    data['totalTracking'], data['globalTracking'] = getTrackingNumbers(request, content_ids)
    return JsonResponse(data)


### Utility Functions

def handleTrackerRelationship(request, tracker, content_id, adding):
    """For given tracker and content, create or remove a tracker relationship entry. If the relationship is new, an appropriate entry will also be created for the content. Raises an error if either entry cannot be created."""
    if contentIsVideo(content_id):
        content_type = 'video'
    elif contentIsChannel(content_id):
        content_type = 'channel'
    else:
        raise Exception('Invalid content ID')
    tracker_relationship, created = TrackerRelationship.objects.get_or_create(
        tracker=tracker,
        content_type=content_type,
        content_id=content_id,
    )
    if not adding:
        tracker_relationship.delete()
    try:
        if created and content_type == 'channel':
            addChannelEntry(request, content_id)
        if created and content_type == 'video':
            addVideoEntry(request, content_id)
    except Exception as e:
        tracker_relationship.delete()
        raise e
