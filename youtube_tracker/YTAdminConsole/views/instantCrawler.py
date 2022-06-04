from django.shortcuts import render
from django.core.exceptions import ValidationError
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core import serializers

from ..forms import AddContentForm
from .lib import getIDs

import logging, requests

logger = logging.getLogger(__name__)

def buildRequest(form):
	channel_ids, video_ids, keyword_ids, error_log = getIDs(form)
	data = {
		'channel_ids': channel_ids,
		'keyword_ids': keyword_ids,
		'video_ids': video_ids,
		'get_videos': form.cleaned_data['get_videos'],
		'get_videos_daily': form.cleaned_data['get_videos_stats'],
		'get_channels': form.cleaned_data['get_channels'],
		'get_channels_daily': form.cleaned_data['get_channels_stats'],
		'get_related_videos': form.cleaned_data['get_related_videos'],
		'get_comments': form.cleaned_data['get_comments'],
		'run_name': form.cleaned_data['run_name'],
		'parallel_process': form.cleaned_data['parallel_process']
	}

	if 'slack_name' in form.cleaned_data and len(form.cleaned_data['slack_name']) > 0:
		data['slack_name'] = form.cleaned_data['slack_name']

	return data, error_log

def sendRequest(data):
	API_ENDPOINT = "http://144.167.35.49:5000/instantcrawl"
	r = requests.post(url = API_ENDPOINT, data = data)
	return r

# Instant Crawler Page
@login_required(login_url='/YTAdminConsole/login/')
def addToInstantCrawler(request):
	error_log = []
	# If this is a POST request we need to process the form data
	if request.method == 'POST':
        # Create a form instance and populate it with data from the request:
		form = AddContentForm(request.POST)
		if form.is_valid():
			try:
				data, error_log = buildRequest(form)
				sendRequest(data)
				messages.success(request, "The content has been successfully added to the instant crawler.")
				logger.info("YT Admin Page - content Page -- instant crawler entry added successfully")
			except ValidationError as e:
				messages.error(request, e.messages)
				logger.info("YT Admin Page - Validation Error")
		else:
			messages.error(request, "An error occured while adding the content to the instant crawler.")
			logger.info("YT Admin Page - Error occured")
	# Clear the form
	form = AddContentForm()
	return render(request, 'YTAdminConsole/addToInstantCrawler.html',
		{'form': form, 'error_log': error_log})
