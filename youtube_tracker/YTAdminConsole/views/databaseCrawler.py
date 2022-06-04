from django.shortcuts import render
from django.core.exceptions import ValidationError
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core import serializers

from ..models import CrawlerTask
from ..forms import AddContentForm
from .lib import getIDs, getDailyIDs

import json, logging

logger = logging.getLogger(__name__)

def saveToDatabaseCrawler(form):
	error_log = []
	channel_ids, video_ids, keyword_ids, error_buff = getIDs(form)
	if len(error_buff) > 0: error_log += ['Regular crawler: ' + ','.join(error_buff)]
	daily_video_ids, error_buff = getDailyIDs(form)
	if len(error_buff) > 0: error_log += ['Daily crawler: ' + ','.join(error_buff)]

	obj, created = CrawlerTask.objects.using('crawler_tasks').update_or_create(
		task_name = form.cleaned_data['run_name'],
		defaults={
			'get_related_videos': form.cleaned_data['get_related_videos'],
			'get_comments': form.cleaned_data['get_comments'],
			'channels': json.loads(json.dumps(channel_ids)) if len(channel_ids) > 0 else None,
			'videos': json.loads(json.dumps(video_ids)) if len(video_ids) > 0 else None,
			'keywords': json.loads(json.dumps(keyword_ids)) if len(keyword_ids) > 0 else None,
			'videos_daily': json.loads(json.dumps(daily_video_ids)) if len(daily_video_ids) > 0 else None,
		}
	)
	return error_log

@login_required(login_url='/YTAdminConsole/login/')
def addToDatabaseCrawler(request):
	error_log = []
	# If this is a POST request we need to process the form data
	if request.method == 'POST':
        # Create a form instance and populate it with data from the request:
		form = AddContentForm(request.POST)
		if form.is_valid():
			try:
				error_log = saveToDatabaseCrawler(form)
				messages.success(request, "The content has been successfully added to the crawler pipeline.")
				logger.info("YT Admin Page - content Page -- database crawler entry added successfully")
			except ValidationError as e:
				messages.error(request, e.messages)
				logger.info("YT Admin Page - Validation Error")
		else:
			messages.error(request, "An error occured while adding the content to the crawler pipeline.")
			logger.info("YT Admin Page - Error occured")
	# Clear the form
	form = AddContentForm()
	tasks = CrawlerTask.objects.using('crawler_tasks').all()
	tasksJSON = serializers.serialize("json", tasks)
	return render(request, 'YTAdminConsole/addToDatabaseCrawler.html',
		{'form': form, 'tasks': tasksJSON, 'error_log': error_log})
