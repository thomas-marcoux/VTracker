"""
Utilities shared between views and used to query the database or Elastic Search.

"""

# General imports
import json

from django.http import JsonResponse
from django.template.defaulttags import widthratio
from django.template.loader import render_to_string
from plum import dispatch
import logging

# Django imports
from django.db.models import Q
from django.forms.models import model_to_dict
from django.shortcuts import get_object_or_404

# Elastic Search imports
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search, Q as ES_Q
from django.conf import settings

# Sub packages
from ..models import Channels, TrackerRelationship, Tracker, Videos, RelatedVideos
from .genericUtilities import convertToDate, elasticSearchResponseToInteger, dictionaryMerge
from .genericUtilities import elasticSearchResponseToInteger, convertToDate, parseRequest
from .genericUtilities import elasticSearchResponseToInteger, convertToDate, parseRequest
from .youtubeUtils import contentIsVideo
from .wrappers import ajax_post_required


es_index = settings.ELASTICSEARCH_INDICES['es_indices']


def initElasticSearchClient(es_index):
    """Initialize ES client and updates indices' max terms count."""
    es_client = Elasticsearch([settings.ELASTICSEARCH_HOST], timeout=30, scheme="https", port=443,
                              http_auth=(settings.ELASTICSEARCH_USER, settings.ELASTICSEARCH_PWD),
                              use_ssl=True, verify_certs=True, ca_certs=settings.ELASTICSEARCH_CERT_PATH)
    for index in es_index:
        es_client.indices.put_settings(index=es_index[index], body={
            "index.max_terms_count": settings.ELASTICSEARCH_MAX_TERMS_COUNT
        })
    return es_client

ELASTICSEARCH_CLIENT = initElasticSearchClient(es_index)
es_client = ELASTICSEARCH_CLIENT

def getElasticSearchClient():
    return ELASTICSEARCH_CLIENT


logger = logging.getLogger(__name__)


### Channel Queries


def getChannels(ids, sort_by='joined_date', order_desc=True, values=None, as_dict=False):
    """Return channels objects. Ids accepts a single tracker id or a list of channel ids. Returns in (optional) given order parameters."""
    if values is None:
        values = ['channel_id', 'channel_title', 'joined_date', 'description', 'location', 'language']
    channels_qs = getChannelQuerySet(ids, sort_by, order_desc)
    channels = list(channels_qs.values(*values))
    if as_dict:
        channels = {channel['channel_id']: channel for channel in channels}
    return channels


def getChannelIDs(tracker_id, sort_by='joined_date', order_desc=True):
    """Return channels belonging to given tracker in (optional) given order parameters."""
    if sort_by is None:
        tracker_content = getTrackerRelationshipObjects(tracker_id, 'channel')
        return list(tracker_content.values_list('content_id', flat=True).distinct())
    else:
        channels_qs = getChannelQuerySet(tracker_id, sort_by, order_desc)
        return list(channels_qs.values_list('channel_id', flat=True).distinct())


def getChannelsVideos(channel_ids):
    """Return IDs of videos published by given channel IDs."""
    videos_qs = getVideoQuerySet([], channel_ids)
    return list(videos_qs.values_list('video_id', flat=True).distinct())


@dispatch
def getChannelQuerySet(tracker_id: str, sort_by: object = None, order_desc: bool = True):
    """Return QuerySet of Channels belonging to given tracker in (optional) given order parameters."""
    return getChannelQuerySet(int(tracker_id), sort_by, order_desc)


@dispatch
def getChannelQuerySet(tracker_id: int, sort_by: object = None, order_desc: bool = True):
    """Return QuerySet of Channels belonging to given tracker in (optional) given order parameters."""
    query_set = getTrackerRelationshipObjects(tracker_id, 'channel')
    channel_ids = list(query_set.values_list('content_id', flat=True).distinct())
    return getChannelQuerySet(channel_ids, sort_by, order_desc)


@dispatch
def getChannelQuerySet(channel_ids: list, sort_by: object = None, order_desc: bool = True):
    """Return QuerySet of Channels matching given IDs in (optional) given order parameters."""
    query_set = Channels.objects.filter(channel_id__in=channel_ids)
    if sort_by:
        query_set = query_set.order_by(f"{'-' if order_desc else ''}{sort_by}")
    return query_set


### Video Queries


def getVideos(ids, sort_by='published_date', order_desc=True, values=None,
              start_date=None, end_date=None, as_dict=False):
    """Return Videos objects. Accepts a list of video IDs or a parent tracker (which will include videos from tracked channels). (Optional) Sorted by publication date and order parameters unless set to None or otherwise specified."""
    if values is None:
        values = ['video_id', 'video_title', 'category', 'published_date']
    videos_qs = getVideoQuerySet(ids, sort_by, order_desc, start_date, end_date)
    videos = list(videos_qs.values(*values))
    if as_dict:
        videos = {video['video_id']: video for video in videos}
    return videos


