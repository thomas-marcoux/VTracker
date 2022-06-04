"""
Render, utilities, and REST API functions for the Posting Frequency page.

"""

# General imports
import json
import logging
from dateutil.relativedelta import relativedelta

# Django imports
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string

# Sub packages
from ..models import Channels, ChannelsDaily
from .genericUtilities import abbreviateNumber, convertToDate, getLatestEntry, getMaxDictKey, parseRequest
from .contentAnalysis import getVideoCategoryDistribution
from .queryUtils import getAggregatedChannelStats, getChannels, getChannelsVideos, getDateRangeVideoRequest,\
    setTrackerDateRange, getTrackerDetails
from .wrappers import ajax_post_required

logger = logging.getLogger(__name__)


@login_required
def sentimentAnalysis(request, tracker_id):
    """Return a render of the Posting Frequency Page given the ID of the tracker. """
    tracker_data = getTrackerDetails(request, tracker_id)
    tracker_data['channels'] = getChannels(tracker_id)
    setTrackerDateRange(tracker_data)
    # See if below works well when date picker is implemented
    # tracker_data['end_date'] = getLatestEntry(channels, 'joined_date', offset=relativedelta(months=6))
    # tracker_data['start_date'] = tracker_data['end_date'] - relativedelta(years=1)
    return render(request, 'youtube_tracker/sentimentAnalysis.html',
                  {
                      'trackerData': tracker_data,
                      'breadCrumbTrail': {'Dashboard': 'dashboardAnalytics'},
                      'pageTitle': 'Sentiment Analysis',
                      'JSONContextData': json.dumps(tracker_data, indent=4, sort_keys=True, default=str),
                  })

