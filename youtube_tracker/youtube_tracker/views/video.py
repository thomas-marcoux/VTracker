"""
Views, utilities, and REST API calls related to video functions.

"""

# General imports
import dateutil.parser
import logging
import pandas as pd
import os

# Barcode imports
import base64
from io import BytesIO
import numpy as np
from PIL import Image

# Django imports
from django.db.models import Q
from django.forms.models import model_to_dict
from django.http import JsonResponse, Http404
from django.shortcuts import render
from django.template.loader import render_to_string
from django.core.exceptions import ObjectDoesNotExist

# Sub packages
from .youtubeUtils import YoutubeRequestBuilder, executeYouTubeQuery, formatYouTubeResponse
from .channel import addChannelEntry, getChannelDetails
from ..models import Videos, VideosDaily, Channels, RelatedVideos
from .genericUtilities import getTimeInSeconds
from .queryUtils import getTrackerVideoIDs, getTrackersWithRelationship, getTrackingNumbers
from .wrappers import ajax_post_required, ajax_get_required

logger = logging.getLogger(__name__)
videoCategoriesMapping = {
    '1': 'Film & Animation',
    '2': 'Autos & Vehicles',
    '10': 'Music',
    '15': 'Pets & Animals',
    '17': 'Sports',
    '18': 'Short Movies',
    '19': 'Travel & Events',
    '20': 'Gaming',
    '21': 'Videoblogging',
    '22': 'People & Blogs',
    '23': 'Comedy',
    '24': 'Entertainment',
    '25': 'News & Politics',
    '26': 'Howto & Style',
    '27': 'Education',
    '28': 'Science & Technology',
    '29': 'Nonprofits & Activism',
    '30': 'Movies',
    '31': 'Anime/Animation',
    '32': 'Action/Adventure',
    '33': 'Classics',
    '34': 'Comedy',
    '35': 'Documentary',
    '36': 'Drama',
    '37': 'Family',
    '38': 'Foreign',
    '39': 'Horror',
    '40': 'Sci-Fi/Fantasy',
    '41': 'Thriller',
    '42': 'Shorts',
    '43': 'Shows',
    '44': 'Trailers',
}


### Render


def videoCharacterization(request):
    """Return a render of the Video Characterization Page. This is a demo page using static values form a file and will change in the future."""
    try:
        ytt_directory = 'youtube_tracker'
        file_name = 'videoCharacterizationSample.csv'
        path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', ytt_directory, 'files', file_name)
        data_df = pd.read_csv(path)
        video_ids = list(data_df['video_id'])
        videos = list(Videos.objects.filter(video_id__in=video_ids).values('video_id', 'video_title'))
        videos_df = pd.DataFrame(videos)
        data_df = data_df.merge(videos_df, how="left", on='video_id')
        json_data = data_df.to_json(orient='records')
        return render(request, 'youtube_tracker/videoCharacterization.html', {'JSONContextData': json_data})
    except FileNotFoundError:
        raise Http404


### AJAX Calls


@ajax_get_required
def getVideo(request):
    """Return requested video object as dictionary."""
    video_id = None
    if request.GET:
        video_id = request.GET.get('videoId')
    if video_id is None:
        return JsonResponse({'status': 'false', 'message': 'Missing video ID.'}, status=500)
    try:
        video = Videos.objects.get(video_id=video_id)
    except ObjectDoesNotExist:
        return JsonResponse({'status': 'false', 'message': 'Video does not exist in the database.'}, status=500)
    return JsonResponse(model_to_dict(video), safe=False)


@ajax_get_required
def getVideoModal(request):
    """Return information to populate video modal."""
    video_id = request.GET.get('contentId')
    if video_id is None:
        return JsonResponse({'status': 'false', 'message': 'Missing video ID.'}, status=500)
    youtube_requester = YoutubeRequestBuilder(request.user, request.session)
    trackers = getTrackersWithRelationship(request, video_id)
    try:
        video_data = getVideoStatistics(youtube_requester, video_id)
        channel_id = video_data['snippet']['channelId']
    except Exception as e:
        return JsonResponse({'status': 'false', 'message': e.args[0]}, status=500)
    try:
        channel_data = getChannelDetails(youtube_requester, channel_id)
    except Exception as e:
        return JsonResponse({'status': 'false', 'message': e.args[0]}, status=500)
    video_data['totalTracking'], video_data['globalTracking'] = getTrackingNumbers(request, [video_id])
    video_data['totalTracking'] = video_data['totalTracking'][video_id]
    video_data['globalTracking'] = video_data['globalTracking'][video_id]
    return JsonResponse({'videoData': video_data, 'channelData': channel_data, 'trackerList': list(trackers)})