def getVideoIDs(tracker_id):
    """Return only videos IDs added to tracker, excluding videos from tracked channels."""
    tracker_content = getTrackerRelationshipObjects(tracker_id)
    return list(tracker_content.filter(content_type='video').values_list('content_id', flat=True).distinct())


def getTrackerVideoIDs(tracker_id, sort_by="published_date", order_desc=True, start_date=None, end_date=None):
    """Return video IDs belonging to given tracker, including videos from tracked channels. (Optional) Sorted by publication date unless set to None or otherwise specified. Return results between date bracket if provided."""
    videos_qs = getVideoQuerySet(tracker_id, sort_by, order_desc, start_date, end_date)
    return list(videos_qs.values_list('video_id', flat=True).distinct())


@dispatch
def getVideoQuerySet(tracker_id: str, sort_by: object = None, order_desc: bool = True, start_date: object = None,
                     end_date: object = None):
    """Return QuerySet of Videos belonging to given tracker. Return results between date bracket in given order parameters if provided."""
    return getVideoQuerySet(int(tracker_id), sort_by, order_desc, start_date, end_date)


@dispatch
def getVideoQuerySet(tracker_id: int, sort_by: object = None, order_desc: bool = True, start_date: object = None,
                     end_date: object = None):
    """Return QuerySet of Videos belonging to given tracker. Return results between date bracket in given order parameters if provided."""
    tracker_content = getTrackerRelationshipObjects(tracker_id)
    video_ids = list(tracker_content.filter(content_type='video').values_list('content_id', flat=True).distinct())
    channel_ids = list(tracker_content.filter(content_type='channel').values_list('content_id', flat=True).distinct())
    return getVideoQuerySet(video_ids, channel_ids, sort_by, order_desc, start_date, end_date)


@dispatch
def getVideoQuerySet(video_ids: list, sort_by: object = None, order_desc: bool = True, start_date: object = None,
                     end_date: object = None):
    """Return QuerySet of Videos for given video IDs. Return results between date bracket in given order parameters if provided."""
    return getVideoQuerySet(video_ids, [], sort_by, order_desc, start_date, end_date)


@dispatch
def getVideoQuerySet(video_ids: list, channel_ids: list, sort_by: object = None, order_desc: bool = True,
                     start_date: object = None, end_date: object = None):
    """Return QuerySet of Videos belonging to given tracker, including videos published by tracked channels. Return results between date bracket in given order parameters if provided."""
    query_set = Videos.objects.filter(Q(video_id__in=video_ids) | Q(channel_id__in=channel_ids))
    if start_date and end_date:
        query_set = query_set.filter(published_date__range=[start_date, end_date])
    if sort_by:
        query_set = query_set.order_by(f"{'-' if order_desc else ''}{sort_by}")
    return query_set


### Tracker Queries


def getTrackerDetails(request, tracker_id, with_date_range=False):
    """Returns a tracker_data object to populate the target. If with_date_range is True, return the start end date of the content."""
    public = request.GET.get("public") if request.GET.get("public") else False
    tracker_object = get_object_or_404(Tracker, tracker_id=tracker_id, tracker_creater=request.user) \
        if not public else get_object_or_404(Tracker, tracker_id=tracker_id, is_public=public)
    tracker_data = model_to_dict(tracker_object)
    tracker_data['contentType'] = 'tracker'
    tracker_data['created_at'] = tracker_object.created_time.strftime("%b %d %Y | %I:%M %p")
    if with_date_range:
        setTrackerDateRange(tracker_data)
    return tracker_data


def getTrackerRelationshipObjects(tracker_id, content_type=None, content_id=None):
    """Return QuerySet for a given tracker's content (channel or video). Specify content_id to check if the relationship exists."""
    queryset = TrackerRelationship.objects.filter(tracker=tracker_id)
    if content_type:
        queryset = queryset.filter(content_type=content_type)
    if content_id:
        queryset = queryset.filter(content_id=content_id)
    return queryset


def getTrackersWithRelationship(request, content_id):
    """Return the user's trackers with a parameter indicated whether the content is in them. Used to display trackers in modals."""
    trackers = Tracker.objects.filter(tracker_creater=request.user) \
        .values('tracker_id', 'tracker_name').order_by('-created_time')
    for tracker in trackers:
        relationship_qs = getTrackerRelationshipObjects(tracker['tracker_id'], content_id=content_id)
        tracker['contentIsInTracker'] = relationship_qs.exists()
    return trackers


def setTrackerDateRange(tracker_data, content_type='video'):
    """Appends date range data to the given tracker object. The start is the oldest found publication date and the end is the most recent publication date."""
    date_field = 'joined_date' if content_type == 'channel' else 'published_date'
    oldest_entry, latest_entry = getTrackerDateRange(tracker_data['tracker_id'], date_field)
    tracker_data['end_date'] = latest_entry[0][date_field]
    tracker_data['start_date'] = oldest_entry[0][date_field]


