"""
Render and REST API functions for the Content Engagement page.

"""

# General imports
import json
import logging

# Django imports
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.shortcuts import render


# Sub packages
from ..models import ChannelsDaily
from .genericUtilities import detectLanguage, parseRequest, dictionaryMerge, convertToDate, getRequestTimeParameters
from .queryUtils import getTrackerVideoIDs, getTrackerDetails, getDateRangeDailyVideoRequest, \
    getLatestDailyVideosRequest, getDateRangeCommentsRequest, getAggregatedVideoStats, getChannelIDs, getVideos, getPageData
from .wrappers import ajax_post_required


logger = logging.getLogger(__name__)


### Render


@login_required
def contentEngagement(request, tracker_id):
    """Return a render of the Content Engagement Page given the ID of the tracker. """
    tracker_data = getTrackerDetails(request, tracker_id, with_date_range=True)
    return render(request, 'youtube_tracker/contentEngagement.html',
                  {
                      'trackerData': tracker_data,
                      'breadCrumbTrail': {'Dashboard': 'dashboardAnalytics'},
                      'pageTitle': 'Content Engagement',
                      'JSONContextData': json.dumps(tracker_data, indent=4, sort_keys=True, default=str),
                  })


### AJAX Calls - Graph & Sidebar Buttons


@ajax_post_required
def contentEngagementAggrVideoStats(request):
    """Return **aggregated** video statistics for the sidebar buttons - at page load and when interacting with charts."""
    request_args = parseRequest(request)
    video_ids = getTrackerVideoIDs(request_args['channel_ids'])
    content_eng = getAggregatedVideoStats(video_ids, request_args['start_date'], request_args['end_date'])
    return JsonResponse({'trackerAnalyticsData': json.dumps(content_eng, indent=4, sort_keys=True, default=str)})


@ajax_post_required
def contentEngagementViews(request):
    """Return view information for chart & sidebar button."""
    request_args = parseRequest(request)
    video_ids = getTrackerVideoIDs(request_args['tracker_id'])
    view_desc = getVideoStatsByKeyword(video_ids, 'views_per_day', 'total_views') 
    return JsonResponse(view_desc)


@ajax_post_required
def contentEngagementLikeStats(request):
    """Return like information for chart & sidebar button."""
    request_args = parseRequest(request)
    video_ids = getTrackerVideoIDs(request_args['tracker_id'])
    view_desc = getVideoStatsByKeyword(video_ids , "likes_per_day", 'total_likes')
    return JsonResponse(view_desc)

@ajax_post_required
def contentEngagementDislikeStats(request):
    """Return dislike information for chart & sidebar button."""
    request_args = parseRequest(request)
    video_ids = getTrackerVideoIDs(request_args['tracker_id'])
    view_desc = getVideoStatsByKeyword(video_ids , "dislikes_per_day", 'total_dislikes' )
    return JsonResponse(view_desc)

@ajax_post_required
def contentEngagementCommentStats(request):
    """Return comments information for chart & sidebar button."""
    request_args = parseRequest(request)
    video_ids = getTrackerVideoIDs(request_args['tracker_id'])
    view_desc = getVideoStatsByKeyword(video_ids , "comments_per_day", 'total_comments' )
    return JsonResponse(view_desc)


@ajax_post_required
def contentEngagementSubscriberStats(request):
    """Return daily subscriber count for each channel between requested date range. To be displayed in the subscribers line charts."""
    data = []
    response = {}
    series = []
    request_args = parseRequest(request)
    maxValue = 0
    channelIds = getChannelIDs(request_args['tracker_id'])
    try:
        start_date, end_date, _, _ = getRequestTimeParameters(request)
        for channel_id in channelIds:
            channel_daily_data = ChannelsDaily.objects\
                .filter(channel_id=channel_id).order_by('-extracted_date')
            if bool(channel_daily_data):
                response[channel_id] = list(channel_daily_data.values('total_subscribers', 'extracted_date'))
                data += [(element['extracted_date'], element['extracted_date']) for element in response[channel_id]]
                if response[channel_id]:
                    maxValue = max(response[channel_id][0]['total_subscribers'], maxValue)
    except Exception as e:
        logger.error(e)
    series.append({'name': 'total_subscribers', 'data': data})
    stat_desc = {'top_token' : maxValue, 'series': series}
    return JsonResponse(stat_desc)


