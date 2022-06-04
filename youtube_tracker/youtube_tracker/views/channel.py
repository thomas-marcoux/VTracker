"""
Utilities and REST API calls related to channel functions.

"""

# General imports
import logging

# Django imports
from django.http import JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.template.loader import render_to_string

# Sub packages
from .genericUtilities import detectLanguage
from .youtubeUtils import YoutubeRequestBuilder, executeYouTubeQuery, formatYouTubeResponse
from ..models import Channels, ChannelsDaily
from .queryUtils import getTrackersWithRelationship, getTrackingNumbers
from .wrappers import ajax_get_required

logger = logging.getLogger(__name__)


### AJAX Calls

@ajax_get_required
def getChannelModal(request):
    """Return information to populate channel modal."""
    channel_id = request.GET.get('contentId')
    if channel_id is None:
        return JsonResponse({'status': 'false', 'message': 'Missing channel ID.'}, status=500)
    youtube_requester = YoutubeRequestBuilder(request.user, request.session)
    trackers = getTrackersWithRelationship(request, channel_id)
    try:
        channel_data = getChannelDetails(youtube_requester, channel_id, True)
    except Exception as e:
        return JsonResponse({'status': 'false', 'message': e.args[0]}, status=500)
    channel_data['totalTracking'], channel_data['globalTracking'] = getTrackingNumbers(request, [channel_id])
    channel_data['totalTracking'] = channel_data['totalTracking'][channel_id]
    channel_data['globalTracking'] = channel_data['globalTracking'][channel_id]
    return JsonResponse({'channelData': channel_data, 'trackerList': list(trackers)})


@ajax_get_required
def getFeaturedChannels(request):
    """Return rendered view of a given channel's featured channels for modal display."""
    featured_channel_ids = []
    parent_channel_id = request.GET.get('contentId')
    if parent_channel_id is None:
        return JsonResponse({'status': 'false', 'message': 'Missing channel ID.'}, status=500)
    query_params = {'part': 'contentDetails', 'channelId': parent_channel_id}
    youtube = YoutubeRequestBuilder(request.user, request.session)
    query = youtube.channelSections().list(**query_params)
    try:
        response = executeYouTubeQuery(query)
    except Exception as e:
        return JsonResponse({'status': 'false', 'message': e.args[0]}, status=500)
    items = response['items'][0]
    try:
        featured_channels = items['contentDetails']['channels']
    except KeyError:
        featured_channels = "null"
        return JsonResponse({'featuredChannels': featured_channels})
    for channel_id in featured_channels:
        featured_channel_ids.append(channel_id)
    channel_ids = ','.join([str(elem) for elem in featured_channel_ids])
    channels_data = getMultipleChannelsData(youtube, channel_ids)
    featured_channels_render = render_to_string('youtube_tracker/modal_featuredChannels.html', {'items': channels_data})
    return JsonResponse({'featuredChannels': featured_channels_render})


@ajax_get_required
def getChannelVideos(request):
    """Return rendered view of a given channel's featured videos for modal display."""
    channel_id = request.GET.get('contentId')
    if channel_id is None:
        return JsonResponse({'status': 'false', 'message': 'Missing channel ID.'}, status=500)
    youtube_requester = YoutubeRequestBuilder(request.user, request.session)
    channel_video_ids, code = getChannelVideoIds(youtube_requester, channel_id)
    if len(channel_video_ids) == 0:
        return JsonResponse({'channelVideos': 'null', 'responseCode': code})
    channel_videos = []
    query_params = {'part': 'snippet,statistics,contentDetails'}
    for video_id in channel_video_ids:
        query_params['id'] = video_id
        video_data = {}
        try:
            query = youtube_requester.videos().list(**query_params)
            response = executeYouTubeQuery(query)
        except Exception as e:
            return JsonResponse({'status': 'false', 'message': e.args[0]}, status=500)
        item = response['items'][0]
        video_data['channelTitle'] = item['snippet']['channelTitle']
        video_data['duration'] = formatYouTubeResponse(item, 'duration', is_date=True)
        video_data['viewCount'] = formatYouTubeResponse(item, 'viewCount')
        video_data['likeCount'] = formatYouTubeResponse(item, 'likeCount')
        video_data['dislikeCount'] = formatYouTubeResponse(item, 'dislikeCount')
        video_data['thumbnailsMediumUrl'] = item['snippet']['thumbnails']['medium']['url']
        video_data['videoTitle'] = item['snippet']['title']
        video_data['publishedAt'] = item['snippet']['publishedAt']
        video_data['videoId'] = video_id
        channel_videos.append(video_data)
    if len(channel_videos) == 0:
        return JsonResponse({'channelVideos': 'null', 'responseCode': 500})
    channel_videos_render = render_to_string('youtube_tracker/modal_featuredVideos.html', {'items': channel_videos})
    return JsonResponse({'channelVideos': channel_videos_render, 'responseCode': code})


### Utility Functions