def getTrackerDateRange(tracker_id, date_field):
    """Get the tracker's date range from oldest to most recent. Queries either videos or channels."""
    query_set = getChannelQuerySet(tracker_id) if date_field == 'joined_date' else getVideoQuerySet(tracker_id)
    oldest_entry = list(query_set.order_by(date_field)[0:1].values(date_field))
    latest_entry = list(query_set.order_by('-' + date_field)[0:1].values(date_field))
    return oldest_entry, latest_entry


def getTrackingNumbers(request, content_ids):
    """Return number of trackers tracking given content. For the user, and across all users."""
    total_tracking = {}
    global_tracking = {}
    for contentId in content_ids:
        result = TrackerRelationship.objects.filter(content_id=contentId)
        total_tracking[contentId] = 0
        global_tracking[contentId] = 0
        for relationship in result:
            global_tracking[contentId] = global_tracking[contentId] + 1
            if relationship.tracker.tracker_creater == request.user:
                total_tracking[contentId] = total_tracking[contentId] + 1
    return total_tracking, global_tracking


# Elastic Search & Aggregations

def getDateRangeVideoRequest(ids, fields, start_date=None, end_date=None, id_field='video_id'):
    """Call getDateRangeContentRequest for videos. Set id_field to channel_id and provide channel IDs to find videos published by the channels."""
    return getDateRangeContentRequest(ids, fields, id_field, 'es-videos', start_date, end_date, 'published_date')


def getLatestDailyVideosRequest(ids, fields, start_date=None, end_date=None, sort_field=None):
    """Call getLatestDailyRequest for videos."""
    return getLatestDailyRequest(ids, fields, 'video_id', 'es-videos_daily', start_date, end_date, sort_field)


def getLatestDailyChannelsRequest(ids, fields, start_date=None, end_date=None, sort_field=None):
    """Call getLatestDailyRequest for channels."""
    return getLatestDailyRequest(ids, fields, 'channel_id', 'es-channels_daily', start_date, end_date, sort_field)


def getDateRangeDailyVideoRequest(ids, fields, start_date=None, end_date=None):
    """Call getDateRangeContentRequest for videos."""
    return getDateRangeContentRequest(ids, fields, 'video_id', 'es-videos_daily', start_date, end_date, sort=True)


@dispatch
def getDateRangeCommentsRequest(ids: str, fields: list, start_date: object = None, end_date: object = None,
                                exclude_replies: bool = True):
    """Call getDateRangeContentRequest for given video or parent comment. If exclude_replies is True, only the parent comments are queried."""
    return getDateRangeCommentsRequest([ids], fields, start_date, end_date, exclude_replies)


@dispatch
def getDateRangeCommentsRequest(ids: list, fields: list, start_date: object = None, end_date: object = None,
                                exclude_replies: bool = True):
    """Call getDateRangeContentRequest for given video(s) or parent comment(s). If exclude_replies is True, only the parent comments are queried."""
    keyword_id = 'reply_to'
    if contentIsVideo(ids[0]):
        keyword_id = 'video_id'
    response = getDateRangeContentRequest(ids, fields, keyword_id, 'es-comments', start_date, end_date,
                                          'published_date', sort=True)
    return response.exclude('exists', field='reply_to') if exclude_replies else response


def getDateRangeContentRequest(ids, fields, id_field, es_index_name, start_date=None, end_date=None,
                               date_field='extracted_date', sort=False):
    """Return ElasticSearch request for entries within given date range for given IDs (or all entries if unspecified). Used for histogram views to show periodical engagement."""
    search = Search(index=es_index[es_index_name], using=es_client)
    search = search.filter(ES_Q({'terms': {f'{id_field}.keyword': ids}})).source(fields)
    if start_date and end_date:
        search = search.filter(ES_Q({'range': {date_field: {'gte': start_date, 'lt': end_date}}}))
    if sort:
        search = search.sort('-' + date_field)
    return search


def getPageData(paginator_object):
    """Yield Page data by Paginator Library"""
    for page_no in paginator_object.page_range:
        page_next = paginator_object.page(page_no)
        next_page = page_next.object_list
        return next_page


def buildElasticSearchResponse(result):
    """Build a list of data given the ElasticSearch QuerySet. Return response to pass to frontend as data"""
    data = []
    tableData = []
    hits = result['hits']['hits']
    published_date_format = "%Y-%m-%dT%H:%M:%SZ"
    for item in hits:
        dateFormat = convertToDate(item['_source']['published_date'], published_date_format)
        dateStr = dateFormat.strftime("%b %d %Y (%H:%M)")
        item['_source']['published_date'] = dateStr
        data.append(item['_source'])
    for item in data:
        tableDict = dict()
        for key, value in item.items():
            tableDict[" ".join(key.split('_')).title()] = value
        tableData.append(tableDict)
        tableData
    return tableData


