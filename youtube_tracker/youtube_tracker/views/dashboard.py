"""
Render, utilities, and REST API functions for the Analytics Dashboard page.

"""

# General imports
import json
import logging
import tldextract

# Django imports
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string

# Elastic Search imports
from elasticsearch import Elasticsearch
from django.conf import settings

# Sub packages
from ..models import SMLink, Tracker, TrackerRelationship
from .video import addVideoEntry
from .contentEngagement import getAggregatedVideoStats
from .genericUtilities import abbreviateNumber, convertToDate, parseRequest
from .queryUtils import getAggregatedChannelStats, getChannelIDs, getDateRangeVideoRequest, getTrackerDetails, \
    getTrackerVideoIDs, getTrackerRelationshipObjects, getDateRangeDailyVideoRequest, setTrackerDateRange, \
    getRelatedVideos, getPageData, getElasticSearchClient
from .wrappers import ajax_post_required

es_index = settings.ELASTICSEARCH_INDICES['es_indices']
es_client = getElasticSearchClient()
logger = logging.getLogger(__name__)


### Render


@login_required
def dashboardAnalytics(request, tracker_id):
    """Return a render of the Analytics Dashboard page given the ID of the tracker. """
    tracker_data = getTrackerDetails(request, tracker_id, with_date_range=True)
    return render(request, 'youtube_tracker/dashboardAnalytics.html',
                  {
                      'trackerData': tracker_data,
                      'pageTitle': 'Dashboard',
                      'JSONContextData': json.dumps(tracker_data, indent=4, sort_keys=True, default=str),
                  })


### AJAX Calls - Statistics Ribbon


@ajax_post_required
def dashboardAnalyticsRibbonStatistics(request):
    """Return a rendered statistics ribbon for the dashboard analytics."""
    request_args = parseRequest(request)
    tracker_id = request_args['tracker_id']
    video_ids = getTrackerVideoIDs(tracker_id)
    channel_ids = getChannelIDs(tracker_id)
    tracker_data = {'tracker_id': tracker_id}
    setTrackerDateRange(tracker_data)
    data = getTrackerStats(video_ids, channel_ids, tracker_data['start_date'], tracker_data['end_date'])
    data['total_videos'] = len(video_ids)
    data = {k: abbreviateNumber(v) for k, v in data.items()}
    ribbon_render = render_to_string('youtube_tracker/dashboardAnalytics_ribbon.html', {'contextData': data})
    return JsonResponse({'render': ribbon_render})


### AJAX Calls - Posting Frequency Line Chart


@ajax_post_required
def dashboardAnalyticsPostingFrequency(request):
    """Return single-series list of histogram dates & count of publications to display Posting Frequency Chart."""
    request_args = parseRequest(request)
    video_ids = getTrackerVideoIDs(request_args['tracker_id'])
    queried_fields = ['published_date']
    video_search = getDateRangeVideoRequest(video_ids, queried_fields)
    video_search.aggs.bucket('group_by_date', 'date_histogram', field='published_date',
                             calendar_interval='1w', format='yyyy-MM-dd')
    res = video_search.execute()
    data = []
    for hits in res.aggregations.group_by_date.buckets:
        data.append((convertToDate(hits.key_as_string), hits.doc_count))
    return JsonResponse({'series': [{'data': data}]})


### AJAX Calls - Daily View Line Chart


@ajax_post_required
def dashboardAnalyticsDailyViews(request):
    """Return single-series list of histogram dates & video views per given range and interval to display in the daily views chart."""
    request_args = parseRequest(request)
    video_ids = getTrackerVideoIDs(request_args['tracker_id'])
    queried_fields = ['total_views', 'extracted_date']
    video_daily_search = getDateRangeDailyVideoRequest(video_ids, queried_fields)  # , start_date, end_date)
    video_daily_search.aggs.bucket('group_by_date', 'date_histogram', field='extracted_date',
                                   calendar_interval='1w', format='yyyy-MM-dd') \
        .metric('views_per_day', 'max', field='total_views')
    res = video_daily_search.execute()
    data = []
    for hits in res.aggregations.group_by_date.buckets:
        data.append((convertToDate(hits.key_as_string), hits.views_per_day.value))
    return JsonResponse({'series': [{'data': data}]})


### AJAX Calls - Social Media Graph


@ajax_post_required
def dashboardAnalyticsSmLinks(request):
    """Return a rendered social media footprint graph for the dashboard analytics. For each mention of a website in the SMLinks table, extract website name and count mentions. This needs attention as that table is not maintained."""

    def extractSiteName(domain_name):
        return tldextract.extract(domain_name).domain.capitalize()

    data = {}
    request_args = parseRequest(request)
    tracker_id = request_args['tracker_id']
    channels_qs = getTrackerRelationshipObjects(tracker_id, 'channel')
    channel_ids = channels_qs.values_list('content_id')
    sm_results = SMLink.objects.filter(channel_id__in=channel_ids)
    for social_media_link in sm_results:
        site_name = extractSiteName(social_media_link.domain)
        if site_name in data:
            data[site_name] += 1
        else:
            data[site_name] = 1
    social_media_render = render_to_string('youtube_tracker/dashboardAnalytics_socialMediaFootprint.html',
                                           {'contextData': data})
    return JsonResponse({'render': social_media_render})


### AJAX Calls - Related Videos Table


@ajax_post_required
def dashboardAnalyticsRelatedVideos(request):
    """Return a render of the Related Videos Table. Including the number of videos each video is related to."""
    video_ids = getTrackerVideoIDs(request.POST.get('tracker_id'))
    related_videos_details = getRelatedVideos(video_ids)
    pop_headers = ["video_id", "parent_video", "published_date"]
    related_video = []
    for item in related_videos_details:
        [item.pop(key) for key in pop_headers]
        related_video.append(item)

    related_videos_data = Paginator(related_video, 2000)
    related_videos = getPageData(related_videos_data)
    return JsonResponse({'data': related_videos})


@ajax_post_required
def addRelatedVideoToTrackers(request):
    """Not yet implemented & needs work. Add a related video to trackers."""
    response = {}
    request_args = parseRequest(request)
    video_id = request_args['contentId']
    tracker_ids = request_args['trackerIds[]']
    for tracker_id in tracker_ids:
        tracker = Tracker.objects.get(tracker_id=int(tracker_id))
        tracker_relationship, created = TrackerRelationship.objects.get_or_create(
            tracker=tracker, content_type='video', content_id=video_id)
        if created:
            video = addVideoEntry(request, video_id)
            if video is None:
                tracker_relationship.delete()
    return JsonResponse(response)


### Utility Functions


def getTrackerStats(video_ids, channel_ids, start_date, end_date):
    """Return tracker statistics for display in the dashboard top ribbon."""
    tracker_stats = {'total_videos': len(video_ids), 'total_channels': len(channel_ids)}
    videos_stats = getAggregatedVideoStats(video_ids, start_date, end_date)
    tracker_stats['total_views'] = videos_stats['total_views']
    tracker_stats['total_likes'] = videos_stats['total_likes']
    tracker_stats['total_dislikes'] = videos_stats['total_dislikes']
    tracker_stats['total_comments'] = videos_stats['total_comments']
    channel_stats = getAggregatedChannelStats(channel_ids, start_date, end_date)
    tracker_stats['total_subscribers'] = channel_stats['total_subscribers']
    return tracker_stats
