"""
Render, utilities, and REST API functions for the Posting Frequency page.

"""

# General imports
import json
import logging
from dateutil.relativedelta import relativedelta

# Django imports
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string

# Sub packages
from ..models import Channels, ChannelsDaily
from .genericUtilities import abbreviateNumber, convertToDate, getLatestEntry, getMaxDictKey, parseRequest
from .contentAnalysis import getVideoCategoryDistribution
from .queryUtils import getAggregatedChannelStats, getChannels, getChannelsVideos, getDateRangeVideoRequest, \
    setTrackerDateRange, getTrackerDetails, getTrackerVideoIDs, getPageData
from .wrappers import ajax_post_required

logger = logging.getLogger(__name__)


@login_required
def postingFrequencyAnalytics(request, tracker_id):
    """Return a render of the Posting Frequency Page given the ID of the tracker. """
    tracker_data = getTrackerDetails(request, tracker_id)
    tracker_data['channels'] = getChannels(tracker_id)
    setTrackerDateRange(tracker_data)
    # See if below works well when date picker is implemented
    # tracker_data['end_date'] = getLatestEntry(channels, 'joined_date', offset=relativedelta(months=6))
    # tracker_data['start_date'] = tracker_data['end_date'] - relativedelta(years=1)
    return render(request, 'youtube_tracker/postingFrequencyAnalytics.html',
                  {
                      'trackerData': tracker_data,
                      'breadCrumbTrail': {'Dashboard': 'dashboardAnalytics'},
                      'pageTitle': 'Posting Frequency',
                      'JSONContextData': json.dumps(tracker_data, indent=4, sort_keys=True, default=str),
                  })


### AJAX Calls - Posting Frequency Chart


@ajax_post_required
def postingFrequencyPostingChart(request):
    """Return list of histogram dates & count of publications to display Posting Frequency Chart."""
    request_args = parseRequest(request)
    channel_ids = request_args['channel_ids[]']
    channels = getChannels(channel_ids, values=['channel_id', 'channel_title'])
    channels = {channel['channel_id']: channel['channel_title'] for channel in channels}
    queried_fields = ['published_date, channel_id']
    video_search = getDateRangeVideoRequest(channel_ids, queried_fields, id_field='channel_id')
    video_search.aggs.bucket('group_by_channel', 'terms', field='channel_id.keyword').\
        bucket('group_by_date', 'date_histogram', field='published_date', calendar_interval='1w', format='yyyy-MM-dd')
    series = []
    res = video_search.execute()
    for channel in res.aggregations.group_by_channel.buckets:
        data = []
        for hits in channel.group_by_date.buckets:
            data.append((convertToDate(hits.key_as_string), hits.doc_count))
        series.append({'name': channels[channel.key], 'data': data})
    return JsonResponse({'series': series})


@ajax_post_required
def postingFrequencyRibbonStatistics(request):
    """Return a rendered statistics ribbon for the dashboard analytics."""
    #channel_ids = request.POST.getlist('channel_ids[]')

    # (This should become active and replace the behavior below to fetch the actual dates) start_date, end_date, interval, interval_format = getRequestTimeParameters(request)    

    request_args = parseRequest(request)
    channel_ids = request_args['channel_ids[]']
    channel_stats = getAggregatedChannelStats(channel_ids, isMaxValues=True)
    channel_stats = {k: abbreviateNumber(v) for k, v in channel_stats.items()}
    channel_locations = getChannelLocations(channel_ids)

    maxLocation = getMaxDictKey(channel_locations)

    if not maxLocation:
        maxLocation = ""
    channel_stats.update({'top_location': maxLocation})
    ribbon_render = render_to_string('youtube_tracker/postingFrequency_ribbon.html', {'contextData': channel_stats})
    return JsonResponse({'render': ribbon_render})


### AJAX Calls - Channel's videos category chart


@ajax_post_required
def postingFrequencyCategoryChart(request):
    """Return list of video categories to display the Category Chart."""
    request_args = parseRequest(request)
    channel_ids = request_args['channel_ids[]']
    video_ids = getChannelsVideos(channel_ids)
    series = getVideoCategoryDistribution(video_ids)
    return JsonResponse({'series': series})


### AJAX Calls - Channel map table


@ajax_post_required
def postingFrequencyMapList(request):
    """Return channel data for the channel map table."""
    request_args = parseRequest(request)
    channel_ids = request_args['channel_ids[]']
    channel_data = getChannelsStatistics(channel_ids)
    table_render = render_to_string('youtube_tracker/postingFrequency_mapTable.html', {'contextData': channel_data})
    return JsonResponse({'render': table_render})


@ajax_post_required
def postingFrequencyMapChart(request):
    request_args = parseRequest(request)
    channel_ids = request_args['channel_ids[]']
    channel_data = getChannelLocations(channel_ids)
    return JsonResponse({'series': channel_data})


### AJAX Calls - Channel details table


@ajax_post_required
def postingFrequencyChannelDetails(request):
    """Return channel details for the channel data table."""
    channel_ids = parseRequest(request)['channel_ids[]']
    channel_data = getChannelsStatistics(channel_ids)
    channel_data_values = channel_data.values()
    pop_headers = ["channel_id", "joined_date", "description", "language"]
    channel_detail = []
    for item in channel_data_values:
        [item.pop(key) for key in pop_headers]
        item['Name'] = item.pop('channel_title')
        item['Subscribers'] = item.pop('total_subscribers')
        item['Videos'] = item.pop('total_videos')
        item['Views'] = item.pop('total_views')
        item['Location'] = item.pop('location')
        channel_detail.append(item)

    channel_detail_data = Paginator(channel_detail, 2000)
    channel_details = getPageData(channel_detail_data)
    return JsonResponse({'data': channel_details})


# Utility Functions


def getChannelsStatistics(channel_ids, start_date=None, end_date=None):
    """Return a dictionary of channel data for the given channel IDs, between the given date bracket. Data includes each channel's **respective** number of videos and its videos' **aggregated** number of comments and views."""
    channels = getChannels(channel_ids, as_dict=True)
    for channel_id in channel_ids:
        latest_channel_daily = ChannelsDaily.objects.filter(channel_id=channel_id).order_by('-extracted_date'). \
            values('total_views', 'total_subscribers', 'total_videos', 'extracted_date').first()
        if not latest_channel_daily:
            latest_channel_daily = {'total_views': 0, 'total_subscribers': 0, 'total_videos': 0, 'extracted_date': None}
        channels[channel_id]['total_views'] = latest_channel_daily['total_views']
        channels[channel_id]['total_subscribers'] = latest_channel_daily['total_subscribers']
        channels[channel_id]['total_videos'] = latest_channel_daily['total_videos']
    return channels


def getChannelLocations(channel_ids):
    """For each channel ID, fetch location information."""
    data = {}
    channels_qs = Channels.objects.filter(channel_id__in=channel_ids)
    channels = list(channels_qs.values('location'))
    for channel in channels:
        if channel['location'] is not None:
            if channel['location'] == 'N/A':
                channel['location'] = 'Not Public'
            if channel['location'] not in data.keys():
                data[channel['location']] = 0
        else:
            channel['location'] = 'Data N/A'
        data[channel['location']] += 1
    return data