@ajax_post_required
def contentEngagementCommenters(request):
    """Return the total amount of commenters across the tracker's videos. To be displayed in the commenters side button."""
    response = {'total_commenters': 0}
    request_args = parseRequest(request)
    video_ids = getTrackerVideoIDs(request_args['contentId'])
    try:
        queried_fields = ['video_id.keyword', 'commenter_id']
        comments_search = getDateRangeCommentsRequest(video_ids, queried_fields, request_args['start_date'], request_args['end_date'])
        comments_search.aggs.metric('commenter_count', 'cardinality', field='commenter_id.keyword')
        res = comments_search.execute()
        response['total_commenters'] = res.aggregations.commenter_count.value
    except Exception as e:
        logger.error(e)
    return JsonResponse({'trackerAnalyticsData': json.dumps(response, indent=4, sort_keys=True, default=str)})


### AJAX Calls - Video Player Table


@ajax_post_required
def contentEngagementVideoList(request):
    """Build a list of video data for the Tabulator video player table."""
    id = request.POST.get('tracker_id')

    video_id = Paginator(getTrackerVideoIDs(id), 2000)
    video_id_pages = getPageData(video_id)

    for video_id_page in video_id_pages:
        video_ids = video_id_page
        fields = ['video_id', 'total_views']
        videos_request = getLatestDailyVideosRequest(video_ids, fields, sort_field='total_views')
        video_latest_data = {item.video_id: item.to_dict() for item in videos_request.scan()}
        video_details = getVideos(video_ids, as_dict=True)
        dictionaryMerge(video_latest_data, video_details)
        return JsonResponse({'data': list(video_latest_data.values())})


### AJAX Calls - Video Details Table


@ajax_post_required
def contentEngagementVideoDetails(request):
    """Return video information for the data tables - at page load and when interacting with charts."""
    id = request.POST.get('tracker_id')

    video_id = Paginator(getTrackerVideoIDs(id), 2000)
    video_id_pages = getPageData(video_id)

    for video_id_page in video_id_pages:
        video_ids = video_id_page
        fields = ['video_id', 'total_views', 'total_likes', 'total_dislikes', 'total_comments']
        videos_request = getLatestDailyVideosRequest(video_ids, fields)
        video_latest_data = {item.video_id: item.to_dict() for item in videos_request.scan()}
        video_details = getVideos(video_ids, as_dict=True)
        dictionaryMerge(video_latest_data, video_details)
        return JsonResponse({'data': list(video_latest_data.values())})


### Utilities


def getVideoStatsByKeyword(video_ids, keyword, field, start_date=None, end_date=None):
    """Given a list of video IDs and a start/end date, return a dictionary of their view statistics (views, likes, dislikes, comments)
    . based on the keyword and the field and the (max) daily entry"""
    try:
        queried_fields = [field, 'extracted_date']
        video_daily_search = getDateRangeDailyVideoRequest(video_ids, queried_fields)
        video_daily_search.aggs.bucket('group_by_date', 'date_histogram', field='extracted_date',
                                       calendar_interval='1w', format='yyyy-MM-dd')\
            .metric(keyword, 'max', field=field)
        res = video_daily_search.execute()
        series = []
        maxValue = 0
        data = []
        #print("query field", res)

        for hits in res.aggregations.group_by_date.buckets:
            hitValue = 0
            if keyword == 'views_per_day':
                hitValue = hits.views_per_day.value
            elif keyword == 'likes_per_day':
                hitValue = hits.likes_per_day.value
            elif keyword == 'dislikes_per_day':
                hitValue = hits.dislikes_per_day.value
            elif keyword == "comments_per_day":
                hitValue = hits.comments_per_day.value
            # if hitValue > maxValue:
            #     maxValue = hitValue
            hitValue = int(hitValue) if hitValue else 0
            maxValue = max(maxValue, hitValue)
            data.append((convertToDate(hits.key_as_string), hitValue))
        series.append({'name': keyword, 'data': data})
        stat_desc = {'top_token' : maxValue, 'series': series}
    except Exception as e:
        logger.error(e)
    return stat_desc
