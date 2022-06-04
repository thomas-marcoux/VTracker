"""
Utilities & REST API functions for YouTube searching.

"""

# General imports
import logging
import dateutil.parser
from datetime import datetime, timedelta
from urllib.parse import urlparse

# Django imports
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.http import Http404
from django.template.loader import render_to_string

# Sub packages
from .youtubeUtils import YoutubeRequestBuilder, contentIsChannel, contentIsVideo, executeYouTubeQuery
from ..models import Videos
from .video import getVideoStatistics
from .channel import getLiveChannelDetails
from .wrappers import ajax_get_required

logger = logging.getLogger(__name__)

MAX_QUERY_COUNT = 60
DEFAULT_QUERY_COUNT = 20


### AJAX Calls


@ajax_get_required
def getContentCards(request):
    """Query YouTube API and return rendered card results."""
    search_value = request.GET.get('q', '')
    try:
        results, next_token, total_results = searchYoutube(request, search_value)
        # [Not yet implemented] results, nextPageToken = searchDatabase(request, input)
    except Exception as e:
        return JsonResponse({'status': 'false', 'message': e.args[0]}, status=500)
    cards_render = render_to_string('youtube_tracker/home_card.html', {'items': results})
    return JsonResponse({'render': cards_render, 'nextPageToken': next_token, 'totalResults': total_results})


def extractChannelID(channel_url):
    """Extract channel id from a YouTube URL."""
    try:
        if urlparse(channel_url).scheme != '':
            channel_id = urlparse(channel_url).path.strip('/channel/')
            return JsonResponse({"channel_id": channel_id}), 200
        else:
            return JsonResponse({"message": "Not a channel URL"}), 300
    except Exception as e:
        logger.error(e)
        return JsonResponse({"message": "Error parsing : " + str(e)}), 500


def extractVideoID(video_url):
    """Extract video id from a YouTube URL."""
    try:
        query = urlparse(video_url)
        if query.hostname == 'youtu.be':
            return JsonResponse({"video_id": query.path[1:]}), 200
        if query.hostname in ('www.youtube.com', 'youtube.com', 'm.youtube.com'):
            if query.path == '/watch':
                p = query.query
                return JsonResponse({"video_id": p[2:]}), 200
            if query.path[:7] == '/embed/':
                return JsonResponse({"video_id": query.path.split('/')[2]}), 200
            if query.path[:3] == '/v/':
                return JsonResponse({"video_id": query.path.split('/')[2]}), 200
        if query.query[:2] == 'v=':
            return JsonResponse({"video_id": query.query.split('=')[1]}), 200
        return JsonResponse({"message": "Not a video URL"}), 300
    except Exception as e:
        logger.error(e)
        return JsonResponse({"message": "Error parsing : " + str(e)}), 500


@ajax_get_required
def extractFromURL(request):
    """Unused - Extract content ID from given URL."""
    try:
        search_value = request.GET.get('q')
        if request.GET.get('type') == 'channel':
            response, code = extractChannelID(search_value)
            response.status_code = code
        elif request.GET.get('type') == 'video':
            response, code = extractVideoID(search_value)
            response.status_code = code
        else:
            raise Http404
        return response
    except Exception as e:
        logger.error(e)
        return JsonResponse({"message": "Error parsing : " + str(e)}), 500


### Utility Functions


def getPublishedAfterDate(date_range):
    """Get time delta value for querying. From string time interval."""
    date = datetime.today()
    if date_range == "day":
        date = date - timedelta(days=1)
    if date_range == "week":
        date = date - timedelta(weeks=1)
    if date_range == "month":
        date = date - timedelta(days=30)
    return date.isoformat("T") + "Z"


def buildQueryParameters(request):
    """Build YouTube search query parameters from given GET parameters."""
    query = {'q': request.GET.get('q', ''), 'part': "id,snippet", 'type': 'video,channel'}
    query_count = int(request.GET.get('queryCount'))
    if request.GET.get('queryCount'):
        query['maxResults'] = query_count if (query_count <= MAX_QUERY_COUNT) else DEFAULT_QUERY_COUNT
    if request.GET.get('order'):
        query['order'] = request.GET.get('order')
    if request.GET.get('nextPageToken'):
        query['pageToken'] = request.GET.get('nextPageToken')
    if request.GET.get('channelId'):
        query['channelId'] = request.GET.get('channelId')
    if request.GET.get('pba') and request.GET.get('pba') != "none":
        query['publishedAfter'] = getPublishedAfterDate(request.GET.get('pba'))
    return query


def searchYoutube(request, search_value):
    """Return YouTube items to be rendered, with the next page token for scrolling, and total results."""
    youtube_requester = YoutubeRequestBuilder(request.user, request.session)
    if youtube_requester is False:
        return JsonResponse({'noKey': True, 'nextPageToken': 'null'})
    query_params = buildQueryParameters(request)
    query = youtube_requester.search().list(**query_params)
    search_response = executeYouTubeQuery(query)
    try:
        next_token = search_response['nextPageToken']
    except KeyError:
        next_token = 'null'
    try:
        total_results = search_response['pageInfo']['totalResults']
    except KeyError:
        total_results = 'null'
    results = []
    try:
        if request.user.is_authenticated:
            single_return = contentIsVideo(search_value)
            single_return |= contentIsChannel(search_value)
            for i in search_response['items']:
                item = {}
                if i['id']['kind'] == 'youtube#channel':
                    item['channel_id'] = i['id']['channelId']
                    item['publishedAt'] = dateutil.parser.parse(i['snippet']['publishedAt'])
                    item['metaData'] = getLiveChannelDetails(youtube_requester, i['id']['channelId'])
                elif i['id']['kind'] == 'youtube#video':
                    item['video_id'] = i['id']['videoId']
                    item['metaData'] = getVideoStatistics(youtube_requester, i['id']['videoId'])
                    item['thumbnails_medium_url'] = item['metaData']['snippet']['thumbnails']['medium']['url']
                    item['channel'] = item['metaData']['snippet']['channelId']
                    item['channel_title'] = item['metaData']['snippet']['channelTitle']
                    item['publishedAt'] = dateutil.parser.parse(item['metaData']['snippet']['publishedAt'])
                    item['video_title'] = item['metaData']['snippet']['title']
                results.append(item)
                if single_return:  # If the query is an ID, only return the corresponding item
                    break
    except Exception as e:
        logger.error(e)
    return results, next_token, total_results


def searchDatabase(request, search_value):
    """Unused/Unfinished - Return search results from the database instead of YouTube."""
    if contentIsVideo(input):
        items = Videos.objects.filter(video_id=search_value)
    else:
        items = Videos.objects.filter(video_title__icontains=search_value)
        # items = Videos.objects.order_by('-modified_to_db_time').all()
    paginator = Paginator(items, per_page=20)
    page_num = request.GET.get('nextPageToken', 1)
    page_num = int(page_num) if len(page_num) > 0 else 1
    # if page_num > paginator.num_pages:
    #     raise Http404
    results = paginator.page(page_num).object_list.values()
    next_token = page_num + 1
    # try:
    #     if request.user.is_authenticated:
    #         for item in results:
    #             item['channel_title'] = Channels.objects.filter(channel_id=item['channel_id']).values()['channel_id']
    # except Exception as e:
    #     print(e)
    return results, next_token
