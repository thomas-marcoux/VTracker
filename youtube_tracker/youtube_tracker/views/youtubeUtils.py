"""
Utilities for querying and handling data from the YouTube API.

"""

# General imports
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import isodate
import logging
import requests
import re

# Config imports
from youtube_tracker.settings import YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION, \
    DEVELOPER_KEY, YOUTUBE_CHANNEL_ID_LENGTH, YOUTUBE_VIDEO_ID_LENGTH

# OAuth2 imports
from oauth2client.client import AccessTokenCredentials

logger = logging.getLogger(__name__)


def YoutubeRequestBuilder(user, session):
    """Return object to query YouTube APi. None if user is not logged in."""
    youtube_requester = None
    if user.is_authenticated:
        if session.get('oauth_access_token') is not None:
            logger.info("-----Accessing YouTube API using user token-----")
            try:
                youtube_requester = build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION,
                                          credentials=AccessTokenCredentials(session.get('oauth_access_token'),
                                                                             'user-agent-value'))
            except Exception as e:
                logger.error("Error querying YouTube API: ", e)
        else:
            logger.info("-----Accessing YouTube API using API key-----")
            youtube_requester = build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION, developerKey=DEVELOPER_KEY)
    return youtube_requester


def executeYouTubeQuery(query):
    """Queries the YouTube API and return the response while formatting any Exception. Raises Exception if querying failed."""
    try:
        data = query.execute()
    except HttpError as e:
        error_code = e.resp.status
        error_message = cleanHtml(str(e))
        logger.error("API error {0} : {1}".format(error_code, error_message))
        raise Exception(error_message, error_code)
    return data


def cleanHtml(raw_html):
    """Processes raw HTML error responses for display."""
    groups = re.findall('^<(.*)>$', raw_html)
    return groups[0]


def contentIsYoutubeID(content):
    """Check whether id matches YouTube ID characters."""
    regexp = re.compile(r'[_\-0-9a-zA-Z]*')
    return regexp.search(content)


def contentIsChannel(content_id):
    """Check whether id matches YouTube channel ID format."""
    return not (not contentIsYoutubeID(content_id) or not (
                len(content_id) == YOUTUBE_CHANNEL_ID_LENGTH)) and content_id.startswith('UC')


def contentIsVideo(content_id):
    """Check whether id matches YouTube video ID format."""
    return contentIsYoutubeID(content_id) and (len(content_id) == YOUTUBE_VIDEO_ID_LENGTH)


def formatYouTubeResponse(item, key, is_date=False):
    """Return value formatted for display from a YouTube response. Defaults to '0' if key is missing."""
    value = '0'
    try:
        value = "{:,}".format(int(item['statistics'][key], 10))\
            if not is_date else isodate.strftime(isodate.parse_duration(item['contentDetails'][key]), "%H:%M:%S")
    except KeyError:
        pass
    return value


def videoExists(content_id):
    """Check whether content_id points to an available YouTube video."""
    url = "http://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=" + content_id
    response = requests.get(url)
    return response.status_code == 200