@ajax_get_required
def getRelatedVideos(request):
    """Return rendered view of a given video's related videos for modal display."""
    video_id = request.GET.get('contentId')
    if not video_id:
        return JsonResponse({'status': 'false', 'message': 'Missing video ID.'}, status=500)
    max_results = 20
    if request.GET.get('maxResults'):
        max_results = request.GET.get('maxResults')
    try:
        related_videos = getLiveRelatedVideos(request, video_id, max_results)
    except Exception:
        related_videos = getOfflineRelatedVideos(video_id, max_results)
    related_videos_render = render_to_string('youtube_tracker/modal_relatedVideos.html', {'items': related_videos})
    return JsonResponse({'related_videos': related_videos_render})


@ajax_post_required
def getTrackerVideos(request):
    """Return video IDs of videos matching the search value. Used in tracker details page to paginate search results."""
    tracker_id = request.POST.get('trackerId') if request.POST.get('trackerId') else None
    search_value = request.POST.get('searchValue') if request.POST.get('searchValue') else None
    if tracker_id is None:
        return JsonResponse({'status': 'false', 'message': 'Missing tracker ID.'}, status=500)
    video_ids = getTrackerVideoIDs(tracker_id)
    if search_value and len(search_value.strip()) > 0:
        video_ids = list(Videos.objects.filter(Q(video_id__in=video_ids, video_title__icontains=search_value))
                         .values_list('video_id', flat=True).order_by('-published_date'))
    return JsonResponse({'itemIDs': video_ids})


@ajax_post_required
def getPaginatedVideos(request):
    """Return rendered video items from select IDs, to be shown in the tracker details page."""
    video_ids = request.POST.getlist('itemIDs[]')
    barcode_width = int(request.POST.get('barcodeWidth')) if request.POST.get('barcodeWidth') else 2048
    videos = Videos.objects.filter(Q(video_id__in=video_ids))\
        .values('video_id', 'thumbnails_medium_url', 'video_title', 'published_date', 'channel_id', 'movie_barcode')\
        .order_by('-published_date')
    for video in videos:
        video['movie_barcode'] = getBarcode(video['movie_barcode'], barcode_width)
    channel_ids = [video['channel_id'] for video in videos]
    channels = list(Channels.objects.filter(Q(channel_id__in=channel_ids)).values('channel_id', 'channel_title'))
    for video in videos:
        video['channel_title'] = None
        for channel in channels:
            if video['channel_id'] == channel['channel_id']:
                video['channel_title'] = channel['channel_title']
    cards_render = render_to_string('youtube_tracker/tracker_itemsCard.html', {'videos': videos, 'user': request.user})
    return JsonResponse({'render': cards_render})


@ajax_post_required
def getSingleVideoBarcode(request):
    """Return video barcode with its duration, to be shown in video modal."""
    video_id = request.POST.get('videoId')
    as_list = True if request.POST.get('asList') == 'true' else False
    if video_id is None:
        return JsonResponse({'status': 'false', 'message': 'Missing video ID.'}, status=500)
    barcode_width = int(request.POST.get('barcodeWidth')) if request.POST.get('barcodeWidth') else 2048
    barcode_height = int(request.POST.get('barcodeHeight')) if request.POST.get('barcodeHeight') else None
    video = Videos.objects.filter(Q(video_id=video_id)).values('video_id', 'video_title', 'movie_barcode')[0]
    if video['movie_barcode'] is None:
        return JsonResponse({'error': 'No movie barcode available for this video.'}, status=404)
    video['movie_barcode'] = getBarcode(video['movie_barcode'], barcode_width, barcode_height, as_list)
    in_seconds = True
    video_duration = None
    try:
        video_duration = getVideoDuration(request, video_id, in_seconds)
    except Exception as e:
        logger.error("API error {0} : {1}".format(e.args[1], e.args[0]))
    return JsonResponse({'barcode': video, 'duration': video_duration})


### Utility Functions


def getLiveVideoDetails(youtube, video_id):
    """Return live video details from the YouTube API for modal display."""
    query = youtube.videos().list(part='statistics,snippet,contentDetails', id=video_id,)
    data = executeYouTubeQuery(query)
    data = data['items'][0]
    data['viewCount'] = formatYouTubeResponse(data, 'viewCount')
    data['likeCount'] = formatYouTubeResponse(data, 'likeCount')
    data['dislikeCount'] = formatYouTubeResponse(data, 'dislikeCount')
    data['commentCount'] = formatYouTubeResponse(data, 'commentCount')
    data['duration'] = formatYouTubeResponse(data, 'duration', True)
    return data