def getRelatedVideos(video_ids):
    """Return a map of the Related Videos Table. Including the number of videos each video is related to."""
    values = ['video_id', 'parent_video', 'title', 'thumbnails_medium_url', 'published_date']
    id_field = 'parent_video'
    related_videos_search = getDateRangeContentRequest(video_ids, values, id_field, 'es-related_videos',
                                                       date_field='published_date')
    related_videos_query = related_videos_search.exclude(ES_Q({'terms': {'video_id.keyword': video_ids}}))
    related_video_map = {}
    # related_videos_to_query = 5
    related_videos_query.aggs.bucket("group_by_video", 'terms', field='video_id.keyword')
    res = related_videos_query.execute()
    for hits in res.aggregations.group_by_video.buckets:
        video = RelatedVideos.objects.filter(video_id=hits.key).values(*values).first()
        if video:
            related_video_map[hits.key] = video
            related_video_map[hits.key]["related_to_count"] = hits.doc_count
    related_video_map = list(v for _, v in related_video_map.items())
    return related_video_map


def getLatestDailyRequest(ids, fields, id_field, es_index_name, start_date=None, end_date=None, sort_field=None):
    """Return ElasticSearch request for latest daily entries given IDs and (optional) date range. Used to show latest
    known states or process aggregations. """
    sorting_params = [{"extracted_date": {"order": "desc"}}]
    if sort_field:
        sorting_params.append({sort_field: {"order": "desc"}})
    daily_search = getDateRangeContentRequest(ids, fields, id_field, es_index_name, start_date, end_date)
    daily_search.aggs.bucket("unique_ids", 'terms', field=f'{id_field}.keyword')
    daily_search.aggs["unique_ids"] \
        .bucket("latest_data", 'top_hits', sort=sorting_params, size=1)
    return daily_search


def getAggregatedChannelStats(channel_ids, start_date=None, end_date=None, isMaxValues=True):
    """Given a list of channel IDs and a start/end date, return a dictionary of their **aggregated** statistics (views, videos published, and subscribers). ElasticSearch fetches the latest (max) daily entry and sums them."""
    content_eng = {'total_views': 0, 'total_subscribers': 0, 'total_videos': 0}
    try:
        queried_fields = ['total_views', 'total_videos', 'total_subscribers']
        channels_request = getLatestDailyChannelsRequest(channel_ids, queried_fields, start_date, end_date)
        if isMaxValues:
            channels_request.aggs \
                .metric('total_views', 'max', field='total_views') \
                .metric('total_videos', 'max', field='total_videos') \
                .metric('total_subscribers', 'max', field='total_subscribers')
        else:
            channels_request.aggs \
                .metric('total_views', 'sum', field='total_views') \
                .metric('total_videos', 'sum', field='total_videos') \
                .metric('total_subscribers', 'sum', field='total_subscribers')
        res = channels_request.execute()
        content_eng = {'total_views': elasticSearchResponseToInteger(res.aggregations.total_views),
                       'total_subscribers': elasticSearchResponseToInteger(res.aggregations.total_subscribers),
                       'total_videos': elasticSearchResponseToInteger(res.aggregations.total_videos)}
    except Exception as e:
        logger.error(e)
    return content_eng


def getAggregatedVideoStats(video_ids, start_date=None, end_date=None):
    """Given a list of video IDs and a start/end date, return a dictionary of their **aggregated** statistics (views, likes, dislikes, comments). ElasticSearch fetches the latest (max) daily entry and sums them."""
    content_eng = {'total_views': 0, 'total_likes': 0, 'total_dislikes': 0, 'total_comments': 0,
                   'video_daily_data_max': None}
    try:
        queried_fields = ['total_views', 'total_likes', 'total_dislikes', 'total_comments']
        videos_request = getLatestDailyVideosRequest(video_ids, queried_fields, start_date, end_date)
        videos_request.aggs \
            .metric('total_views', 'max', field='total_views') \
            .metric('total_likes', 'max', field='total_likes') \
            .metric('total_dislikes', 'max', field='total_dislikes') \
            .metric('total_comments', 'max', field='total_comments')
        res = videos_request.execute()
        content_eng = {'total_views': elasticSearchResponseToInteger(res.aggregations.total_views),
                       'total_likes': elasticSearchResponseToInteger(res.aggregations.total_likes),
                       'total_dislikes': elasticSearchResponseToInteger(res.aggregations.total_dislikes),
                       'total_comments': elasticSearchResponseToInteger(res.aggregations.total_comments)}
    except Exception as e:
        logger.error(e)
    return content_eng