def getLiveChannelDetails(youtube, channel_id, extra_data=False):
    """Return live channel details from the YouTube API for modal display."""
    query = youtube.channels().list(part='statistics,snippet,brandingSettings,contentDetails', id=channel_id) \
        if extra_data else youtube.channels().list(part='statistics,snippet', id=channel_id,)
    data = executeYouTubeQuery(query)
    data = data['items'][0]
    data['statistics']['viewCount'] = formatYouTubeResponse(data, 'viewCount')
    data['statistics']['subscriberCount'] = formatYouTubeResponse(data, 'subscriberCount')
    data['statistics']['videoCount'] = formatYouTubeResponse(data, 'videoCount')
    data['statistics']['commentCount'] = formatYouTubeResponse(data, 'commentCount')
    return data


def getOfflineChannelDetails(channel_id):
    """Return channel details from the database for modal display."""
    data = None
    try:
        channel = Channels.objects.get(channel_id=channel_id)
    except ObjectDoesNotExist:
        channel = None
    try:
        channel_daily = ChannelsDaily.objects.filter(channel_id=channel_id).order_by('-extracted_date')[0]
    except IndexError:
        channel_daily = None
    if channel and channel_daily:
        data = {
            'statistics': {
                    'subscriberCount': channel_daily.total_subscribers,
                    'viewCount': channel_daily.total_views,
                    'videoCount': channel_daily.total_videos
                },
            'snippet': {
                'thumbnails': {
                    'default': {
                        'url': channel.thumbnails_medium_url,
                    }
                },
                'title': channel.channel_title,
                'publishedAt': channel.joined_date,
            }
        }
    return data


def getChannelDetails(youtube, channel_id, extra_data=False):
    """Return channel details. Attempts to query the live API, then the database."""
    try:
        data = getLiveChannelDetails(youtube, channel_id, extra_data)
    except Exception:
        data = getOfflineChannelDetails(channel_id)
    return data


def getMultipleChannelsData(youtube_request, channels):
    """Return live channels details for display in the channel modal's featured channels."""
    query = youtube_request.channels().list(part='id,snippet,statistics', id=channels)
    channel_items = executeYouTubeQuery(query)
    channels_data = []
    for item in channel_items:
        channel_data = {'channelTitle': item['snippet']['title'],
                        'subscriberCount': formatYouTubeResponse(item, 'subscriberCount'),
                        'viewCount': formatYouTubeResponse(item, 'viewCount'),
                        'videoCount': formatYouTubeResponse(item, 'videoCount'),
                        'thumbnailsMediumUrl': item['snippet']['thumbnails']['medium']['url'],
                        'publishedAt': item['snippet']['publishedAt']}
        channels_data.append(channel_data)
    return channels_data


def getChannelVideoIds(youtube_request, channel_id):
    """Return a channel's playlist(s)' video ids."""
    video_ids = []
    max_results = 50
    max_videos = 50
    channel_playlists, code = getChannelPlaylistIds(youtube_request, channel_id, max_results)
    if len(channel_playlists) == 0:
        return video_ids, code
    query_params = {'part': 'id,contentDetails', 'maxResults': max_videos}
    for playlist_id in channel_playlists:
        query_params['playlistId'] = playlist_id
        query = youtube_request.playlistItems().list(**query_params)
        try:
            response = executeYouTubeQuery(query)
        except Exception as e:
            return video_ids, e.args[1]
        for item in response['items']:
            video_ids.append(item['contentDetails']['videoId'])
            if len(video_ids) >= max_videos:
                return video_ids, code
    return video_ids, code


def getChannelPlaylistIds(youtube_request, channel_id, max_results=50):
    """Return a channel's playlist(s) IDs, if any."""
    playlist_ids = []
    query_params = {'part': 'id', 'channelId': channel_id, 'maxResults': max_results}
    code = "200"
    query = youtube_request.playlists().list(**query_params)
    try:
        response = executeYouTubeQuery(query)
    except Exception as e:
        return playlist_ids, e.args[1]
    try:
        for item in response['items']:
            playlist_ids.append(item['id'])
    except IndexError:
        logger.error("{0}: No playlists for channel with id {1}".format(IndexError, channel_id))
        return playlist_ids, code
    except Exception:
        return playlist_ids, code
    return playlist_ids, code


def addChannelEntry(request, channel_id):
    """Query live data for given channel_id and insert to DB."""
    try:
        channel = Channels.objects.get(channel_id=channel_id)
        return channel
    except ObjectDoesNotExist:
        pass
    youtube = YoutubeRequestBuilder(request.user, request.session)
    query = youtube.channels().list(part='statistics,snippet', id=channel_id)
    data = None
    try:
        data = executeYouTubeQuery(query)
    except Exception:
        pass
    if not data or 'items' not in data or len(data['items']) == 0:
        raise Exception("Channel {0} unavailable. No entry was created.".format(channel_id))
    data = data['items'][0]
    if 'country' not in data['snippet']:
        data['snippet']['country'] = 'Not provided'
    if 'publishedAt' not in data['snippet']:
        data['snippet']['publishedAt'] = None
    channel = Channels.objects.create(
        channel_id=channel_id,
        channel_title=data['snippet']['title'],
        joined_date=data['snippet']['publishedAt'],
        thumbnails_medium_url=data['snippet']['thumbnails']['medium']['url'],
        description=data['snippet']['description'],
        location=data['snippet']['country'],
        language=detectLanguage(data['snippet']['description']))
    return channel