def getOfflineVideoStatistics(video_id):
    """Return video details from the database for modal display."""
    data = {}
    try:
        video = Videos.objects.get(video_id=video_id)
    except ObjectDoesNotExist:
        video = None
    try:
        video_daily = VideosDaily.objects.filter(video_id=video_id).order_by('-extracted_date')[0]
    except IndexError:
        video_daily = None
    if video and video_daily:
        data = {
            'viewCount': video_daily.total_views,
            'likeCount': video_daily.total_likes,
            'dislikeCount': video_daily.total_dislikes,
            'commentCount': video_daily.total_comments,
            'snippet': {
                'channelId': video.channel.channel_id if video else None,
                'title': video.video_title if video else None,
            },
            'duration': None,
        }
    return data


def getLiveRelatedVideos(request, video_id, max_results):
    """Return live related videos details from the YouTube API for modal display."""
    related_videos = []
    query_params = {'part': "id,snippet", 'type': 'video', 'relatedToVideoId': video_id, 'maxResults': max_results}
    youtube_requester = YoutubeRequestBuilder(request.user, request.session)
    query = youtube_requester.search().list(**query_params)
    data = executeYouTubeQuery(query)
    for item in data['items']:
        try:
            related_video = {
                'video_id': item['id']['videoId'],
                'title': item['snippet']['title'],
                'thumbnails_medium_url': item['snippet']['thumbnails']['default']['url'],
                'published_date': dateutil.parser.parse(item['snippet']['publishedAt']),
                'channel_title': item['snippet']['channelTitle'],
                'duration': getVideoDuration(request, item['id']['videoId'])
                }
            related_videos.append(related_video)
        except KeyError:
            pass
    return related_videos


def getOfflineRelatedVideos(video_id, max_results):
    """Return related videos details from the database for modal display."""
    related_videos = []
    content = RelatedVideos.objects.filter(parent_video=video_id)[:max_results]
    if content:
        for item in content:
            related_video = {
                'title': item.title,
                'thumbnails_medium_url': item.thumbnails_medium_url,
                'published_date': item.published_date, 'channel_title': item.channel_title,
                'duration': None
                }
            related_videos.append(related_video)
    return related_videos


def getVideoStatistics(youtube, video_id):
    """Return video details. Attempts to query the live API, then the database."""
    try:
        data = getLiveVideoDetails(youtube, video_id)
    except Exception:
        data = getOfflineVideoStatistics(video_id)
    return data


def addVideoEntry(request, video_id):
    """Query live data for given video_id and insert to DB along with its parent channel."""
    try:
        video = Videos.objects.get(video_id=video_id)
        return video
    except ObjectDoesNotExist:
        pass
    youtube_requester = YoutubeRequestBuilder(request.user, request.session)
    query = youtube_requester.videos().list(part='statistics,snippet', id=video_id,).execute()
    data = None
    try:
        data = executeYouTubeQuery(query)
    except Exception:
        pass
    if not data or 'items' not in data or len(data['items']) == 0:
        raise Exception("Video {0} unavailable. No entry was created.".format(video_id))
    data = data['items'][0]
    try:
        channel = addChannelEntry(request, data['snippet']['channelId'])
    except Exception:
        raise Exception("Video {0} was not added to the tracker. Cannot find channel.".format(video_id))
    video = Videos.objects.create(
        video_id=video_id,
        video_title=data['snippet']['title'],
        category=videoCategoriesMapping[data['snippet']['categoryId']],
        published_date=data['snippet']['publishedAt'],
        thumbnails_medium_url=data['snippet']['thumbnails']['medium']['url'],
        description=data['snippet']['description'],
        channel=channel,
        )
    return video


def getVideoDuration(request, video_id, in_seconds=False):
    """Return duration of given video_id. In displayable format by default or in seconds if specified."""
    youtube_requester = YoutubeRequestBuilder(request.user, request.session)
    video_data = youtube_requester.videos().list(part='contentDetails', id=video_id).execute()
    duration = formatYouTubeResponse(video_data['items'][0], 'duration', is_date=True)
    if in_seconds:
        duration = getTimeInSeconds(str(duration))
    return duration


def getBarcode(json_barcode, width=1024, height=12, as_list=False):
    """Return barcode from the DB's video's JSON array."""
    if not json_barcode:
        return None
    np_array = np.array(json_barcode, dtype="int")  # Parse the numpy list from string
    flipped_array = np.flip(np.array(np_array).astype('int'), 1)  # Switch from BGR to RGB values
    new_img = np.expand_dims(np.array(flipped_array), axis=0)  # Add dimension to convert matrix to image tensor
    new_image = np.repeat(new_img, [224], axis=0)
    new_image = new_image.astype(np.uint8)
    img = Image.fromarray(new_image)  # Convert image tensor to Pillow Image object
    img = img.resize(size=(width, height))
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    if as_list:
        return np.array(img).tolist()
    else:
        base64_encoded_result_bytes = base64.b64encode(buffered.getvalue())
        base64_encoded_result_str = base64_encoded_result_bytes.decode('ascii')
        return base64_encoded_result_str
