from urllib import parse
import re

from youtube_tracker.views import contentIsVideo, contentIsChannel

def splitInput(input):
	return list(set(filter(None, re.split(r',|\s', input))))

def splitKeywords(input):
	keywords = re.split(r',|\s', input)
	return list(set(filter(None, keywords)))

def contentIsURL(input):
	parsed = parse.urlparse(input)
	return (len(parsed.scheme) > 0 and len(parsed.netloc) > 0 )

# Extracts ID from different possible Youtube URLs
def getIDfromURL(url):
	split = parse.urlsplit(url)
	params = parse.parse_qs(split.query)
	# Channel
	capture = re.search(r'/channel/([\_\-0-9a-zA-Z_]*)', split.path)
	if capture:
		return capture.group(1)
	# Video
	capture = re.search(r'/embed/([\_\-0-9a-zA-Z]*)', split.path)
	if capture:
		return capture.group(1)
	if 'v' in params:
		return params['v'][0]
	if 'u' in params:
		capture = re.search(r'v=([\_\-0-9a-zA-Z]*)', params['u'][0])
		if capture:
			return capture.group(1)
	if split.hostname == 'youtu.be':
		capture = re.search(r'/([\_\-0-9a-zA-Z]*)', split.path)
		if capture:
			return capture.group(1)
	return ''

def getYouTubeIDs(yt_content, captureChannels=True):
	channel_ids = set()
	video_ids = set()
	error_log = []
	# Create a new entry for each piece of content
	for s in yt_content:
		buff = s
		if (contentIsURL(s)):
			s = getIDfromURL(s)
		if (captureChannels and contentIsChannel(s)):
			channel_ids.add(s)
		elif (contentIsVideo(s)):
			video_ids.add(s)
		else:
			error_log.append(buff)
	channel_ids = list(channel_ids)
	video_ids = list(video_ids)
	return channel_ids, video_ids, error_log

def getIDs(addContentForm):
	yt_content = splitInput(addContentForm.cleaned_data['content_list'])
	channel_ids, video_ids, error_log = getYouTubeIDs(yt_content)
	keyword_ids = splitKeywords(addContentForm.cleaned_data['keyword_list'])
	return channel_ids, video_ids, keyword_ids, error_log

def getDailyIDs(addContentForm):
	yt_daily_content = splitInput(addContentForm.cleaned_data['daily_content_list'])
	channel_ids, video_ids, error_log = getYouTubeIDs(yt_daily_content, captureChannels=False)
	return video_ids, error_log
